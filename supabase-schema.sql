-- ╔══════════════════════════════════════════════════════════════╗
-- ║         CoreInventory — Supabase Database Schema           ║
-- ║  Run this in Supabase SQL Editor (Dashboard → SQL Editor)  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Profiles (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('MANAGER', 'STAFF')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  main_policy   TEXT NOT NULL DEFAULT 'FIFO' CHECK (main_policy IN ('FIFO', 'LIFO', 'FEFO')),
  address       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Locations
CREATE TABLE IF NOT EXISTS locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  short_code    TEXT NOT NULL UNIQUE,
  warehouse_id  UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Categories
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  sku             TEXT NOT NULL UNIQUE,
  category_id     UUID REFERENCES categories(id),
  unit_of_measure TEXT NOT NULL DEFAULT 'pcs',
  cost_per_unit   NUMERIC(12,2) DEFAULT 0,
  reorder_level   INTEGER DEFAULT 0,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Stock (current qty per product per location)
CREATE TABLE IF NOT EXISTS stock (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,2) DEFAULT 0,
  UNIQUE (product_id, location_id)
);

-- 7. Receipts (Incoming Goods)
CREATE TABLE IF NOT EXISTS receipts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference               TEXT NOT NULL UNIQUE,
  date                    DATE NOT NULL,
  supplier_name           TEXT NOT NULL,
  destination_location_id UUID REFERENCES locations(id),
  status                  TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED')),
  notes                   TEXT,
  created_by              TEXT NOT NULL,
  validated_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Receipt Items
CREATE TABLE IF NOT EXISTS receipt_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id    UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  ordered_qty   NUMERIC(12,2) NOT NULL,
  received_qty  NUMERIC(12,2) DEFAULT 0
);

-- 9. Deliveries (Outgoing Goods)
CREATE TABLE IF NOT EXISTS deliveries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT NOT NULL UNIQUE,
  date                  DATE NOT NULL,
  customer_name         TEXT NOT NULL,
  source_location_id    UUID REFERENCES locations(id),
  status                TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED')),
  notes                 TEXT,
  created_by            TEXT NOT NULL,
  validated_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Delivery Items
CREATE TABLE IF NOT EXISTS delivery_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id   UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  demand_qty    NUMERIC(12,2) NOT NULL,
  shipped_qty   NUMERIC(12,2) DEFAULT 0
);

-- 11. Stock Adjustments
CREATE TABLE IF NOT EXISTS adjustments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference     TEXT NOT NULL UNIQUE,
  date          DATE NOT NULL,
  product_id    UUID NOT NULL REFERENCES products(id),
  location_id   UUID REFERENCES locations(id),
  previous_qty  NUMERIC(12,2) NOT NULL,
  counted_qty   NUMERIC(12,2) NOT NULL,
  difference    NUMERIC(12,2) NOT NULL,
  reason        TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Move History (Stock Ledger)
CREATE TABLE IF NOT EXISTS moves (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            TIMESTAMPTZ NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')),
  reference       TEXT NOT NULL,
  product_id      UUID NOT NULL REFERENCES products(id),
  quantity        NUMERIC(12,2) NOT NULL,
  from_location   TEXT NOT NULL,
  to_location     TEXT NOT NULL,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Reference Counters (auto-increment for references)
CREATE TABLE IF NOT EXISTS ref_counters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL UNIQUE CHECK (type IN ('RECEIPT', 'DELIVERY', 'ADJUSTMENT', 'TRANSFER')),
  last_number   INTEGER DEFAULT 0
);

-- Seed initial counters
INSERT INTO ref_counters (type, last_number) VALUES
  ('RECEIPT', 0),
  ('DELIVERY', 0),
  ('ADJUSTMENT', 0),
  ('TRANSFER', 0)
ON CONFLICT (type) DO NOTHING;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║               Enable Row Level Security                     ║
-- ╚══════════════════════════════════════════════════════════════╝

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_counters ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users full access
-- (In production, you'd make these more restrictive)

CREATE POLICY "Authenticated users can do everything" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON warehouses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON stock
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON receipts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON receipt_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON deliveries
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON delivery_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON adjustments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON moves
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON ref_counters
  FOR ALL USING (auth.role() = 'authenticated');

-- ╔══════════════════════════════════════════════════════════════╗
-- ║              Indexes for Performance                        ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_moves_type ON moves(type);
CREATE INDEX IF NOT EXISTS idx_moves_product ON moves(product_id);
CREATE INDEX IF NOT EXISTS idx_moves_date ON moves(date DESC);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);
