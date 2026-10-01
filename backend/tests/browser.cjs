const {randomUUID}=require('node:crypto');
const fs=require('node:fs');
const bcrypt=require('bcryptjs');
const express=require('express');
const {chromium,expect}=require('@playwright/test');
const {createTestApp}=require('./support/database');
async function listen(app){const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));return server;}
async function run(){
 fs.mkdirSync('artifacts',{recursive:true});
 const staticApp=express();staticApp.use(express.static('P:/BevShopFe/build'));staticApp.get('*',(req,res)=>res.sendFile('P:/BevShopFe/build/index.html'));
 const frontend=await listen(staticApp);process.env.FRONTEND_URL=`http://127.0.0.1:${frontend.address().port}`;
 const {app,database}=await createTestApp();const api=await listen(app);
 const email='browser@example.com',password=randomUUID(),id=randomUUID();
 await database.query('INSERT INTO users(id,name,email,password) VALUES($1,$2,$3,$4)',[id,'Shop Owner',email,await bcrypt.hash(password,10)]);await database.query('UPDATE settings SET owner_id=$1',[id]);
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{const url=new URL(route.request().url());const response=await route.fetch({url:`http://127.0.0.1:${api.address().port}${url.pathname}${url.search}`});await route.fulfill({response});});
 const click=label=>page.getByRole('button',{name:label,exact:true}).click();
 const link=label=>page.getByRole('link',{name:label,exact:true}).click();
 const field=(label,value)=>page.getByLabel(label,{exact:true}).fill(value);
 const modal=()=>page.getByRole('dialog');
 try{
  await page.goto(`http://127.0.0.1:${frontend.address().port}/login`);await page.locator('input[name=email]').fill(email);await page.locator('input[name=password]').fill(password);await page.getByRole('button',{name:/^sign in$/i}).click();
  await expect(page.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();
  await link('Categories');await click('Add Category');await field('Category name','Beverages');await click('Save category');await expect(modal()).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Category saved.'})).toBeVisible();
  await link('Products');await expect(page.getByText('Category saved.',{exact:true})).toHaveCount(0);
  for(const name of ['Cola','Water']){await click('Add Product');await field('Product name',name);await page.locator('select[name=categoryId]').selectOption({label:'Beverages'});await field('Items per pack',name==='Cola'?'24':'12');await field('Selling price per item (RWF)',name==='Cola'?'700':'500');await click('Save product');await expect(modal()).toHaveCount(0);}
  await click('Add Product');await field('Product name',' cola ');await field('Selling price per item (RWF)','700');await click('Save product');await expect(page.getByRole('alert').filter({hasText:'Product already exists.'})).toBeVisible();await expect(modal().getByRole('heading')).toBeVisible();await expect(page.getByText('Product saved.',{exact:true})).toHaveCount(0);await click('Close');await page.getByRole('alert').locator('../..').getByRole('button',{name:'Dismiss notification'}).click();
  await link('Purchases');await click('Add Supplier');await field('Supplier name','Wholesaler');await click('Save supplier');await expect(modal()).toHaveCount(0);
  await click('Record Purchase');await page.locator('select[name=supplierId]').selectOption({label:'Wholesaler'});await modal().getByLabel('Product',{exact:true}).selectOption({label:'Cola'});await field('Packs','10');await field('Price per pack (RWF)','12000');await click('Add another product');await modal().getByLabel('Product',{exact:true}).nth(1).selectOption({label:'Water'});await modal().getByLabel('Packs',{exact:true}).nth(1).fill('2');await modal().getByLabel('Price per pack (RWF)',{exact:true}).nth(1).fill('2400');await click('Save purchase');await expect(modal()).toHaveCount(0);await expect(page.getByRole('cell',{name:'264',exact:true})).toBeVisible();
  await link('Sales');await click('Record Sale');await modal().getByLabel('Product',{exact:true}).selectOption({label:'Cola (240 available)'});await field('Individual items sold','8');await modal().getByLabel('Payment',{exact:true}).selectOption('mobile_money');await click('Save sale');await expect(modal()).toHaveCount(0);await expect(page.getByText('Sale recorded successfully.',{exact:true})).toBeVisible();
  await expect(page.getByText('Sale recorded successfully.',{exact:true})).toHaveCount(0,{timeout:8000});
  await click('View');await expect(modal()).toContainText('Grand total: RWF 5,600');await click('Close');
  await link('Expenses');await click('Add Expense');await field('Expense name','Transport');await field('Amount (RWF)','1000');await click('Save expense');await expect(modal()).toHaveCount(0);await click('Edit');await field('Amount (RWF)','500');await click('Save expense');await expect(modal()).toHaveCount(0);
  await link('Damaged Items');await click('Record Damaged Item');await modal().getByLabel('Product',{exact:true}).selectOption({label:'Cola (232 available)'});await field('Quantity','2');await field('Reason (optional)','Broken');await click('Save damaged items');await expect(modal()).toHaveCount(0);
  await link('Owner Money');await click('Record Owner Money');await field('Amount (RWF)','100000');await click('Save owner money');await expect(modal()).toHaveCount(0);
  await link('Reports');await expect(page.getByText('RWF 100',{exact:true}).first()).toBeVisible();await page.screenshot({path:'artifacts/notebook-reports.png',fullPage:true});
  await link('History');await expect(page.getByRole('cell',{name:'Money Added',exact:true})).toBeVisible();await expect(page.getByRole('cell',{name:'Damaged',exact:true})).toBeVisible();
  await link('Products');await expect(page.getByRole('cell',{name:'230',exact:true})).toBeVisible();await page.screenshot({path:'artifacts/notebook-products.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
  await page.screenshot({path:'artifacts/notebook-mobile.png',fullPage:true});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('Browser passed: notebook workflow, duplicate error, toast expiry/navigation, profit, details and mobile layout.');
 }catch(e){fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/notebook-browser-failure.png',fullPage:true});throw e;}
 finally{await browser.close();await new Promise(r=>frontend.close(r));await new Promise(r=>api.close(r));await database.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
