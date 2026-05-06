-- HotelDrops Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- BOOKINGS TABLE
-- =====================
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Voucher details (extracted from PDF)
  voucher_url TEXT,                    -- Stored file URL
  hotel_name TEXT NOT NULL,
  hotel_address TEXT,
  hotel_city TEXT,
  hotel_country TEXT DEFAULT 'IN',
  
  -- Booking details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER,
  room_type TEXT,
  board_type TEXT,                     -- BB, RO, HB, FB, AI
  num_adults INTEGER DEFAULT 2,
  num_children INTEGER DEFAULT 0,
  num_rooms INTEGER DEFAULT 1,
  
  -- Price details
  original_price DECIMAL(12,2) NOT NULL,  -- What customer paid
  currency TEXT DEFAULT 'INR',
  
  -- API mapping
  hotelbeds_hotel_code TEXT,           -- Hotelbeds hotel code (mapped from name+city)
  amadeus_chain_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Tracking status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Just uploaded, not yet mapped
    'tracking',       -- Actively monitoring price
    'drop_found',     -- Price drop detected
    'offer_sent',     -- We sent offer to customer
    'accepted',       -- Customer accepted offer
    'rebooked',       -- Successfully rebooked
    'expired',        -- Check-in passed or booking cancelled
    'no_drop'         -- Monitored but no drop found
  )),
  
  -- Tracking config
  tracking_active BOOLEAN DEFAULT TRUE,
  check_frequency_hours INTEGER DEFAULT 6,  -- How often to check (hours)
  last_checked_at TIMESTAMP WITH TIME ZONE,
  next_check_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- PRICE CHECKS TABLE
-- Every time bot checks price, log it here
-- =====================
CREATE TABLE price_checks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_source TEXT DEFAULT 'amadeus',   -- Which API was used
  
  -- Price found
  found_price DECIMAL(12,2),           -- Raw API price
  currency TEXT DEFAULT 'INR',
  
  -- Was this a drop?
  is_drop BOOLEAN DEFAULT FALSE,
  drop_amount DECIMAL(12,2),           -- How much cheaper
  drop_percentage DECIMAL(5,2),        -- % cheaper
  
  -- Raw API response (for debugging)
  api_response JSONB,
  
  -- Status
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- =====================
-- OFFERS TABLE
-- When we detect a drop, we create an offer for the customer
-- =====================
CREATE TABLE offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  price_check_id UUID REFERENCES price_checks(id),
  
  -- Pricing
  supplier_price DECIMAL(12,2) NOT NULL,   -- What we can get it for (API price)
  offer_price DECIMAL(12,2) NOT NULL,      -- What we offer customer
  original_price DECIMAL(12,2) NOT NULL,   -- What they originally paid
  customer_saving DECIMAL(12,2) NOT NULL,  -- How much customer saves
  our_margin DECIMAL(12,2) NOT NULL,       -- Our profit
  margin_percentage DECIMAL(5,2),          -- Our margin %
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Created, not yet sent
    'sent',       -- Alert sent to customer
    'accepted',   -- Customer wants to rebook
    'rejected',   -- Customer declined
    'expired',    -- Offer expired (price went back up)
    'completed'   -- Booking completed
  )),
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE,     -- Offer valid until
  
  -- Communication
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_message_sid TEXT,               -- Twilio message ID
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- REBOOKINGS TABLE
-- Final completed rebookings
-- =====================
CREATE TABLE rebookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  offer_id UUID REFERENCES offers(id),
  user_id UUID REFERENCES users(id),
  
  -- Payment
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_amount DECIMAL(12,2),
  payment_status TEXT DEFAULT 'pending',
  payment_captured_at TIMESTAMP WITH TIME ZONE,
  
  -- New booking confirmation
  new_booking_reference TEXT,          -- Confirmation number from hotel/supplier
  new_booking_details JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Payment pending
    'paid',         -- Payment received
    'confirmed',    -- Hotel booking confirmed
    'cancelled',    -- Cancelled after rebooking
    'failed'        -- Something went wrong
  )),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- MARGIN RULES TABLE
-- Admin can set flexible margin rules
-- =====================
CREATE TABLE margin_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Rule scope (null = applies to all)
  hotel_name TEXT,                     -- Specific hotel
  city TEXT,                           -- Specific city
  country TEXT,                        -- Specific country
  min_booking_value DECIMAL(12,2),     -- Min booking amount
  max_booking_value DECIMAL(12,2),     -- Max booking amount
  
  -- Margin config
  margin_type TEXT DEFAULT 'percentage' CHECK (margin_type IN ('percentage', 'fixed')),
  margin_value DECIMAL(5,2) NOT NULL,  -- e.g. 50 for 50% of saving
  min_our_earning DECIMAL(12,2),       -- Minimum we must earn
  max_customer_saving DECIMAL(12,2),   -- Cap on customer saving
  
  -- Rule priority (higher = checked first)
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Label for admin UI
  rule_name TEXT NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- NOTIFICATIONS TABLE
-- Log all WhatsApp/email sent
-- =====================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  offer_id UUID REFERENCES offers(id),
  
  type TEXT CHECK (type IN ('whatsapp', 'email')),
  template TEXT,                       -- Which template was used
  recipient TEXT NOT NULL,             -- Phone or email
  message_content TEXT,
  
  status TEXT DEFAULT 'sent',
  external_id TEXT,                    -- Twilio SID or SendGrid ID
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- INDEXES for performance
-- =====================
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_next_check ON bookings(next_check_at) WHERE tracking_active = TRUE;
CREATE INDEX idx_price_checks_booking ON price_checks(booking_id);
CREATE INDEX idx_offers_booking ON offers(booking_id);
CREATE INDEX idx_offers_status ON offers(status);

-- =====================
-- DEFAULT MARGIN RULE
-- 50/50 split as discussed
-- =====================
INSERT INTO margin_rules (rule_name, description, margin_type, margin_value, priority) VALUES
('Default 50/50 Split', 'Standard rule — we keep 50% of savings, customer keeps 50%', 'percentage', 50, 0),
('Aggressive Growth', 'Give customer 70% to drive volume — use during launch', 'percentage', 30, 0),
('Premium Margin', 'Keep 60% for high-value bookings above ₹50,000', 'percentage', 60, 1);

-- Update the premium margin rule
UPDATE margin_rules 
SET min_booking_value = 50000 
WHERE rule_name = 'Premium Margin';

-- =====================
-- ROW LEVEL SECURITY
-- Users can only see their own data
-- =====================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own bookings" ON bookings
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users see own offers" ON offers
  FOR ALL USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id::text = auth.uid()::text)
  );

CREATE POLICY "Users see own rebookings" ON rebookings
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Hotelbeds hotel code index
CREATE INDEX IF NOT EXISTS idx_bookings_hotelbeds_code ON bookings(hotelbeds_hotel_code);
