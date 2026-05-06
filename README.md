# HotelDrops 🏨
### Get Paid When Your Hotel Price Drops

Upload your hotel voucher → We monitor 24/7 → Price drops → WhatsApp alert → You save money.

---

## Architecture

```
hoteldrops/
├── frontend/          ← Next.js (deploy to Vercel)
│   └── src/app/
│       ├── page.tsx           ← Landing page
│       ├── upload/page.tsx    ← Voucher upload
│       └── dashboard/page.tsx ← Customer dashboard
│
├── backend/           ← Node.js/Express (deploy to Railway)
│   ├── server.js              ← Main server + cron job
│   ├── routes/
│   │   ├── bookings.js        ← Upload, create, payment
│   │   ├── admin.js           ← Admin dashboard
│   │   └── alerts.js          ← WhatsApp webhook
│   ├── utils/
│   │   ├── amadeus.js         ← Hotel price API
│   │   ├── notifications.js   ← WhatsApp + Email
│   │   ├── voucherParser.js   ← PDF/OCR extraction
│   │   └── margins.js         ← Pricing engine
│   └── jobs/
│       └── priceTracker.js    ← The main bot (runs every 6hrs)
│
└── database/
    └── schema.sql             ← Run this in Supabase
```

---

## Day 1 Setup (30 minutes total)

### Step 1 — Supabase (5 mins)
1. Go to **supabase.com** → Create account → New project
2. Project name: `hoteldrops` · Region: `Southeast Asia (Singapore)`
3. Go to **SQL Editor** → Paste contents of `database/schema.sql` → Run
4. Go to **Storage** → Create bucket called `vouchers` → Set to Public
5. Go to **Settings → API** → Copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

### Step 2 — Amadeus (5 mins)
1. Go to **developers.amadeus.com** → Create account
2. My Apps → Create new app → Name: `HotelDrops`
3. Copy `API Key` → `AMADEUS_API_KEY`
4. Copy `API Secret` → `AMADEUS_API_SECRET`
5. Leave `AMADEUS_ENV=test` for now (switch to `production` when ready)

### Step 3 — Twilio WhatsApp (10 mins)
1. Go to **twilio.com** → Create account (free trial)
2. Copy `Account SID` → `TWILIO_ACCOUNT_SID`
3. Copy `Auth Token` → `TWILIO_AUTH_TOKEN`
4. Go to **Messaging → Try it out → WhatsApp**
5. Follow sandbox setup (scan QR code)
6. `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (Twilio sandbox number)
7. Set webhook URL to: `https://your-backend.railway.app/api/alerts/whatsapp-reply`

### Step 4 — Razorpay (5 mins)
1. Go to **razorpay.com** → Create account
2. Settings → API Keys → Generate Test Key
3. Copy `Key ID` → `RAZORPAY_KEY_ID`
4. Copy `Key Secret` → `RAZORPAY_KEY_SECRET`

### Step 5 — Email (2 mins)
**Option A — Gmail (easiest for testing):**
1. Google Account → Security → App Passwords → Generate
2. `GMAIL_USER=you@gmail.com`
3. `GMAIL_PASS=your-16-char-app-password`

**Option B — SendGrid (better for production):**
1. sendgrid.com → Create account → API Keys
2. `SENDGRID_API_KEY=SG.xxxxx`

---

## Running Locally

### Backend
```bash
cd backend
cp .env.example .env
# Fill in all values in .env

npm install
npm run dev
# Runs on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Deploying to Production

### Backend → Railway (free tier)
1. Go to **railway.app** → New Project → Deploy from GitHub
2. Select `hoteldrops/backend` folder
3. Add all environment variables from `.env`
4. Set `NODE_ENV=production`
5. Deploy → Get your URL (e.g. `https://hoteldrops-backend.railway.app`)

### Frontend → Vercel (free)
1. Go to **vercel.com** → New Project → Import from GitHub
2. Select `hoteldrops/frontend` folder
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://hoteldrops-backend.railway.app`
4. Deploy → Get your URL (e.g. `https://hoteldrops.vercel.app`)

---

## How the Bot Works

```
Every 6 hours (cron job in server.js):
  1. Fetch all bookings where next_check_at <= now
  2. For each booking:
     a. If no hotel ID → call Amadeus to map it
     b. Check current price via Amadeus API
     c. If price dropped > 3% AND > ₹500:
        → Calculate offer (50/50 split by default)
        → Save offer to DB
        → Send WhatsApp alert
        → Send email alert
  3. Update next_check_at to 6 hours from now
```

---

## Margin Rules

Default: **50/50 split** of the saving.

Example:
- Customer paid: ₹20,000
- We find it for: ₹18,000
- Total saving: ₹2,000
- Our margin (50%): ₹1,000
- We offer customer: ₹19,000
- Customer saves: ₹1,000 ✅
- We earn: ₹1,000 ✅

**To change margins:** Admin panel → Margin Rules → Edit

You can set:
- Different % for different booking values
- Aggressive mode (give customer 70%) for launch
- Premium mode (keep 60%) for high-value bookings

---

## Admin Panel

Access at: `https://your-backend/api/admin/dashboard`
Header required: `x-admin-key: YOUR_ADMIN_SECRET_KEY`

Set `ADMIN_SECRET_KEY` in your `.env` file.

---

## Key Files to Know

| File | What it does |
|------|-------------|
| `backend/jobs/priceTracker.js` | The main bot — runs every 6hrs |
| `backend/utils/amadeus.js` | Connects to Amadeus hotel API |
| `backend/utils/margins.js` | Calculates what to offer customer |
| `backend/utils/notifications.js` | WhatsApp + email alerts |
| `backend/utils/voucherParser.js` | Reads PDF/image vouchers |
| `backend/routes/alerts.js` | Handles customer WhatsApp replies |
| `database/schema.sql` | Full database structure |

---

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js on Vercel | Free |
| Backend | Node.js on Railway | ~$5/mo |
| Database | Supabase PostgreSQL | Free (500MB) |
| Hotel prices | Amadeus API | Free (2000 calls/mo) |
| WhatsApp | Twilio | ~₹4/message |
| Email | SendGrid | Free (100/day) |
| Payments | Razorpay | 2% per transaction |

**Total at launch: ~$5/month**

---

## Support

Built by Claude AI for HotelDrops.
Questions? Email: support@hoteldrops.in
