const fs=require('node:fs');
const path=require('node:path');
const schema=()=>fs.readFileSync(path.join(__dirname,'../models/schema.sql'),'utf8');
async function migrateNotebook(db){
 const legacy=(await db.query("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='bevshop' AND table_name='products' AND column_name='quantity') AS exists")).rows[0].exists;
 if(!legacy){await (db.exec ? db.exec(schema()) : db.query(schema()));return {migrated:false};}
 // Exclusive locks prevent the old application from writing between inspection and cutover.
 await db.query('LOCK TABLE bevshop.users,bevshop.settings,bevshop.categories,bevshop.products,bevshop.suppliers,bevshop.transactions,bevshop.transaction_items,bevshop.stock_movements,bevshop.journal_lines,bevshop.stock_counts,bevshop.cash_reconciliations,bevshop.recovery_codes IN ACCESS EXCLUSIVE MODE');
 const owner=(await db.query('SELECT owner_id FROM bevshop.settings WHERE id=1')).rows[0]?.owner_id;
 if(!owner&&(await db.query('SELECT id FROM bevshop.users LIMIT 1')).rows.length)throw Error('Migration requires an identified owner.');
 const counts=(await db.query('SELECT (SELECT count(*) FROM bevshop.products) AS products,(SELECT count(*) FROM bevshop.transactions) AS entries,(SELECT COALESCE(sum(quantity),0) FROM bevshop.products) AS stock')).rows[0];
 if((await db.query("SELECT 1 FROM information_schema.schemata WHERE schema_name='bevshop_legacy'")).rows.length)throw Error('An archive already exists; inspect it before migration.');
 await db.query('ALTER SCHEMA bevshop RENAME TO bevshop_legacy');
 await (db.exec ? db.exec(schema()) : db.query(schema()));
 await db.query(`INSERT INTO users(id,name,email,password,phone,token_version,created_at)
 SELECT id,trim(first_name||' '||last_name),email,password,phone,token_version,created_at FROM bevshop_legacy.users WHERE id=$1`,[owner]);
 await db.query('UPDATE settings SET owner_id=$1 WHERE id=1',[owner]);
 await db.query('INSERT INTO recovery_codes SELECT * FROM bevshop_legacy.recovery_codes WHERE user_id=$1',[owner]);
 await db.query('INSERT INTO categories(id,name,description) SELECT id,trim(name),description FROM bevshop_legacy.categories');
 await db.query('INSERT INTO suppliers(id,name,phone,email,address) SELECT id,trim(name),phone,email,address FROM bevshop_legacy.suppliers');
 await db.query(`INSERT INTO products(id,name,category_id,description,units_per_pack,selling_price,current_stock,low_stock_level,last_purchase_price_per_item,is_active,created_at)
 SELECT p.id,trim(p.name),p.category_id,p.description,p.units_per_pack,p.selling_price,p.quantity,p.low_stock_level,
 COALESCE((SELECT i.cost/i.quantity FROM bevshop_legacy.transaction_items i JOIN bevshop_legacy.transactions t ON t.id=i.transaction_id WHERE i.product_id=p.id AND t.kind='purchase' AND NOT EXISTS(SELECT 1 FROM bevshop_legacy.transactions r WHERE r.reversal_of=t.id) ORDER BY t.created_at DESC,t.id DESC LIMIT 1),p.last_purchase_cost),p.is_active,p.created_at FROM bevshop_legacy.products p`);
 // Cancelled pairs remain in the complete archive and are omitted from the restated notebook.
 const active="NOT EXISTS(SELECT 1 FROM bevshop_legacy.transactions r WHERE r.reversal_of=t.id)";
 await db.query(`INSERT INTO purchases(id,supplier_id,purchase_date,total_amount,notes,created_at) SELECT id,supplier_id,created_at,amount,notes,created_at FROM bevshop_legacy.transactions t WHERE kind='purchase' AND ${active}`);
 await db.query(`INSERT INTO purchase_items(id,purchase_id,product_id,product_name,packs,units_per_pack,total_items,price_per_pack,price_per_item,total_cost)
 SELECT i.id,i.transaction_id,i.product_id,i.product_name,i.packs,i.units_per_pack,i.quantity,i.cost/i.packs,i.cost/i.quantity,i.cost FROM bevshop_legacy.transaction_items i JOIN purchases p ON p.id=i.transaction_id`);
 await db.query(`INSERT INTO sales(id,sale_date,payment_method,total_amount,notes,created_at) SELECT id,created_at,payment_method,amount,notes,created_at FROM bevshop_legacy.transactions t WHERE kind='sale' AND ${active}`);
 await db.query(`INSERT INTO sale_items(id,sale_id,product_id,product_name,quantity,selling_price_per_item,cost_price_per_item,line_total,line_cost,line_profit)
 SELECT i.id,i.transaction_id,i.product_id,i.product_name,i.quantity,i.unit_price,i.cost/i.quantity,i.quantity*i.unit_price,i.cost,i.quantity*i.unit_price-i.cost FROM bevshop_legacy.transaction_items i JOIN sales s ON s.id=i.transaction_id`);
 await db.query(`INSERT INTO expenses(id,expense_date,name,category,description,amount,created_at) SELECT id,created_at,COALESCE(NULLIF(category,''),'Expense'),category,notes,amount,created_at FROM bevshop_legacy.transactions t WHERE kind='expense' AND ${active}`);
 await db.query(`INSERT INTO damaged_items(id,product_id,product_name,quantity,reason,cost_per_item,total_loss,damaged_date,created_at)
 SELECT i.id,i.product_id,i.product_name,i.quantity,t.notes,i.cost/i.quantity,i.cost,t.created_at,t.created_at FROM bevshop_legacy.transactions t JOIN bevshop_legacy.transaction_items i ON i.transaction_id=t.id WHERE t.kind='loss' AND ${active}`);
 await db.query(`INSERT INTO owner_money(id,type,amount,notes,entry_date,created_at) SELECT id,CASE kind WHEN 'capital' THEN 'money_added' ELSE 'money_taken' END,amount,notes,created_at,created_at FROM bevshop_legacy.transactions t WHERE kind IN ('capital','withdrawal') AND ${active}`);
 const current=(await db.query('SELECT count(*) AS products,COALESCE(sum(current_stock),0) AS stock FROM products')).rows[0];
 if(current.products!==counts.products||current.stock!==counts.stock)throw Error('Stock verification failed.');
 // Archive tables are preserved but cannot be mutated by stale application processes.
 await db.query(`CREATE OR REPLACE FUNCTION bevshop_legacy.notebook_readonly() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'The shop has moved to the notebook application. Reload the application.'; END $$`);
 const tables=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='bevshop_legacy'")).rows;
 for(const {tablename} of tables)await db.query(`CREATE TRIGGER notebook_readonly BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON bevshop_legacy."${tablename}" FOR EACH STATEMENT EXECUTE FUNCTION bevshop_legacy.notebook_readonly()`);
 return {migrated:true,...counts,archive:'bevshop_legacy'};
}
module.exports={migrateNotebook};
