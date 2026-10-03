import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Browser checks use controlled API responses and never write to the real shop.
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()
const origin = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const user = {
  name: 'Test Owner',
  email: 'owner@example.test',
  phone: '0780000000',
}
const product = {
  id: 'p1',
  name: 'Sparkling Water',
  category_id: 'c1',
  category_name: 'Water',
  description: '',
  units_per_pack: 12,
  selling_price: 1000,
  current_stock: 5,
  low_stock_level: 10,
  is_active: true,
}
const summary = {
  cost_of_items_sold: 1700, items_purchased: 12, damaged_items: 1, out_of_stock_count: 0, cash: 2000, mobile_money: 0, bank: 0,
  sales_revenue: 2000,
  purchases: 12000,
  expenses: 500,
  profit_loss: -300,
  damaged_loss: 100,
  items_sold: 2,
  current_stock: 5,
  low_stock_count: 1,
}
const now = new Date().toISOString()
const transaction = {
  id: 't1',
  sale_date: now,
  purchase_date: now,
  supplier_name: 'Local Supplier',
  payment_method: 'cash',
  total_amount: 2000,
  notes: 'Test receipt',
  items: [
    {
      id: 'i1',
      product_name: 'Sparkling Water',
      quantity: 2,
      selling_price_per_item: 1000,
      line_total: 2000,
      packs: 1,
      units_per_pack: 12,
      total_items: 12,
      price_per_pack: 12000,
      price_per_item: 1000,
      total_cost: 12000,
    },
  ],
}
const db = {
  products: [product],
  categories: [{ id: 'c1', name: 'Water', description: '' }],
  suppliers: [
    { id: 's1', name: 'Local Supplier', phone: '', email: '', address: '' },
  ],
  expenses: [],
  'damaged-items': [],
  'owner-money': [
    {
      id: 'm1',
      type: 'money_added',
      amount: 50000,
      notes: 'Opening money',
      entry_date: now,
    },
  ],
  purchases: [transaction],
  sales: [transaction],
}
const writes = []
let expire = false
await page.route('**/api/v1/**', async (route) => {
  const request = route.request()
  const path = new URL(request.url()).pathname.replace('/api/v1/', '')
  const [resource, id] = path.split('/')
  const method = request.method()
  const send = (data, status = 200) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  if (expire && resource !== 'auth')
    return send({ error: 'session expired' }, 401)
  if (path === 'auth/login' || path === 'auth/setup')
    return send({ token: 'test-token', user })
  if (resource === 'auth') return send(user)
  assert.equal(request.headers().authorization, 'Bearer test-token')
  if (path === 'reports/summary') return send(summary)
  if (path === 'reports/print') return send({title:'Test report',period:{from:now,to:now},generated_at:now,summary,history:[],monthly:[]})
  if (path === 'reports/dashboard')
    return send({
      summary,
      inventory_value: 5000,
      profit_margin: -15,
      top_products: [
        {
          product_id: 'p1',
          product_name: product.name,
          quantity: 2,
          revenue: 2000,
        },
      ],
    })
  if (path === 'history')
    return send([
      ...(db['owner-money'] ?? []).map(r => ({id:r.id,type:r.type,date:r.entry_date,description:r.notes,amount:r.amount})),
      {
        id: 't1',
        type: 'sale',
        date: now,
        description: 'Water sold',
        amount: 2000,
        reference_id: 't1',
      },
    ])
  if (method !== 'GET') {
    const body = request.postDataJSON()
    writes.push({ path, method, body })
    if (resource === 'categories' && method === 'DELETE')
      return send({ error: 'category is being used by products' }, 409)
    if (resource === 'sales' || resource === 'purchases')
      return send(transaction, 201)
    if (resource === 'products') {
      if (method === 'POST') {
        const created = { ...product, ...body, id: 'p2', current_stock: 0 }
        db.products.push(created)
        return send(created, 201)
      }
      if (method === 'PUT')
        Object.assign(
          db.products.find((p) => p.id === id),
          body,
        )
      if (method === 'PATCH')
        db.products.find((p) => p.id === id).is_active = false
      return send(db.products.find((p) => p.id === id))
    }
    const created = { ...body, id: `test-${writes.length}` }
    db[resource]?.push(created)
    return send(created, 201)
  }
  return send(id ? transaction : (db[resource] ?? []))
})
async function navigate(path) {
  await page.goto(`${origin}${path}`)
  await page.waitForLoadState('networkidle')
}
async function click(name) {
  await page.getByRole('button', { name, exact: true }).click()
}
async function close() {
  await click('Close dialog')
}
try {
  await navigate('/products')
  assert.match(page.url(), /\/login$/)
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await click('Sign in')
  await page.waitForURL('**/dashboard')
  await page.getByText('Loss', { exact: true }).waitFor()
  assert.equal(
    await page
      .locator('.sidebar')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(15, 23, 42)',
  )
  assert.equal(
    await page
      .locator('.bg-surface')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(255, 255, 255)',
  )
  const routes = [
    'dashboard',
    'products',
    'categories',
    'suppliers',
    'purchases',
    'sales',
    'expenses',
    'damaged-items',
    'owner-money',
    'history',
    'reports',
    'profile',
  ]
  for (const width of process.env.SKIP_LAYOUT
    ? []
    : [320, 375, 768, 1024, 1440]) {
    console.log('Checking width', width)
    await page.setViewportSize({ width, height: 900 })
    for (const route of routes) {
      await navigate(`/${route}`)
      assert.equal(
        await page.locator('[role="alert"]').count(),
        0,
        `${route} error at ${width}`,
      )
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflows at ${width}`,
      )
    }
    if (width < 768) {
      await click('Open menu')
      assert.equal(
        await page.locator('.mobile-drawer').evaluate((el) => el.open),
        true,
      )
      await page
        .locator('.mobile-drawer')
        .getByRole('link', { name: 'Products', exact: true })
        .click()
      assert.equal(
        await page.locator('.mobile-drawer').evaluate((el) => el.open),
        false,
      )
    }
  }
  await navigate('/products')
  await click('Add Product')
  await page.getByLabel('Product Name').fill('Orange Juice')
  await page.getByLabel('Category', { exact: true }).selectOption('c1')
  await page.getByLabel('Selling Price per Item').fill('1500')
  await click('Save')
  await page.getByRole('cell', { name: 'Orange Juice', exact: true }).waitFor()
  const created = writes.find(
    (w) => w.path === 'products' && w.method === 'POST',
  )
  assert.equal('current_stock' in created.body, false)
  assert.equal(typeof created.body.selling_price, 'number')
  await navigate('/categories')
  await click('Delete')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete', exact: true })
    .click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'being used by products' })
    .waitFor()
  await close()
  await navigate('/purchases')
  await click('Record Purchase')
  await page.getByLabel('Supplier', { exact: true }).selectOption('s1')
  await page.getByLabel('Product', { exact: true }).selectOption('p1')
  await page.getByLabel('Price per Pack').fill('12000')
  await click('+ Add Another Product')
  await page.getByLabel('Product', { exact: true }).nth(1).selectOption('p2')
  await page.getByLabel('Price per Pack').nth(1).fill('15000')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Record Purchase', exact: true })
    .click()
  await page.getByRole('heading', { name: 'Purchase Details' }).waitFor()
  assert.equal(writes.find((w) => w.path === 'purchases').body.items.length, 2)
  await close()
  await navigate('/sales')
  await click('Record Sale')
  await page.getByLabel('Product', { exact: true }).selectOption('p1')
  await page.getByLabel('Quantity', { exact: true }).fill('4')
  await click('+ Add Another Item')
  await page.getByLabel('Product', { exact: true }).nth(1).selectOption('p1')
  await page.getByLabel('Quantity', { exact: true }).nth(1).fill('4')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Record Sale', exact: true })
    .click()
  await page.getByRole('alert').filter({ hasText: 'Only 5 items' }).waitFor()
  assert.equal(writes.filter((w) => w.path === 'sales').length, 0)
  await page.getByLabel('Quantity', { exact: true }).nth(1).fill('1')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Record Sale', exact: true })
    .click()
  await page.getByRole('heading', { name: 'Sale Receipt' }).waitFor()
  await close()
  await navigate('/history')
  await page.getByLabel('Type', { exact: true }).selectOption('money_added')
  await page.getByRole('cell', { name: 'Opening money' }).waitFor()
  await navigate('/reports')
  await page.getByText('Loss', { exact: true }).waitFor()
  await page.getByLabel('Period', { exact: true }).selectOption('custom')
  await page.getByLabel('From Date').fill('2026-01-01')
  await page.waitForLoadState('networkidle')
  for (const [resource, action, values] of [
    [
      'suppliers',
      'Add Supplier',
      { Name: 'New Supplier', Phone: '0780000001' },
    ],
    ['categories', 'Add Category', { Name: 'Juice' }],
    [
      'expenses',
      'Add Expense',
      { Name: 'Transport', Category: 'Delivery', Amount: '2000' },
    ],
    [
      'owner-money',
      'Record Owner Money',
      { Amount: '10000', Notes: 'Added money' },
    ],
  ]) {
    await navigate(`/${resource}`)
    await click(action)
    for (const [label, value] of Object.entries(values))
      await page.getByLabel(label, { exact: true }).fill(value)
    await click('Save')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.ok(writes.some((w) => w.path === resource && w.method === 'POST'))
  }
  await navigate('/expenses')
  await click('Edit')
  await page.getByLabel('Amount', { exact: true }).fill('2500')
  await click('Save')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(
    writes.find((w) => w.path.startsWith('expenses/') && w.method === 'PUT')
      .body.amount,
    2500,
  )
  await navigate('/damaged-items')
  await click('Record Damaged Item')
  await page.getByLabel('Product', { exact: true }).selectOption('p1')
  await page.getByLabel('Quantity', { exact: true }).fill('1')
  await page.getByLabel('Reason', { exact: true }).fill('Broken bottle')
  await click('Save')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(
    'total_loss' in writes.find((w) => w.path === 'damaged-items').body,
    false,
  )
  await navigate('/profile')
  assert.equal(
    await page.getByLabel('Email', { exact: true }).getAttribute('readonly'),
    '',
  )
  await page.getByLabel('Name', { exact: true }).fill('Updated Owner')
  await click('Update Profile')
  await page.getByText('Profile updated.', { exact: true }).waitFor()
  await page.getByLabel('Current password', { exact: true }).fill('password123')
  await page.getByLabel('New password', { exact: true }).fill('password456')
  await click('Change Password')
  await page.getByText('Password changed.', { exact: true }).waitFor()
  expire = true
  await navigate('/products')
  await page.waitForURL('**/login')
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem('bevshop-token')),
    null,
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: 12 routes at 5 widths; login/guard/401; drawer; product creation; friendly errors; multi-item purchase; aggregate sale stock validation; receipt; history; reports; no browser exceptions.',
  )
} finally {
  await browser.close()
}
