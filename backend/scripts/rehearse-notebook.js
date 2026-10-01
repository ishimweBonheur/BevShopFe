require('dotenv').config();
const fs=require('node:fs/promises'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const {decrypt,restoreData,status,directory}=require('../services/backup');
const {migrateNotebook}=require('../services/notebook-migration');
async function run(){
 const name=process.argv[2]||(await status()).files[0];if(!name)throw Error('Create a backup first.');
 const data=decrypt(await fs.readFile(path.join(directory(),name)));
 const db=new PGlite();try{
  await db.exec(await fs.readFile(path.join(__dirname,data.version===1?'../models/legacy-schema.sql':'../models/schema.sql'),'utf8'));
  await db.transaction(tx=>restoreData(tx,data));
  const result=await db.transaction(migrateNotebook);
  const report=await require('../services/notebook').report(db,{period:'yearly'});
  const output={backup:name,checkedAt:new Date().toISOString(),...result,report:{sales:report.sales,costOfSoldItems:report.costOfSoldItems,expenses:report.expenses,damagedLosses:report.damagedLosses,profit:report.profit,currentStock:report.currentStock}};
  await fs.mkdir(path.join(__dirname,'../artifacts'),{recursive:true});
  await fs.writeFile(path.join(__dirname,'../artifacts/notebook-rehearsal.json'),JSON.stringify(output,null,2));
  console.log(JSON.stringify(output,null,2));
 }finally{await db.close();}
}
run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>require('../models').pool.end());
