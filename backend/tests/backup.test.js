const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {randomUUID,randomBytes}=require('node:crypto');const {PGlite}=require('@electric-sql/pglite');
test('encrypted snapshot restores every table exactly and refuses nonempty targets or altered ciphertext',async()=>{
  const {createTestApp}=require('./support/database');const {database}=await createTestApp();const target=new PGlite();
  const {snapshot,encrypt,decrypt,restoreData}=require('../services/backup');
  process.env.BACKUP_KEY=randomBytes(32).toString('hex');
  try{
    const owner=randomUUID(),product=randomUUID();
    await database.query("INSERT INTO users(id,email,name,password) VALUES($1,'backup@example.com','Backup Owner','hashed')",[owner]);
    await database.query('UPDATE settings SET owner_id=$1',[owner]);
    await database.query("INSERT INTO products(id,name,units_per_pack,selling_price) VALUES($1,'Precision test',12,2500)",[product]);
    await database.transaction(db=>require('../services/notebook').save(db,'purchases',{items:[{productId:product,packs:2,pricePerPack:'99999999999.123456'}]},null,randomUUID()));
    const data=await snapshot(database);const encrypted=encrypt(data);assert.ok(!encrypted.includes(Buffer.from('backup@example.com')));
    const damaged=Buffer.from(encrypted);damaged[damaged.length-1]^=1;assert.throws(()=>decrypt(damaged));
    await target.exec(fs.readFileSync('models/schema.sql','utf8'));
    const restored=await target.transaction(db=>restoreData(db,decrypt(encrypted)));
    assert.equal(restored.products,1);assert.equal(restored.purchases,1);assert.equal((await target.query('SELECT total_amount FROM purchases')).rows[0].total_amount,'199999999998.246912');
    await assert.rejects(target.transaction(db=>restoreData(db,data)),/empty/);
  }finally{await database.close();await target.close();}
});
