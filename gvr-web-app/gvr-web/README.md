# 🌾 Green Village Rice — Web App

React + Vite · Supabase · Vercel · Telugu + English

---

## Quick Start (Local Dev)

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/green-village-rice.git
cd green-village-rice
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run dev server
npm run dev
# Open http://localhost:5173
```

---

## Deploy to Vercel + Supabase + GitHub

### Step 1 — GitHub

```bash
git init
git add .
git commit -m "Initial commit — Green Village Rice"
# Create repo at github.com then:
git remote add origin https://github.com/YOUR_USERNAME/green-village-rice.git
git push -u origin main
```

### Step 2 — Supabase

1. Go to supabase.com → New Project (Singapore region)
2. SQL Editor → New Query → paste `supabase/migrations/001_initial_schema.sql` → Run
3. Authentication → Providers → Enable Phone
4. Settings → API → copy Project URL and anon key

### Step 3 — Vercel

1. Go to vercel.com → New Project → Import from GitHub
2. Select your repository
3. Framework: Vite (auto-detected)
4. Environment Variables → Add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_RAZORPAY_KEY_ID` = your Razorpay key (when ready)
5. Deploy → Done!

---

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.tsx          # Phone login
│   ├── OTPPage.tsx            # OTP verification
│   ├── owner/
│   │   ├── DashboardPage.tsx  # Revenue, orders, charts
│   │   ├── OrdersPage.tsx     # Manage all orders
│   │   ├── InventoryPage.tsx  # Stock + packing dates
│   │   ├── CustomersPage.tsx  # Customer list
│   │   └── AnalyticsPage.tsx  # Monthly revenue charts
│   ├── customer/
│   │   ├── ShopPage.tsx       # Browse + cart + checkout
│   │   ├── MyOrdersPage.tsx   # Order history + tracker
│   │   └── ProfilePage.tsx    # Name, language, logout
│   └── delivery/
│       └── DeliveryHomePage.tsx  # Run list + maps
├── components/layout/
│   ├── OwnerLayout.tsx        # Sidebar navigation
│   ├── CustomerLayout.tsx     # Mobile bottom nav
│   └── DeliveryLayout.tsx     # Simple header
├── store/authStore.ts         # Zustand auth state
├── lib/
│   ├── supabase.ts            # Supabase client + types
│   └── i18n.ts                # Telugu + English strings
└── index.css                  # Tailwind + design system
```

---

## User Roles & Access

| Role | Login | What they see |
|------|-------|--------------|
| `owner` | Any phone set as owner in DB | Full dashboard, orders, inventory, analytics |
| `customer` | Any new phone number | Shop, my orders, profile |
| `delivery` | Phone set as delivery in DB | Delivery run list |

To set a user as owner: in Supabase → Table Editor → users → find row → set `role = owner`

---

## To Launch 25kg Pack

Supabase → Table Editor → products → find `GVR-SM-25KG` → set `active = true` and update `price_per_bag` → Save

No app update needed.
