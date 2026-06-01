-- ============================================================
-- GREEN VILLAGE RICE — Run this in Supabase SQL Editor ONCE
-- ============================================================

-- Profiles table (stores username, name, role)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  role        TEXT DEFAULT 'customer' CHECK (role IN ('superadmin','admin','delivery','customer')),
  phone       TEXT,
  area        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================================
-- DISABLE RLS (simplest for getting started)
-- ============================================================
ALTER TABLE profiles    DISABLE ROW LEVEL SECURITY;
ALTER TABLE products    DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED PRODUCTS
-- ============================================================
INSERT INTO products (name, name_telugu, weight_kg, price_per_bag, stock_bags, low_stock_threshold, sku, active, packing_date, best_before_date)
VALUES
  ('Sona Masoori 1kg',  'సోనా మసూరి 1కిలో',  1,  60,  200, 50, 'GVR-1KG',  true, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
  ('Sona Masoori 5kg',  'సోనా మసూరి 5కిలో',  5,  250, 150, 30, 'GVR-5KG',  true, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
  ('Sona Masoori 25kg', 'సోనా మసూరి 25కిలో', 25, 1100,  0,  10, 'GVR-25KG', false, NULL, NULL)
ON CONFLICT (sku) DO NOTHING;
