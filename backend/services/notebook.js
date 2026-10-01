const { randomUUID, createHash } = require('node:crypto');
const { Decimal, money, integer, fail } = require('../helper/money');
const { text } = require('../helper/http');
const uuid = value => { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')) fail('Please choose an existing item.'); return value; };
const optional = value => text(value ?? '', 'Description', false);
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const entities = {
 purchases: ['purchase_date', 'total_amount'], sales: ['sale_date', 'total_amount'],
 expenses: ['expense_date', 'amount'], 'damaged-items': ['damaged_date', 'total_loss'], 'owner-money': ['entry_date', 'amount']
};
const tableFor = path => path.replaceAll('-', '_');
async function entryDate(db, value) {
 if (!value) return (await db.query('SELECT clock_timestamp() AS date')).rows[0].date;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) fail('Choose a valid date.');
 const row = (await db.query("SELECT to_char(now() AT TIME ZONE 'Africa/Kigali','YYYY-MM-DD') AS today, $1::date::timestamp AT TIME ZONE 'Africa/Kigali' AS date", [value])).rows[0];
 if (value > row.today) fail('The date cannot be in the future.');
 return value === row.today ? (await db.query('SELECT clock_timestamp() AS date')).rows[0].date : row.date;
}
async function detail(db, resource, id) {
 if (!entities[resource]) fail('Page not found.',404);
 const row = (await db.query(`SELECT * FROM ${tableFor(resource)} WHERE id=$1`, [uuid(id)])).rows[0];
 if (!row) fail('Entry not found.',404);
 if (['purchases','sales'].includes(resource)) {
  const singular = resource === 'purchases' ? 'purchase' : 'sale';
  row.items = (await db.query(`SELECT * FROM ${singular}_items WHERE ${singular}_id=$1 ORDER BY product_name`,[id])).rows;
 }
 return row;
}
async function save(db, resource, body, id, key) {
 if(!body || typeof body!=='object' || Array.isArray(body)) fail('Provide the entry details.');
 await db.query('SELECT pg_advisory_xact_lock(85215250)');
 const fingerprint = createHash('sha256').update(JSON.stringify(canonical({resource,body,id:id || null}))).digest('hex');
 if (key) {
  uuid(key);
  const receipt = (await db.query('SELECT * FROM request_receipts WHERE id=$1',[key])).rows[0];
  if (receipt) { if (receipt.fingerprint !== fingerprint) fail('This entry changed. Please start a new entry.',409); return receipt.response; }
 }
 let result;
 if (['categories','products','suppliers'].includes(resource)) {
  const name=text(body.name,'Name');
  const label={categories:'Category',products:'Product',suppliers:'Supplier'}[resource];
  if ((await db.query(`SELECT id FROM ${resource} WHERE lower(trim(name))=lower(trim($1)) AND ($2::uuid IS NULL OR id<>$2)`,[name,id || null])).rows.length) fail(`${label} already exists.`,409);
  let columns, params;
  if (resource==='categories') { columns=['name','description']; params=[name,optional(body.description)]; }
  if (resource==='suppliers') { columns=['name','phone','email','address','notes']; params=[name,...['phone','email','address','notes'].map(k=>optional(body[k]))]; }
  if (resource==='products') {
   columns=['name','category_id','description','units_per_pack','selling_price','low_stock_level'];
   params=[name,body.categoryId ? uuid(body.categoryId) : null,optional(body.description),integer(body.unitsPerPack,'Items per pack'),money(body.sellingPrice,'Selling price').toFixed(6),integer(body.lowStockLevel ?? 0,'Low stock at',0)];
  }
  if (id) result=(await db.query(`UPDATE ${resource} SET ${columns.map((c,i)=>`${c}=$${i+1}`).join(',')},updated_at=now() WHERE id=$${params.length+1} RETURNING *`,[...params,uuid(id)])).rows[0];
  else result=(await db.query(`INSERT INTO ${resource}(id,${columns.join(',')}) VALUES($1,${params.map((_,i)=>`$${i+2}`).join(',')}) RETURNING *`,[randomUUID(),...params])).rows[0];
  if (!result) fail(`${label} not found.`,404);
 } else {
  if (!entities[resource]) fail('Page not found.',404);
  if (id && resource!=='expenses') fail('This entry cannot be edited.',405);
  const date=await entryDate(db,body.date);
  const entryId=id ? uuid(id) : randomUUID();
  if (resource==='expenses') {
   const params=[text(body.name,'Expense name'),optional(body.category),optional(body.description),money(body.amount).toFixed(6),date,entryId];
   result=(await db.query(id ? 'UPDATE expenses SET name=$1,category=$2,description=$3,amount=$4,expense_date=$5,updated_at=now() WHERE id=$6 RETURNING *' : 'INSERT INTO expenses(name,category,description,amount,expense_date,id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',params)).rows[0];
   if (!result) fail('Expense not found.',404);
  } else if (resource==='owner-money') {
   if (!['money_added','money_taken'].includes(body.type)) fail('Choose Money Added or Money Taken.');
   result=(await db.query('INSERT INTO owner_money(id,type,amount,notes,entry_date) VALUES($1,$2,$3,$4,$5) RETURNING *',[entryId,body.type,money(body.amount).toFixed(6),optional(body.notes),date])).rows[0];
  } else {
   const lines=resource==='damaged-items' ? [{productId:body.productId,quantity:body.quantity}] : body.items;
   if (!Array.isArray(lines) || !lines.length || lines.length>100) fail('Add between 1 and 100 products.');
   const seen=new Set(); let total=new Decimal(0);
   const saved=[];
   for (const line of lines) {
    if(!line || typeof line!=='object' || Array.isArray(line)) fail('Choose a product and quantity for each line.');
    const productId=uuid(line.productId);
    if(seen.has(productId)) fail('Combine the quantities for the same product.'); seen.add(productId);
    const p=(await db.query('SELECT * FROM products WHERE id=$1 AND is_active FOR UPDATE',[productId])).rows[0];
    if(!p) fail('Product not found.',404);
    // Backdated stock entries must not rewrite the costing of subsequent sales.
    const latest=(await db.query(`SELECT max(date) AS date FROM (
      SELECT purchase_date AS date FROM purchases JOIN purchase_items ON purchase_id=purchases.id WHERE product_id=$1
      UNION ALL SELECT sale_date FROM sales JOIN sale_items ON sale_id=sales.id WHERE product_id=$1
      UNION ALL SELECT damaged_date FROM damaged_items WHERE product_id=$1) dates`,[productId])).rows[0].date;
    if(latest && new Date(date)<new Date(latest)) fail('A newer entry exists for this product. Choose today or a later date.',409);
    if(resource==='purchases') {
     const packs=integer(line.packs,'Packs'), units=integer(line.unitsPerPack ?? p.units_per_pack,'Items per pack'), quantity=integer(packs*units,'Items received');
     const packPrice=money(line.pricePerPack,'Price per pack'), cost=packPrice.mul(packs).toDecimalPlaces(6), unit=packPrice.div(units).toDecimalPlaces(6);
     integer(p.current_stock+quantity,'Stock',0);
     saved.push([randomUUID(),entryId,p.id,p.name,packs,units,quantity,packPrice.toFixed(6),unit.toFixed(6),cost.toFixed(6)]);
     await db.query('UPDATE products SET current_stock=current_stock+$2,last_purchase_price_per_item=$3,updated_at=now() WHERE id=$1',[p.id,quantity,unit.toFixed(6)]); total=total.add(cost);
    } else {
     const quantity=integer(line.quantity);
     if(quantity>p.current_stock) fail(`Not enough stock. Only ${p.current_stock} items are available.`,409);
     const unit=new Decimal(p.last_purchase_price_per_item), cost=unit.mul(quantity).toDecimalPlaces(6);
     if(resource==='sales') {
      const price=money(line.sellingPrice ?? p.selling_price,'Selling price'), lineTotal=price.mul(quantity).toDecimalPlaces(6);
      saved.push([randomUUID(),entryId,p.id,p.name,quantity,price.toFixed(6),unit.toFixed(6),lineTotal.toFixed(6),cost.toFixed(6),lineTotal.minus(cost).toFixed(6)]); total=total.add(lineTotal);
     } else {
      result=(await db.query('INSERT INTO damaged_items(id,product_id,product_name,quantity,reason,cost_per_item,total_loss,damaged_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[entryId,p.id,p.name,quantity,optional(body.reason),unit.toFixed(6),cost.toFixed(6),date])).rows[0];
     }
     await db.query('UPDATE products SET current_stock=current_stock-$2,updated_at=now() WHERE id=$1',[p.id,quantity]);
    }
   }
   if(resource==='purchases') {
    await db.query('INSERT INTO purchases(id,supplier_id,purchase_date,total_amount,notes) VALUES($1,$2,$3,$4,$5)',[entryId,body.supplierId ? uuid(body.supplierId) : null,date,total.toFixed(6),optional(body.notes)]);
    for(const line of saved) await db.query('INSERT INTO purchase_items(id,purchase_id,product_id,product_name,packs,units_per_pack,total_items,price_per_pack,price_per_item,total_cost) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',line);
   } else if(resource==='sales') {
    const payment=body.paymentMethod || 'cash'; if(!['cash','mobile_money','bank'].includes(payment)) fail('Choose Cash, Mobile Money or Bank.');
    await db.query('INSERT INTO sales(id,sale_date,payment_method,total_amount,notes) VALUES($1,$2,$3,$4,$5)',[entryId,date,payment,total.toFixed(6),optional(body.notes)]);
    for(const line of saved) await db.query('INSERT INTO sale_items(id,sale_id,product_id,product_name,quantity,selling_price_per_item,cost_price_per_item,line_total,line_cost,line_profit) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',line);
   }
   if(resource!=='damaged-items') result=await detail(db,resource,entryId);
  }
 }
 if(key) await db.query('INSERT INTO request_receipts(id,fingerprint,response) VALUES($1,$2,$3)',[key,fingerprint,JSON.stringify(result)]);
 return result;
}
const historySql=`SELECT p.id,'Bought' AS type,p.purchase_date AS date,string_agg(i.product_name,', ' ORDER BY i.product_name) AS description,sum(i.total_items) AS quantity,p.total_amount AS amount,(sum(i.packs)::text || ' packs') AS details,'purchases' AS resource FROM purchases p JOIN purchase_items i ON i.purchase_id=p.id GROUP BY p.id
 UNION ALL SELECT s.id,'Sold',s.sale_date,string_agg(i.product_name,', ' ORDER BY i.product_name),sum(i.quantity),s.total_amount,CASE s.payment_method WHEN 'mobile_money' THEN 'Mobile Money' WHEN 'bank' THEN 'Bank' ELSE 'Cash' END,'sales' FROM sales s JOIN sale_items i ON i.sale_id=s.id GROUP BY s.id
 UNION ALL SELECT id,'Expense',expense_date,name,NULL,amount,COALESCE(NULLIF(description,''),category),'expenses' FROM expenses
 UNION ALL SELECT id,'Damaged',damaged_date,product_name,quantity,total_loss,reason,'damaged-items' FROM damaged_items
 UNION ALL SELECT id,CASE type WHEN 'money_added' THEN 'Money Added' ELSE 'Money Taken' END,entry_date,'Owner',NULL,amount,notes,'owner-money' FROM owner_money`;
async function list(db, resource, query={}) {
 const page=integer(query.page ?? 1,'Page'), limit=50, offset=(page-1)*limit;
 if(resource==='categories') return (await db.query('SELECT c.*,count(p.id)::integer AS products FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active GROUP BY c.id ORDER BY c.name')).rows;
 if(resource==='suppliers') return (await db.query('SELECT * FROM suppliers ORDER BY name')).rows;
 if(resource==='products') return (await db.query('SELECT p.id,p.name,p.category_id,c.name AS category_name,p.description,p.units_per_pack,p.selling_price,p.current_stock,p.low_stock_level,p.is_active FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.is_active ORDER BY p.name')).rows;
 if(resource==='history') {
  const filter=typeof query.type==='string' ? query.type : '';
  const rows=(await db.query(`SELECT *,count(*) OVER() AS total FROM (${historySql}) h WHERE ($1='' OR type=$1) ORDER BY date DESC,id DESC LIMIT $2 OFFSET $3`,[filter,limit,offset])).rows;
  return {list:rows,total:Number(rows[0]?.total || 0),page};
 }
 if(!entities[resource]) fail('Page not found.',404);
 const [date]=entities[resource];
 let joins='',select='t.*';
 if(resource==='purchases') { joins=' LEFT JOIN suppliers s ON s.id=t.supplier_id'; select+=",COALESCE(s.name,'') AS supplier_name,(SELECT count(*) FROM purchase_items WHERE purchase_id=t.id) AS products,(SELECT sum(total_items) FROM purchase_items WHERE purchase_id=t.id) AS quantity"; }
 if(resource==='sales') select+=',(SELECT sum(quantity) FROM sale_items WHERE sale_id=t.id) AS quantity';
 const rows=(await db.query(`SELECT ${select},count(*) OVER() AS total FROM ${tableFor(resource)} t${joins} ORDER BY ${date} DESC,t.id DESC LIMIT $1 OFFSET $2`,[limit,offset])).rows;
 return {list:rows,total:Number(rows[0]?.total || 0),page};
}
async function report(db, query={}) {
 const period=query.period || 'daily', units={daily:'day',weekly:'week',monthly:'month',yearly:'year'};
 let range;
 if(period==='custom') {
  for(const date of [query.startDate,query.endDate]) if(!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) fail('Choose valid start and end dates.');
  if(query.startDate>query.endDate) fail('Start date must precede end date.');
  range=(await db.query("SELECT $1::date::timestamp AT TIME ZONE 'Africa/Kigali' AS start, ($2::date+1)::timestamp AT TIME ZONE 'Africa/Kigali' AS finish",[query.startDate,query.endDate])).rows[0];
 } else {
  if(!units[period]) fail('Choose a valid report period.');
  range=(await db.query("SELECT date_trunc($1,now() AT TIME ZONE 'Africa/Kigali') AT TIME ZONE 'Africa/Kigali' AS start,(date_trunc($1,now() AT TIME ZONE 'Africa/Kigali')+('1 ' || $1)::interval) AT TIME ZONE 'Africa/Kigali' AS finish",[units[period]])).rows[0];
 }
 const args=[range.start,range.finish];
 const totals={};
 for(const [resource,[date,amount]] of Object.entries(entities)) {
  if(resource==='owner-money') continue;
  totals[resource]=(await db.query(`SELECT COALESCE(sum(${amount}),0) AS amount FROM ${tableFor(resource)} WHERE ${date}>=$1 AND ${date}<$2`,args)).rows[0].amount;
 }
 const sold=(await db.query('SELECT COALESCE(sum(i.line_cost),0) AS cost,COALESCE(sum(i.quantity),0) AS quantity FROM sale_items i JOIN sales s ON s.id=i.sale_id WHERE sale_date>=$1 AND sale_date<$2',args)).rows[0];
 const bought=(await db.query('SELECT COALESCE(sum(total_items),0) AS quantity FROM purchase_items i JOIN purchases p ON p.id=i.purchase_id WHERE purchase_date>=$1 AND purchase_date<$2',args)).rows[0];
 const stock=(await db.query('SELECT COALESCE(sum(current_stock),0) AS stock,count(*) FILTER(WHERE current_stock<=low_stock_level) AS low FROM products WHERE is_active')).rows[0];
 const damaged=(await db.query('SELECT COALESCE(sum(quantity),0) AS quantity FROM damaged_items WHERE damaged_date>=$1 AND damaged_date<$2',args)).rows[0];
 const owner=(await db.query("SELECT COALESCE(sum(amount) FILTER (WHERE type='money_added'),0) AS added,COALESCE(sum(amount) FILTER (WHERE type='money_taken'),0) AS taken FROM owner_money WHERE entry_date>=$1 AND entry_date<$2",args)).rows[0];
 const cashIn=new Decimal(totals.sales).plus(owner.added);
 const cashOut=new Decimal(totals.purchases).plus(totals.expenses).plus(owner.taken);
 const activity=(await db.query(`SELECT * FROM (${historySql}) h WHERE date>=$1 AND date<$2 ORDER BY date DESC,id DESC LIMIT 10`,args)).rows;
 const lowStockItems=(await db.query('SELECT name,current_stock,low_stock_level FROM products WHERE is_active AND current_stock<=low_stock_level ORDER BY current_stock,name')).rows;
 return {...range,timezone:'Africa/Kigali',sales:totals.sales,purchases:totals.purchases,expenses:totals.expenses,damagedLosses:totals['damaged-items'],costOfSoldItems:sold.cost,profit:new Decimal(totals.sales).minus(sold.cost).minus(totals.expenses).minus(totals['damaged-items']).toFixed(6),cashIn:cashIn.toFixed(6),cashOut:cashOut.toFixed(6),cashDifference:cashIn.minus(cashOut).toFixed(6),itemsSold:Number(sold.quantity),itemsPurchased:Number(bought.quantity),currentStock:Number(stock.stock),lowStockProducts:Number(stock.low),lowStockItems,damagedItems:Number(damaged.quantity),activity};
}
module.exports={save,list,detail,report,uuid};
