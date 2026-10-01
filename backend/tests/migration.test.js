const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {randomUUID,randomBytes}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const {post}=require('../services/accounting');
const {migrateNotebook}=require('../services/notebook-migration');
test('legacy migration preserves stock, sold costs, all original records and archived backup restoration',async()=>{
 const db=new PGlite(),restored=new PGlite();
 try{
  await db.exec(fs.readFileSync('models/legacy-schema.sql','utf8'));
  const owner=randomUUID(),product=randomUUID();
  await db.query("INSERT INTO users(id,email,username,password,first_name,last_name,role) VALUES($1,'owner@test.com','owner','hash','Owner','Test','ADMIN')",[owner]);
  await db.query('UPDATE settings SET owner_id=$1',[owner]);
  await db.query("INSERT INTO products(id,name,barcode,units_per_pack,selling_price) VALUES($1,'Cola',$2,24,700)",[product,product]);
  const write=(kind,body)=>db.transaction(tx=>post(tx,kind,{requestKey:randomUUID(),...body},owner));
  await write('purchase',{productId:product,packs:10,totalCost:120000});
  await write('sale',{items:[{productId:product,quantity:8}]});
  const cancelled=await write('purchase',{productId:product,packs:1,totalCost:12000});
  await write('reversal',{transactionId:cancelled.id,notes:'Duplicate purchase'});
  await write('stock_count',{productId:product,expectedQuantity:232,actualQuantity:240,unitCost:500,notes:'Found eight bottles'});
  const result=await db.transaction(migrateNotebook);assert.equal(result.migrated,true);
  assert.equal((await db.query('SELECT current_stock FROM products')).rows[0].current_stock,240);
  assert.equal(Number((await db.query('SELECT line_cost FROM sale_items')).rows[0].line_cost),4000);
  assert.equal((await db.query('SELECT count(*) FROM purchases')).rows[0].count,1);
  assert.equal((await db.query('SELECT count(*) FROM bevshop_legacy.transactions')).rows[0].count,5);
  assert.equal((await db.transaction(migrateNotebook)).migrated,false);
  await assert.rejects(db.query("UPDATE bevshop_legacy.products SET name='changed'"),/notebook application/);
  const {snapshot,restoreData,encrypt,decrypt}=require('../services/backup');process.env.BACKUP_KEY=randomBytes(32).toString('hex');
  const data=await snapshot(db);assert.equal(data.archive.transactions.length,5);
  await restored.exec(fs.readFileSync('models/schema.sql','utf8'));
  await restored.transaction(tx=>restoreData(tx,decrypt(encrypt(data))));
  assert.equal((await restored.query('SELECT current_stock FROM products')).rows[0].current_stock,240);
  assert.equal((await restored.query('SELECT count(*) FROM bevshop_legacy.transactions')).rows[0].count,5);
 }finally{await db.close();await restored.close();}
});
