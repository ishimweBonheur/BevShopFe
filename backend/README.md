# Beverage Shop Notebook

Express/PostgreSQL backend and the existing React frontend at `P:\BevShopFe`, redesigned for one beverage shop owner. RWF only; dates use Africa/Kigali.

The pages are Dashboard, Products, Categories, Purchases, Sales, Expenses, Damaged Items, Owner Money, History and Reports. Forms use the existing modal, field, table and button styles. Success notifications appear once after a saved action for 3.5 seconds; errors stay for 6.5 seconds. Notifications can be dismissed and clear on navigation.

## Data and calculations

The active schema has users, categories, products, suppliers, purchases, purchase_items, sales, sale_items, expenses, damaged_items and owner_money. Internal settings, password recovery and retry receipts support the app. No new journal, stock-movement, reversal or reconciliation records are created.

- Products start with zero stock. Record a purchase to receive items: packs × items per pack.
- Purchases can contain multiple products. Price per item is price per pack ÷ items per pack.
- Sales use individual items. Sales and damage snapshot the latest purchase cost and cannot exceed stock.
- Profit is sales minus stored costs of items sold, expenses and damaged losses. Purchases and owner money do not directly change profit.
- Stock changes and their entries commit together, with database constraints and locking. Retry receipts prevent duplicate saves after lost responses.
- Names are unique after trimming and ignoring case. Historical product references cannot be deleted.
- Reports support Today, This Week, This Month, This Year and inclusive Custom Date Range. Stock figures represent current stock.

## Run

Configure `DATABASE_URL`, optionally `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, `SETUP_TOKEN` and `PORT` in `.env`. On an empty database run `npm run db:migrate`, then `npm run dev`. Start the frontend from `P:\BevShopFe` with `npm run dev`. Set its `REACT_APP_SERVER_URL` to the intended backend. The API documentation is `/api/docs`.

**Existing shop:** follow [the migration plan](docs/notebook-migration.md) before releasing either app. The old API and schema are incompatible with the notebook version. The cutover creates and verifies an encrypted backup, retains the original schema as a read-only archive, and preserves current stock. Cancelled entries and historical stock-count effects have explicit conversion rules in the plan.

Create the owner at first login using the configured setup token. Only one owner can exist. Profile supports password changes and one-time recovery codes; password changes revoke old sessions.

## Verification

`npm test` covers the notebook API, profit, rollback, duplicate names, retry safety, password recovery, backup integrity and legacy migration. Legacy accounting tests remain against `models/legacy-schema.sql` to protect archived data compatibility. `npm run lint` checks backend code.

Build the frontend with `npm run build` in its directory, then run `npm run test:browser` here. Browser tests use installed Chrome and isolated PostgreSQL, never the configured live database. They check the complete notebook flow, toast expiry and navigation, modal errors, and mobile layout.

## Backups

Configure a 64-character hexadecimal `BACKUP_KEY` and optionally persistent `BACKUP_DIR`. Keep the key offline separately. `npm run db:backup` creates an encrypted copy; `npm run db:restore-check` restores the latest backup into isolated PostgreSQL and verifies every table. Version 2 backups include the legacy archive; version 1 backups remain supported.

`node scripts/rehearse-notebook.js` validates migration using the latest encrypted backup in isolation. It never changes the live database.

For recovery, set `RESTORE_DATABASE_URL` to a separate empty database and run `npm run db:restore -- /path/to/file.bevbackup`. The command refuses the live database and an existing shop schema. Keep backups on a separate device or persistent remote volume. The running backend checks hourly for a due daily backup and retains 30 copies. The existing Windows task scripts remain available.
