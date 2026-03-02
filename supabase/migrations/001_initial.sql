-- ============================================================================
-- RETIRU · Migración inicial completa
-- Marketplace de retiros y escapadas · Supabase (PostgreSQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TYPE user_role AS ENUM ('attendee','organizer','admin');
CREATE TYPE organizer_status AS ENUM ('pending','verified','suspended','rejected');
CREATE TYPE retreat_status AS ENUM ('draft','pending_review','published','rejected','archived','cancelled');
CREATE TYPE retreat_confirmation_type AS ENUM ('automatic','manual');
CREATE TYPE booking_status AS ENUM (
  'pending_payment','pending_confirmation','confirmed','rejected',
  'sla_expired','completed','cancelled_by_attendee','cancelled_by_organizer',
  'refunded','no_show'
);
CREATE TYPE payment_status AS ENUM ('pending','paid','refunded','partially_refunded','failed');
CREATE TYPE remaining_payment_status AS ENUM ('pending','confirmed_by_organizer','overdue','disputed');
CREATE TYPE message_type AS ENUM ('text','system','template');
CREATE TYPE notification_type AS ENUM (
  'booking_new','booking_confirmed','booking_rejected','booking_cancelled',
  'payment_reminder','payment_received','sla_warning','sla_expired',
  'review_received','message_new','retreat_approved','retreat_rejected',
  'penalty_received','general'
);
CREATE TYPE penalty_type AS ENUM ('warning','minor','major','suspension');
CREATE TYPE refund_reason AS ENUM ('cancelled_by_attendee','cancelled_by_organizer','sla_expired','admin_decision','dispute','other');
CREATE TYPE refund_status AS ENUM ('pending','approved','processed','rejected');
CREATE TYPE audit_action AS ENUM (
  'booking_created','booking_confirmed','booking_rejected','booking_cancelled',
  'payment_received','refund_issued','retreat_published','retreat_rejected',
  'organizer_verified','organizer_suspended','penalty_applied',
  'checkin_performed','review_submitted','review_responded'
);
CREATE TYPE center_status AS ENUM ('active','inactive','pending_payment','expired');
CREATE TYPE center_plan AS ENUM ('basic','featured');
CREATE TYPE center_type AS ENUM ('yoga','meditation','wellness','spa','yoga_meditation','wellness_spa','multidisciplinary');
CREATE TYPE product_status AS ENUM ('active','draft','out_of_stock');
CREATE TYPE order_status AS ENUM ('pending','paid','shipped','delivered','cancelled','refunded');
CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','voided');
CREATE TYPE verification_step AS ENUM ('personal_data','identity_doc','tax_info','bank_info');
CREATE TYPE verification_step_status AS ENUM ('pending','submitted','in_review','approved','rejected');

-- ═══════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- ─── PROFILES ───────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'attendee',
  preferred_locale TEXT NOT NULL DEFAULT 'es' CHECK (preferred_locale IN ('es','en')),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ORGANIZER PROFILES ────────────────────────────────────────────────

CREATE TABLE organizer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_es TEXT,
  description_en TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  instagram TEXT,
  phone TEXT,
  location TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['es'],
  tax_id TEXT,
  tax_name TEXT,
  tax_address TEXT,
  iban TEXT,
  status organizer_status NOT NULL DEFAULT 'pending',
  id_document_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  penalty_score INT NOT NULL DEFAULT 0,
  default_sla_hours INT NOT NULL DEFAULT 48,
  total_retreats INT NOT NULL DEFAULT 0,
  total_bookings INT NOT NULL DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_org_slug ON organizer_profiles(slug);
CREATE INDEX idx_org_status ON organizer_profiles(status);

-- ─── CATEGORIES ────────────────────────────────────────────────────────

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_es TEXT,
  description_en TEXT,
  icon TEXT,
  cover_image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DESTINATIONS ──────────────────────────────────────────────────────

CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_es TEXT,
  description_en TEXT,
  intro_es TEXT,
  intro_en TEXT,
  cover_image_url TEXT,
  country TEXT NOT NULL DEFAULT 'ES',
  region TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  faq JSONB DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- RETREATS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE retreats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  title_es TEXT NOT NULL,
  title_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  summary_es TEXT NOT NULL,
  summary_en TEXT,
  description_es TEXT NOT NULL,
  description_en TEXT,
  includes_es TEXT[],
  includes_en TEXT[],
  excludes_es TEXT[],
  excludes_en TEXT[],
  destination_id UUID REFERENCES destinations(id),
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  max_attendees INT NOT NULL CHECK (max_attendees >= 1),
  min_attendees INT DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 50),
  platform_fee NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(total_price * 0.20, 2)) STORED,
  organizer_amount NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(total_price * 0.80, 2)) STORED,
  currency TEXT NOT NULL DEFAULT 'EUR',
  confirmation_type retreat_confirmation_type NOT NULL DEFAULT 'automatic',
  sla_hours INT NOT NULL DEFAULT 48,
  languages TEXT[] NOT NULL DEFAULT ARRAY['es'],
  cancellation_policy JSONB NOT NULL DEFAULT '{"type":"standard","refund_tiers":[{"days_before":30,"refund_percent":100},{"days_before":14,"refund_percent":50},{"days_before":7,"refund_percent":0}],"platform_fee_refundable":false}'::jsonb,
  post_booking_form JSONB DEFAULT '[]'::jsonb,
  schedule JSONB DEFAULT '[]'::jsonb,
  status retreat_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  confirmed_bookings INT NOT NULL DEFAULT 0,
  available_spots INT GENERATED ALWAYS AS (max_attendees - confirmed_bookings) STORED,
  view_count INT NOT NULL DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_min CHECK (min_attendees <= max_attendees)
);
CREATE INDEX idx_rt_org ON retreats(organizer_id);
CREATE INDEX idx_rt_status ON retreats(status);
CREATE INDEX idx_rt_dest ON retreats(destination_id);
CREATE INDEX idx_rt_dates ON retreats(start_date, end_date);
CREATE INDEX idx_rt_slug ON retreats(slug);
CREATE INDEX idx_rt_pub ON retreats(status, start_date) WHERE status = 'published';
CREATE INDEX idx_rt_search_es ON retreats USING gin(to_tsvector('spanish', COALESCE(title_es,'') || ' ' || COALESCE(summary_es,'') || ' ' || COALESCE(description_es,'')));
CREATE INDEX idx_rt_search_en ON retreats USING gin(to_tsvector('english', COALESCE(title_en,'') || ' ' || COALESCE(summary_en,'') || ' ' || COALESCE(description_en,'')));

-- ─── RETREAT CATEGORIES M2M ────────────────────────────────────────────

CREATE TABLE retreat_categories (
  retreat_id UUID NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (retreat_id, category_id)
);

-- ─── RETREAT IMAGES ────────────────────────────────────────────────────

CREATE TABLE retreat_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retreat_id UUID NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rimg ON retreat_images(retreat_id, sort_order);

-- ═══════════════════════════════════════════════════════════════════════
-- BOOKINGS & PAYMENTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT NOT NULL UNIQUE,
  retreat_id UUID NOT NULL REFERENCES retreats(id),
  attendee_id UUID NOT NULL REFERENCES profiles(id),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id),
  total_price NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  organizer_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status booking_status NOT NULL DEFAULT 'pending_payment',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  platform_payment_status payment_status NOT NULL DEFAULT 'pending',
  platform_paid_at TIMESTAMPTZ,
  remaining_payment_status remaining_payment_status NOT NULL DEFAULT 'pending',
  remaining_payment_due_date DATE,
  remaining_payment_confirmed_at TIMESTAMPTZ,
  remaining_payment_confirmed_by UUID REFERENCES profiles(id),
  sla_deadline TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refund_reason refund_reason,
  refunded_at TIMESTAMPTZ,
  stripe_refund_id TEXT,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  qr_code TEXT,
  form_responses JSONB DEFAULT '{}'::jsonb,
  organizer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bk_retreat ON bookings(retreat_id);
CREATE INDEX idx_bk_att ON bookings(attendee_id);
CREATE INDEX idx_bk_org ON bookings(organizer_id);
CREATE INDEX idx_bk_status ON bookings(status);
CREATE INDEX idx_bk_num ON bookings(booking_number);
CREATE INDEX idx_bk_sla ON bookings(sla_deadline) WHERE status = 'pending_confirmation';

-- ─── INVOICES ──────────────────────────────────────────────────────────

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  order_id UUID,  -- FK added after orders table
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status invoice_status NOT NULL DEFAULT 'draft',
  pdf_url TEXT,
  tax_base NUMERIC(10,2),
  tax_rate NUMERIC(4,2) DEFAULT 21.00,
  tax_amount NUMERIC(10,2),
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inv_user ON invoices(user_id);
CREATE INDEX idx_inv_num ON invoices(invoice_number);

-- ═══════════════════════════════════════════════════════════════════════
-- MESSAGING
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES profiles(id),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id),
  last_message_at TIMESTAMPTZ,
  attendee_unread INT NOT NULL DEFAULT 0,
  organizer_unread INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_conv_bk ON conversations(booking_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_msg_conv ON messages(conversation_id, created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- REVIEWS (Retreats)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  retreat_id UUID NOT NULL REFERENCES retreats(id),
  attendee_id UUID NOT NULL REFERENCES profiles(id),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  response TEXT,
  responded_at TIMESTAMPTZ,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rev_rt ON reviews(retreat_id) WHERE is_visible = true;
CREATE INDEX idx_rev_org ON reviews(organizer_id) WHERE is_visible = true;

-- ═══════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS & PREFERENCES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title_es TEXT NOT NULL,
  title_en TEXT,
  body_es TEXT,
  body_en TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  new_booking_email BOOLEAN NOT NULL DEFAULT true,
  new_booking_push BOOLEAN NOT NULL DEFAULT true,
  new_message_email BOOLEAN NOT NULL DEFAULT true,
  new_message_push BOOLEAN NOT NULL DEFAULT true,
  new_review_email BOOLEAN NOT NULL DEFAULT true,
  new_review_push BOOLEAN NOT NULL DEFAULT false,
  booking_reminder BOOLEAN NOT NULL DEFAULT true,
  marketing_email BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- ORGANIZER: PENALTIES, VERIFICATION, ATTENDEE TAGS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id),
  type penalty_type NOT NULL,
  reason TEXT NOT NULL,
  points INT NOT NULL DEFAULT 1,
  booking_id UUID REFERENCES bookings(id),
  issued_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organizer_verification_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  step verification_step NOT NULL,
  status verification_step_status NOT NULL DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizer_id, step)
);

CREATE TABLE organizer_attendee_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizer_id, attendee_id, tag)
);
CREATE INDEX idx_oat_org ON organizer_attendee_tags(organizer_id);

-- ═══════════════════════════════════════════════════════════════════════
-- REFUNDS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  attendee_id UUID NOT NULL REFERENCES profiles(id),
  retreat_id UUID NOT NULL REFERENCES retreats(id),
  amount NUMERIC(10,2) NOT NULL,
  reason refund_reason NOT NULL,
  reason_detail TEXT,
  status refund_status NOT NULL DEFAULT 'pending',
  stripe_refund_id TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rf_bk ON refunds(booking_id);
CREATE INDEX idx_rf_status ON refunds(status);

-- ═══════════════════════════════════════════════════════════════════════
-- CENTERS (Directorio de centros)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_es TEXT NOT NULL,
  description_en TEXT,
  type center_type NOT NULL DEFAULT 'multidisciplinary',
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  logo_url TEXT,
  cover_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  website TEXT,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  -- Business
  plan center_plan NOT NULL DEFAULT 'basic',
  status center_status NOT NULL DEFAULT 'pending_payment',
  price_monthly NUMERIC(6,2) NOT NULL DEFAULT 50.00,
  subscription_start DATE,
  subscription_end DATE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  -- Content
  services_es TEXT[] DEFAULT ARRAY[]::TEXT[],
  services_en TEXT[] DEFAULT ARRAY[]::TEXT[],
  schedule_summary_es TEXT,
  schedule_summary_en TEXT,
  price_range_es TEXT,
  price_range_en TEXT,
  -- SEO
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  -- Stats
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  -- Ownership
  claimed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ctr_slug ON centers(slug);
CREATE INDEX idx_ctr_city ON centers(city);
CREATE INDEX idx_ctr_status ON centers(status) WHERE status = 'active';
CREATE INDEX idx_ctr_type ON centers(type);
CREATE INDEX idx_ctr_search_es ON centers USING gin(to_tsvector('spanish', COALESCE(name,'') || ' ' || COALESCE(description_es,'') || ' ' || COALESCE(city,'')));

CREATE TABLE center_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  response TEXT,
  responded_at TIMESTAMPTZ,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crev_center ON center_reviews(center_id) WHERE is_visible = true;

-- ═══════════════════════════════════════════════════════════════════════
-- SHOP (Tienda)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_es TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  description_es TEXT NOT NULL,
  description_en TEXT,
  features_es TEXT[] DEFAULT ARRAY[]::TEXT[],
  features_en TEXT[] DEFAULT ARRAY[]::TEXT[],
  category_id UUID NOT NULL REFERENCES product_categories(id),
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status product_status NOT NULL DEFAULT 'draft',
  stock INT NOT NULL DEFAULT 0,
  sku TEXT,
  weight_grams INT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  badge TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  stripe_price_id TEXT,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  view_count INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_prod_slug ON products(slug);
CREATE INDEX idx_prod_cat ON products(category_id);
CREATE INDEX idx_prod_status ON products(status) WHERE status = 'active';

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  shipping_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_province TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'ES',
  stripe_payment_intent_id TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ord_user ON orders(user_id);
CREATE INDEX idx_ord_status ON orders(status);
CREATE INDEX idx_ord_num ON orders(order_number);

-- FK de invoices → orders (diferida porque orders se crea después)
ALTER TABLE invoices ADD CONSTRAINT fk_inv_order FOREIGN KEY (order_id) REFERENCES orders(id);

CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_prev_prod ON product_reviews(product_id) WHERE is_visible = true;

-- ═══════════════════════════════════════════════════════════════════════
-- BLOG
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blog_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_es TEXT NOT NULL,
  title_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt_es TEXT NOT NULL,
  excerpt_en TEXT,
  content_es TEXT NOT NULL,
  content_en TEXT,
  category_id UUID NOT NULL REFERENCES blog_categories(id),
  author_id UUID NOT NULL REFERENCES profiles(id),
  cover_image_url TEXT,
  read_time_min INT NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_blog_slug ON blog_articles(slug);
CREATE INDEX idx_blog_cat ON blog_articles(category_id);
CREATE INDEX idx_blog_pub ON blog_articles(is_published, published_at DESC) WHERE is_published = true;

-- ═══════════════════════════════════════════════════════════════════════
-- ANALYTICS & AUDIT
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retreat_id UUID REFERENCES retreats(id) ON DELETE SET NULL,
  center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  article_id UUID REFERENCES blog_articles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'direct',
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pv_retreat ON page_views(retreat_id, created_at) WHERE retreat_id IS NOT NULL;
CREATE INDEX idx_pv_center ON page_views(center_id, created_at) WHERE center_id IS NOT NULL;
CREATE INDEX idx_pv_date ON page_views(created_at);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action audit_action NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- MISC TABLES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE saved_retreats (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  retreat_id UUID NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, retreat_id)
);

CREATE TABLE admin_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
INSERT INTO admin_config (key, value) VALUES
  ('default_sla_hours', '48'),
  ('min_retreat_price', '50'),
  ('platform_fee_percent', '20'),
  ('penalty_suspension_threshold', '10');

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════

-- ─── updated_at automático ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_org BEFORE UPDATE ON organizer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_retreats BEFORE UPDATE ON retreats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_bookings BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_centers BEFORE UPDATE ON centers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_blog BEFORE UPDATE ON blog_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_notif_prefs BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Booking number + QR auto-generation ───────────────────────────────

CREATE OR REPLACE FUNCTION generate_booking_number() RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number = 'RTR-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
  NEW.qr_code = NEW.id::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_bk_num BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- ─── Order number auto-generation ──────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_ord_num BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ─── Invoice number auto-generation ────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TRIGGER AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM invoices WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  NEW.invoice_number = 'INV-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_inv_num BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ─── Retreat booking counter ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_retreat_booking_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE retreats SET confirmed_bookings = (
    SELECT COUNT(*) FROM bookings WHERE retreat_id = COALESCE(NEW.retreat_id, OLD.retreat_id) AND status IN ('confirmed','completed')
  ) WHERE id = COALESCE(NEW.retreat_id, OLD.retreat_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_bk_count AFTER INSERT OR UPDATE OF status OR DELETE ON bookings FOR EACH ROW EXECUTE FUNCTION update_retreat_booking_count();

-- ─── Organizer counters ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_organizer_counters() RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  org_id := COALESCE(NEW.organizer_id, OLD.organizer_id);
  UPDATE organizer_profiles SET
    total_bookings = (SELECT COUNT(*) FROM bookings WHERE organizer_id = org_id AND status IN ('confirmed','completed')),
    total_retreats = (SELECT COUNT(*) FROM retreats WHERE organizer_id = org_id AND status = 'published')
  WHERE id = org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_org_bk_count AFTER INSERT OR UPDATE OF status OR DELETE ON bookings FOR EACH ROW EXECUTE FUNCTION update_organizer_counters();
CREATE TRIGGER tr_org_rt_count AFTER INSERT OR UPDATE OF status OR DELETE ON retreats FOR EACH ROW EXECUTE FUNCTION update_organizer_counters();

-- ─── Retreat & organizer rating recalc ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_ratings() RETURNS TRIGGER AS $$
BEGIN
  UPDATE retreats SET
    avg_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric,1), 0) FROM reviews WHERE retreat_id = COALESCE(NEW.retreat_id, OLD.retreat_id) AND is_visible),
    review_count = (SELECT COUNT(*) FROM reviews WHERE retreat_id = COALESCE(NEW.retreat_id, OLD.retreat_id) AND is_visible)
  WHERE id = COALESCE(NEW.retreat_id, OLD.retreat_id);
  UPDATE organizer_profiles SET
    avg_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric,1), 0) FROM reviews WHERE organizer_id = COALESCE(NEW.organizer_id, OLD.organizer_id) AND is_visible),
    review_count = (SELECT COUNT(*) FROM reviews WHERE organizer_id = COALESCE(NEW.organizer_id, OLD.organizer_id) AND is_visible)
  WHERE id = COALESCE(NEW.organizer_id, OLD.organizer_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_ratings AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_ratings();

-- ─── Center rating recalc ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_center_ratings() RETURNS TRIGGER AS $$
BEGIN
  UPDATE centers SET
    avg_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric,1), 0) FROM center_reviews WHERE center_id = COALESCE(NEW.center_id, OLD.center_id) AND is_visible),
    review_count = (SELECT COUNT(*) FROM center_reviews WHERE center_id = COALESCE(NEW.center_id, OLD.center_id) AND is_visible)
  WHERE id = COALESCE(NEW.center_id, OLD.center_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_ctr_ratings AFTER INSERT OR UPDATE OR DELETE ON center_reviews FOR EACH ROW EXECUTE FUNCTION update_center_ratings();

-- ─── Product rating recalc ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_product_ratings() RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    avg_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric,1), 0) FROM product_reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_visible),
    review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_visible)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_prod_ratings AFTER INSERT OR UPDATE OR DELETE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_product_ratings();

-- ─── Penalty score recalc ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_penalty_score() RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizer_profiles SET penalty_score = (
    SELECT COALESCE(SUM(points), 0) FROM penalties WHERE organizer_id = NEW.organizer_id
  ) WHERE id = NEW.organizer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_penalty AFTER INSERT ON penalties FOR EACH ROW EXECUTE FUNCTION update_penalty_score();

-- ─── Auto-create profile on signup ─────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER tr_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Auto-create notification preferences ──────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_profile() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_new_profile AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- ─── Auto-create verification steps for new organizer ──────────────────

CREATE OR REPLACE FUNCTION handle_new_organizer() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organizer_verification_steps (organizer_id, step) VALUES
    (NEW.id, 'personal_data'),
    (NEW.id, 'identity_doc'),
    (NEW.id, 'tax_info'),
    (NEW.id, 'bank_info');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_new_org AFTER INSERT ON organizer_profiles FOR EACH ROW EXECUTE FUNCTION handle_new_organizer();

-- ─── Auto-create invoice after booking payment ─────────────────────────

CREATE OR REPLACE FUNCTION handle_booking_paid() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.platform_payment_status = 'paid' AND OLD.platform_payment_status != 'paid' THEN
    INSERT INTO invoices (user_id, booking_id, concept, amount, currency, status, tax_base, tax_amount, issued_at, paid_at)
    VALUES (
      NEW.attendee_id,
      NEW.id,
      'Cuota de gestión Retiru — Reserva ' || NEW.booking_number,
      NEW.platform_fee,
      NEW.currency,
      'paid',
      ROUND(NEW.platform_fee / 1.21, 2),
      ROUND(NEW.platform_fee - (NEW.platform_fee / 1.21), 2),
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tr_bk_invoice AFTER UPDATE OF platform_payment_status ON bookings FOR EACH ROW EXECUTE FUNCTION handle_booking_paid();

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin(uid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = uid AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retreats ENABLE ROW LEVEL SECURITY;
ALTER TABLE retreat_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE retreat_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_verification_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_attendee_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_retreats ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ──────────────────────────────────────────────────────────

CREATE POLICY "pub_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "own_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- ─── Organizer Profiles ────────────────────────────────────────────────

CREATE POLICY "org_pub" ON organizer_profiles FOR SELECT USING (status = 'verified');
CREATE POLICY "org_own" ON organizer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "org_adm" ON organizer_profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "org_ins" ON organizer_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "org_upd" ON organizer_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "org_upd_adm" ON organizer_profiles FOR UPDATE USING (is_admin(auth.uid()));

-- ─── Categories & Destinations (public read) ───────────────────────────

CREATE POLICY "cat_r" ON categories FOR SELECT USING (is_active);
CREATE POLICY "cat_a" ON categories FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "dst_r" ON destinations FOR SELECT USING (is_active);
CREATE POLICY "dst_a" ON destinations FOR ALL USING (is_admin(auth.uid()));

-- ─── Retreats ──────────────────────────────────────────────────────────

CREATE POLICY "rt_pub" ON retreats FOR SELECT USING (status = 'published');
CREATE POLICY "rt_own" ON retreats FOR SELECT USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = retreats.organizer_id AND user_id = auth.uid()));
CREATE POLICY "rt_adm" ON retreats FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "rt_ins" ON retreats FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = retreats.organizer_id AND user_id = auth.uid() AND status = 'verified'));
CREATE POLICY "rt_upd" ON retreats FOR UPDATE USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = retreats.organizer_id AND user_id = auth.uid()));
CREATE POLICY "rt_upd_adm" ON retreats FOR UPDATE USING (is_admin(auth.uid()));

-- ─── Retreat relations (public read) ───────────────────────────────────

CREATE POLICY "rcat_r" ON retreat_categories FOR SELECT USING (true);
CREATE POLICY "rimg_r" ON retreat_images FOR SELECT USING (true);
CREATE POLICY "rcat_w" ON retreat_categories FOR ALL USING (EXISTS(SELECT 1 FROM retreats r JOIN organizer_profiles o ON r.organizer_id=o.id WHERE r.id=retreat_categories.retreat_id AND o.user_id=auth.uid()));
CREATE POLICY "rimg_w" ON retreat_images FOR ALL USING (EXISTS(SELECT 1 FROM retreats r JOIN organizer_profiles o ON r.organizer_id=o.id WHERE r.id=retreat_images.retreat_id AND o.user_id=auth.uid()));

-- ─── Bookings ──────────────────────────────────────────────────────────

CREATE POLICY "bk_att" ON bookings FOR SELECT USING (attendee_id = auth.uid());
CREATE POLICY "bk_org" ON bookings FOR SELECT USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = bookings.organizer_id AND user_id = auth.uid()));
CREATE POLICY "bk_adm" ON bookings FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "bk_ins" ON bookings FOR INSERT WITH CHECK (attendee_id = auth.uid());
CREATE POLICY "bk_upd_org" ON bookings FOR UPDATE USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = bookings.organizer_id AND user_id = auth.uid()));
CREATE POLICY "bk_upd_att" ON bookings FOR UPDATE USING (attendee_id = auth.uid());
CREATE POLICY "bk_upd_adm" ON bookings FOR UPDATE USING (is_admin(auth.uid()));

-- ─── Invoices ──────────────────────────────────────────────────────────

CREATE POLICY "inv_own" ON invoices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "inv_adm" ON invoices FOR ALL USING (is_admin(auth.uid()));

-- ─── Conversations & Messages ──────────────────────────────────────────

CREATE POLICY "cv_r" ON conversations FOR SELECT USING (attendee_id = auth.uid() OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND user_id = auth.uid()));
CREATE POLICY "mg_r" ON messages FOR SELECT USING (EXISTS(SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.attendee_id = auth.uid() OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = c.organizer_id AND user_id = auth.uid()))));
CREATE POLICY "mg_ins" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ─── Reviews ───────────────────────────────────────────────────────────

CREATE POLICY "rv_pub" ON reviews FOR SELECT USING (is_visible);
CREATE POLICY "rv_ins" ON reviews FOR INSERT WITH CHECK (attendee_id = auth.uid());
CREATE POLICY "rv_upd" ON reviews FOR UPDATE USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = reviews.organizer_id AND user_id = auth.uid()));
CREATE POLICY "rv_adm" ON reviews FOR ALL USING (is_admin(auth.uid()));

-- ─── Notifications & Preferences ───────────────────────────────────────

CREATE POLICY "nf_r" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "nf_u" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "np_own" ON notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "np_upd" ON notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- ─── Organizer verification steps ──────────────────────────────────────

CREATE POLICY "ovs_own" ON organizer_verification_steps FOR SELECT USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = organizer_verification_steps.organizer_id AND user_id = auth.uid()));
CREATE POLICY "ovs_upd" ON organizer_verification_steps FOR UPDATE USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = organizer_verification_steps.organizer_id AND user_id = auth.uid()));
CREATE POLICY "ovs_adm" ON organizer_verification_steps FOR ALL USING (is_admin(auth.uid()));

-- ─── Organizer attendee tags ───────────────────────────────────────────

CREATE POLICY "oat_own" ON organizer_attendee_tags FOR ALL USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = organizer_attendee_tags.organizer_id AND user_id = auth.uid()));

-- ─── Penalties, Refunds, Audit ─────────────────────────────────────────

CREATE POLICY "pn_a" ON penalties FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "pn_own" ON penalties FOR SELECT USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = penalties.organizer_id AND user_id = auth.uid()));
CREATE POLICY "rf_att" ON refunds FOR SELECT USING (attendee_id = auth.uid());
CREATE POLICY "rf_a" ON refunds FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "al_r" ON audit_log FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "al_ins" ON audit_log FOR INSERT WITH CHECK (true);

-- ─── Centers ───────────────────────────────────────────────────────────

CREATE POLICY "ctr_pub" ON centers FOR SELECT USING (status = 'active');
CREATE POLICY "ctr_own" ON centers FOR SELECT USING (claimed_by = auth.uid());
CREATE POLICY "ctr_adm" ON centers FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "ctr_upd" ON centers FOR UPDATE USING (claimed_by = auth.uid());

-- ─── Center reviews ────────────────────────────────────────────────────

CREATE POLICY "crev_pub" ON center_reviews FOR SELECT USING (is_visible);
CREATE POLICY "crev_ins" ON center_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "crev_adm" ON center_reviews FOR ALL USING (is_admin(auth.uid()));

-- ─── Shop ──────────────────────────────────────────────────────────────

CREATE POLICY "pcat_r" ON product_categories FOR SELECT USING (true);
CREATE POLICY "pcat_a" ON product_categories FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "prod_pub" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "prod_adm" ON products FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "ord_own" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ord_ins" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ord_adm" ON orders FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "prev_pub" ON product_reviews FOR SELECT USING (is_visible);
CREATE POLICY "prev_ins" ON product_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "prev_adm" ON product_reviews FOR ALL USING (is_admin(auth.uid()));

-- ─── Blog ──────────────────────────────────────────────────────────────

CREATE POLICY "bcat_r" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "bcat_a" ON blog_categories FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "blog_pub" ON blog_articles FOR SELECT USING (is_published);
CREATE POLICY "blog_adm" ON blog_articles FOR ALL USING (is_admin(auth.uid()));

-- ─── Analytics ─────────────────────────────────────────────────────────

CREATE POLICY "pv_ins" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "pv_adm" ON page_views FOR SELECT USING (is_admin(auth.uid()));

-- ─── Saved Retreats ────────────────────────────────────────────────────

CREATE POLICY "sv_own" ON saved_retreats FOR ALL USING (user_id = auth.uid());

-- ─── Admin Config ──────────────────────────────────────────────────────

CREATE POLICY "cfg_r" ON admin_config FOR SELECT USING (true);
CREATE POLICY "cfg_a" ON admin_config FOR ALL USING (is_admin(auth.uid()));
