-- ============================================================
-- GREEN VILLAGE RICE — Run this in Supabase SQL Editor ONCE
-- ============================================================

-- Profiles table (NO email, NO Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT DEFAULT 'customer' CHECK (role IN ('superadmin','admin','delivery','customer')),
  phone         TEXT,
  area          TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  name_telugu         TEXT,
  weight_kg           NUMERIC(5,2) NOT NULL,
  price_per_bag       NUMERIC(10,2) NOT NULL,
  stock_bags          INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 50,
  sku                 TEXT UNIQUE,
  active              BOOLEAN DEFAULT true,
  packing_date        DATE,
  best_before_date    DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE NOT NULL,
  customer_id      UUID REFERENCES profiles(id),
  customer_name    TEXT,
  delivery_address TEXT,
  total_amount     NUMERIC(10,2) DEFAULT 0,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','packed','dispatched','delivered','cancelled')),
  payment_status   TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  payment_method   TEXT CHECK (payment_method IN ('upi','cod','bank')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id),
  name           TEXT,
  weight_kg      NUMERIC(5,2),
  quantity       INTEGER NOT NULL,
  price_per_unit NUMERIC(10,2) NOT NULL
);

-- DISABLE RLS completely
ALTER TABLE profiles    DISABLE ROW LEVEL SECURITY;
ALTER TABLE products    DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Seed products
INSERT INTO products (name, name_telugu, weight_kg, price_per_bag, stock_bags, low_stock_threshold, sku, active, packing_date, best_before_date)
VALUES
  ('Sona Masoori 1kg',  'సోనా మసూరి 1కిలో',  1,  60,  200, 50, 'GVR-1KG',  true, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
  ('Sona Masoori 5kg',  'సోనా మసూరి 5కిలో',  5,  250, 150, 30, 'GVR-5KG',  true, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
  ('Sona Masoori 25kg', 'సోనా మసూరి 25కిలో', 25, 1100,  0,  10, 'GVR-25KG', false, NULL, NULL)
ON CONFLICT (sku) DO NOTHING;
