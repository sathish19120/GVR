-- ============================================================
-- Green Village Rice — Supabase Database Migration
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('owner','delivery','customer')),
  language      TEXT DEFAULT 'en' CHECK (language IN ('en','te')),
  address       TEXT,
  area          TEXT,
  active        BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  name_telugu         TEXT,
  weight_kg           NUMERIC(5,2) NOT NULL,
  price_per_bag       NUMERIC(10,2) NOT NULL,
  stock_bags          INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 50,
  sku                 TEXT UNIQUE NOT NULL,
  image_url           TEXT,
  active              BOOLEAN DEFAULT true,
  packing_date        DATE,
  best_before_date    DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT UNIQUE NOT NULL,
  customer_id         UUID NOT NULL REFERENCES users(id),
  delivery_person_id  UUID REFERENCES users(id),
  delivery_address    TEXT NOT NULL,
  total_amount        NUMERIC(10,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','packed','dispatched','delivered','cancelled')),
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending','paid','refunded')),
  payment_method      TEXT CHECK (payment_method IN ('upi','cod','bank')),
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  notes               TEXT,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer  ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery  ON orders (delivery_person_id);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id),
  name           TEXT NOT NULL,
  weight_kg      NUMERIC(5,2) NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_order ON order_items (order_id);

-- Stock Movements (audit log)
CREATE TABLE IF NOT EXISTS stock_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id),
  change_bags INTEGER NOT NULL,
  type        TEXT CHECK (type IN ('add','subtract','sale','adjustment')),
  note        TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);

-- Products: public read, owner write
CREATE POLICY "products_read"  ON products FOR SELECT USING (active = true OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "products_write" ON products FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'));

-- Orders: customer sees own, owner/delivery sees all
CREATE POLICY "orders_customer" ON orders FOR ALL USING (
  customer_id = auth.uid() OR
  delivery_person_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner','delivery'))
);

-- Order items: follow order access
CREATE POLICY "items_access" ON order_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_id AND (
      o.customer_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner','delivery'))
    )
  )
);

-- Stock movements: owner only
CREATE POLICY "stock_owner" ON stock_movements FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'));

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO products (name, name_telugu, weight_kg, price_per_bag, stock_bags, low_stock_threshold, sku, active, packing_date, best_before_date)
VALUES
  ('Sona Masoori 1kg',  'సోనా మసూరి 1 కిలో',  1,  60,  200, 50, 'GVR-SM-1KG',  true, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
  ('Sona Masoori 5kg',  'సోనా మసూరి 5 కిలో',  5,  250, 150, 30, 'GVR-SM-5KG',  true, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
  ('Sona Masoori 25kg', 'సోనా మసూరి 25 కిలో', 25, 1100,  0,  10, 'GVR-SM-25KG', false, NULL, NULL)
ON CONFLICT (sku) DO NOTHING;
