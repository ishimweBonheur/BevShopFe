CREATE SCHEMA IF NOT EXISTS bevshop;
SET search_path TO bevshop, public;
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(trim(name)<>''), email text UNIQUE NOT NULL,
 password text NOT NULL, phone text NOT NULL DEFAULT '', token_version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_owner ON users ((true));
CREATE TABLE IF NOT EXISTS settings (
 id integer PRIMARY KEY CHECK(id=1), owner_id uuid REFERENCES users(id),
 currency text NOT NULL DEFAULT 'RWF' CHECK(currency='RWF'),
 timezone text NOT NULL DEFAULT 'Africa/Kigali' CHECK(timezone='Africa/Kigali')
);
INSERT INTO settings(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS categories (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(trim(name)<>''), description text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_unique_name ON categories(lower(trim(name)));
CREATE TABLE IF NOT EXISTS products (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(trim(name)<>''), category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
 description text NOT NULL DEFAULT '', units_per_pack integer NOT NULL CHECK(units_per_pack>0),
 selling_price numeric(24,6) NOT NULL CHECK(selling_price>=0), current_stock integer NOT NULL DEFAULT 0 CHECK(current_stock>=0),
 low_stock_level integer NOT NULL DEFAULT 0 CHECK(low_stock_level>=0),
 last_purchase_price_per_item numeric(24,6) NOT NULL DEFAULT 0 CHECK(last_purchase_price_per_item>=0),
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS products_unique_name ON products(lower(trim(name)));
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_stock_idx ON products(current_stock);
CREATE INDEX IF NOT EXISTS products_active_idx ON products(is_active);
CREATE TABLE IF NOT EXISTS suppliers (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(trim(name)<>''), phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
 address text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_unique_name ON suppliers(lower(trim(name)));
CREATE TABLE IF NOT EXISTS purchases (
 id uuid PRIMARY KEY, supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
 purchase_date timestamptz NOT NULL DEFAULT now(), total_amount numeric(24,6) NOT NULL CHECK(total_amount>=0),
 notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS purchase_items (
 id uuid PRIMARY KEY, purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name text NOT NULL,
 packs integer NOT NULL CHECK(packs>0), units_per_pack integer NOT NULL CHECK(units_per_pack>0),
 total_items integer NOT NULL CHECK(total_items=packs*units_per_pack),
 price_per_pack numeric(24,6) NOT NULL CHECK(price_per_pack>=0), price_per_item numeric(24,6) NOT NULL CHECK(price_per_item>=0),
 total_cost numeric(24,6) NOT NULL CHECK(total_cost>=0), UNIQUE(purchase_id,product_id)
);
CREATE TABLE IF NOT EXISTS sales (
 id uuid PRIMARY KEY, sale_date timestamptz NOT NULL DEFAULT now(),
 payment_method text NOT NULL CHECK(payment_method IN ('cash','mobile_money','bank')),
 total_amount numeric(24,6) NOT NULL CHECK(total_amount>=0), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sale_items (
 id uuid PRIMARY KEY, sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name text NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0), selling_price_per_item numeric(24,6) NOT NULL CHECK(selling_price_per_item>=0),
 cost_price_per_item numeric(24,6) NOT NULL CHECK(cost_price_per_item>=0), line_total numeric(24,6) NOT NULL CHECK(line_total>=0),
 line_cost numeric(24,6) NOT NULL CHECK(line_cost>=0), line_profit numeric(24,6) NOT NULL, UNIQUE(sale_id,product_id),
 CHECK(line_profit=line_total-line_cost)
);
CREATE TABLE IF NOT EXISTS expenses (
 id uuid PRIMARY KEY, expense_date timestamptz NOT NULL DEFAULT now(), name text NOT NULL CHECK(trim(name)<>''),
 category text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', amount numeric(24,6) NOT NULL CHECK(amount>=0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS damaged_items (
 id uuid PRIMARY KEY, product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name text NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0), reason text NOT NULL DEFAULT '', cost_per_item numeric(24,6) NOT NULL CHECK(cost_per_item>=0),
 total_loss numeric(24,6) NOT NULL CHECK(total_loss>=0), damaged_date timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS owner_money (
 id uuid PRIMARY KEY, type text NOT NULL CHECK(type IN ('money_added','money_taken')),
 amount numeric(24,6) NOT NULL CHECK(amount>=0), notes text NOT NULL DEFAULT '', entry_date timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
-- Internal retry receipts prevent lost responses from recording an entry twice.
CREATE TABLE IF NOT EXISTS request_receipts (
 id uuid PRIMARY KEY, fingerprint text NOT NULL, response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recovery_codes (
 hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS purchases_supplier_idx ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS purchase_items_purchase_idx ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS purchase_items_product_idx ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(sale_date);
CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_idx ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS damaged_product_idx ON damaged_items(product_id);
CREATE INDEX IF NOT EXISTS damaged_date_idx ON damaged_items(damaged_date);
CREATE INDEX IF NOT EXISTS owner_money_date_idx ON owner_money(entry_date);
