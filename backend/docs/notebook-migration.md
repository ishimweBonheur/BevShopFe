# Notebook cutover

> **Status: applied to production on 1 October 2026.** The cutover (`node scripts/migrate.js --cutover`) completed successfully against the live database. Pre-migration encrypted backup: `backups/bevshop-pre-notebook-1790863267183.bevbackup` (verified by restoring it into isolated PostgreSQL). Old schema retained read-only as `bevshop_legacy`.

The application now uses the eleven business tables in `models/schema.sql`. Settings, recovery codes and request receipts are internal authentication/configuration/retry infrastructure. Money remains at six decimal places in storage so historical costs are not rounded away; the UI formats RWF amounts for reading.

## Inspected database (1 October 2026)

There is one user, two products, two categories, eight transactions, one physical stock correction, and no suppliers or cash reconciliations. One purchase has been cancelled. The stock correction raised stock from 140 to 500 items. These are existing records, not an empty development database.

## Conversion decisions

- Keep the owner account, password, token version and recovery codes. Any other historical users remain only in the archive. The active users table permits one owner and has no roles.
- Copy all categories, suppliers and products. Preserve current individual-item stock exactly, including previous stock corrections. Derive the latest purchase cost from the latest uncancelled purchase, falling back to the stored cost if there is no purchase.
- Copy completed, uncancelled purchases, sales, expenses, losses and owner money to their corresponding tables. Preserve original IDs, timestamps, names and stored sale costs.
- Preserve the entire old schema as `bevshop_legacy`, with writes blocked. Nothing is dropped.
- Omit cancelled pairs from the restated notebook. This can change old date-range reports when cancellation occurred in a different period. Original reports can still be reconstructed from the archive.
- Historical stock corrections stay in the archive. Current stock includes them, but the new profit calculation excludes old stock-count gains/shortages. They are not purchases, sales, or damage. Thus historical profit may differ from the old accounting report. No invented purchases or expenses are created.
- New sales and damaged items snapshot the latest purchase price per item. Old sales retain their actual stored costs. Purchases do not directly reduce profit. Backdated stock operations are rejected if a newer product entry exists.
- Reports use Kigali time, Monday-based weeks, and inclusive custom end dates. Stock cards always mean current stock, even in historical reports.

## Safe application

1. Review the conversion decisions above, build both apps and pass tests. Coordinate the frontend and backend release; the old API shapes are incompatible.
2. Stop writes from the old application. Do not deploy just the frontend against the old backend.
3. Ensure `BACKUP_KEY`, `DATABASE_URL` and preferably `DATABASE_URL_UNPOOLED` are configured. Keep the backup key separately.
4. Run `node scripts/migrate.js --cutover`. Plain `npm run db:migrate` refuses to convert existing legacy data. The cutover acquires locks, writes an encrypted pre-migration snapshot, restores and verifies that snapshot in isolated PostgreSQL, then converts in one transaction. A failure rolls back the database conversion.
5. Check the printed product/stock counts, start the new backend and frontend, and verify the owner can sign in and see stock/history/reports.
6. Create a new backup and run `npm run db:restore-check`. Version 2 backups include the archived schema. Version 1 backups remain restorable using the legacy schema.

For rollback, stop writes and restore the verified pre-migration backup into a separate empty database using `RESTORE_DATABASE_URL` and the old application version. Do not overwrite the working shop. Retain any entries recorded after cutover for reconciliation before switching databases.

No live schema conversion is performed merely by starting the app. The redesigned backend checks that the notebook product columns exist before starting.
