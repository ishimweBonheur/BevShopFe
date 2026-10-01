require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({connectionString:process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL});
async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set');
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(85215249)');
    const legacy=(await client.query("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='bevshop' AND table_name='products' AND column_name='quantity') AS exists")).rows[0].exists;
    if(legacy) {
      if(!process.argv.includes('--cutover')) throw Error('Legacy data detected. Stop the old app, take and verify an encrypted backup, then run with --cutover. See docs/notebook-migration.md.');
      // Backup is taken under the same posting lock as legacy writes.
      await client.query('SELECT pg_advisory_xact_lock(85215250)');
      await client.query('SET LOCAL search_path TO bevshop,public');
      await client.query('LOCK TABLE users,settings,categories,products,suppliers,transactions,transaction_items,stock_movements,journal_lines,stock_counts,cash_reconciliations,recovery_codes IN ACCESS EXCLUSIVE MODE');
      const backup=require('../services/backup');
      const data=await backup.snapshot(client);
      const fs=require('node:fs/promises'),path=require('node:path');
      await fs.mkdir(backup.directory(),{recursive:true});
      const file=path.join(backup.directory(),'bevshop-pre-notebook-'+Date.now()+'.bevbackup');
      await fs.writeFile(file,backup.encrypt(data),{mode:0o600,flag:'wx'});
      const {PGlite}=require('@electric-sql/pglite');const check=new PGlite();
      try{await check.exec(await fs.readFile(path.join(__dirname,'../models/legacy-schema.sql'),'utf8'));await check.transaction(tx=>backup.restoreData(tx,backup.decrypt(require('node:fs').readFileSync(file))));}finally{await check.close();}
      console.log('Verified pre-migration backup:',path.basename(file));
    }
    console.log(await require('../services/notebook-migration').migrateNotebook(client));
    await client.query('COMMIT');
  } catch(error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
if (require.main === module) migrate().then(() => console.log('PostgreSQL schema ready'))
  .catch(error => { console.error('Migration failed:', error.code || error.message); process.exitCode = 1; })
  .finally(() => pool.end());
module.exports = { migrate };
