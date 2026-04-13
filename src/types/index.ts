// ============================================================================
// RETIRU · Database Types (mirrors Supabase schema in 001_initial.sql)
// ============================================================================

export type Locale = 'es' | 'en';

// ─── Enums ─────────────────────────────────────────────────────────────────

export type UserRole = 'attendee' | 'organizer' | 'admin';
export type OrganizerStatus = 'pending' | 'verified' | 'suspended' | 'rejected';
export type RetreatStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived' | 'cancelled';
export type RetreatConfirmationType = 'automatic' | 'manual';
export type BookingStatus =
  | 'pending_payment'
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'sla_expired'
  | 'completed'
  | 'cancelled_by_attendee'
  | 'cancelled_by_organizer'
  | 'refunded'
  | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
export type RemainingPaymentStatus = 'pending' | 'confirmed_by_organizer' | 'overdue' | 'disputed';
export type RefundReason = 'cancelled_by_attendee' | 'cancelled_by_organizer' | 'sla_expired' | 'admin_decision' | 'dispute' | 'other';
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'rejected';
export type PenaltyType = 'warning' | 'minor' | 'major' | 'suspension';
export type NotificationType =
  | 'booking_new' | 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled'
  | 'payment_reminder' | 'payment_received' | 'sla_warning' | 'sla_expired'
  | 'review_received' | 'message_new' | 'retreat_approved' | 'retreat_rejected'
  | 'penalty_received' | 'general';
export type CenterStatus = 'active' | 'inactive' | 'pending_payment' | 'pending_review' | 'expired';
export type CenterPlan = 'basic' | 'featured';
/** Tipos de centro (fase 1 directorio): solo estas tres disciplinas */
export type CenterType = 'yoga' | 'meditation' | 'ayurveda';
export type ProductStatus = 'active' | 'draft' | 'out_of_stock';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'voided';
export type VerificationStep = 'personal_data' | 'identity_doc' | 'tax_info' | 'bank_info';
export type VerificationStepStatus = 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected';

// ─── Profile ───────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  preferred_locale: Locale;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Organizer ─────────────────────────────────────────────────────────────

export interface OrganizerProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  description_es: string | null;
  description_en: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  location: string | null;
  languages: string[];
  tax_id: string | null;
  tax_name: string | null;
  tax_address: string | null;
  iban: string | null;
  status: OrganizerStatus;
  id_document_url: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  penalty_score: number;
  default_sla_hours: number;
  total_retreats: number;
  total_bookings: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

// ─── Category ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name_es: string;
  name_en: string;
  slug: string;
  description_es: string | null;
  description_en: string | null;
  icon: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

// ─── Destination ───────────────────────────────────────────────────────────

export interface Destination {
  id: string;
  name_es: string;
  name_en: string;
  slug: string;
  description_es: string | null;
  description_en: string | null;
  intro_es: string | null;
  intro_en: string | null;
  cover_image_url: string | null;
  country: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  faq: DestinationFAQ[];
  sort_order: number;
  is_active: boolean;
}

export interface DestinationFAQ {
  question: string;
  answer: string;
}

// ─── JSONB sub-types ───────────────────────────────────────────────────────

export interface CancellationTier {
  days_before: number;
  refund_percent: number;
}

export interface CancellationPolicy {
  type: 'flexible' | 'standard' | 'strict' | 'custom';
  refund_tiers: CancellationTier[];
  platform_fee_refundable: boolean;
}

export interface FormField {
  id: string;
  label_es: string;
  label_en?: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number';
  required: boolean;
  options?: string[];
  placeholder_es?: string;
  placeholder_en?: string;
}

export interface ScheduleDay {
  day: number;
  title_es: string;
  title_en?: string;
  items: ScheduleItem[];
}

export interface ScheduleItem {
  time: string;
  title_es: string;
  title_en?: string;
  description_es?: string;
  description_en?: string;
}

// ─── Retreat ───────────────────────────────────────────────────────────────

export interface Retreat {
  id: string;
  organizer_id: string;
  title_es: string;
  title_en: string | null;
  slug: string;
  summary_es: string;
  summary_en: string | null;
  description_es: string;
  description_en: string | null;
  includes_es: string[] | null;
  includes_en: string[] | null;
  excludes_es: string[] | null;
  excludes_en: string[] | null;
  destination_id: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  max_attendees: number;
  min_attendees: number | null;
  total_price: number;
  platform_fee: number;
  organizer_amount: number;
  currency: string;
  confirmation_type: RetreatConfirmationType;
  sla_hours: number;
  languages: string[];
  cancellation_policy: CancellationPolicy;
  post_booking_form: FormField[];
  schedule: ScheduleDay[];
  status: RetreatStatus;
  rejection_reason: string | null;
  published_at: string | null;
  meta_title_es: string | null;
  meta_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
  confirmed_bookings: number;
  available_spots: number;
  view_count: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  organizer?: OrganizerProfile;
  destination?: Destination;
  categories?: Category[];
  images?: RetreatImage[];
}

export interface RetreatImage {
  id: string;
  retreat_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
}

// ─── Booking ───────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  booking_number: string;
  retreat_id: string;
  attendee_id: string;
  organizer_id: string;
  total_price: number;
  platform_fee: number;
  organizer_amount: number;
  currency: string;
  status: BookingStatus;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  platform_payment_status: PaymentStatus;
  platform_paid_at: string | null;
  remaining_payment_status: RemainingPaymentStatus;
  remaining_payment_due_date: string | null;
  remaining_payment_confirmed_at: string | null;
  sla_deadline: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: number;
  refund_reason: RefundReason | null;
  refunded_at: string | null;
  stripe_refund_id: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  qr_code: string | null;
  form_responses: Record<string, unknown>;
  organizer_notes: string | null;
  created_at: string;
  updated_at: string;
  retreat?: Retreat;
  attendee?: Profile;
  organizer?: OrganizerProfile;
}

// ─── Invoice ───────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  booking_id: string | null;
  order_id: string | null;
  concept: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdf_url: string | null;
  tax_base: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  user?: Profile;
  booking?: Booking;
  order?: Order;
}

// ─── Conversation & Messages ───────────────────────────────────────────────

export interface Conversation {
  id: string;
  retreat_id: string | null;
  booking_id: string | null;
  user_id: string | null;
  attendee_id: string;
  organizer_id: string;
  last_message_at: string | null;
  attendee_unread: number;
  organizer_unread: number;
  created_at: string;
  retreat?: Retreat;
  booking?: Booking;
  attendee?: Profile;
  user?: Profile;
  organizer?: OrganizerProfile;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'template';
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

// ─── Review (Retreats) ────────────────────────────────────────────────────

export interface Review {
  id: string;
  booking_id: string;
  retreat_id: string;
  attendee_id: string;
  organizer_id: string;
  rating: number;
  title: string | null;
  content: string;
  response: string | null;
  responded_at: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  attendee?: Profile;
  retreat?: Retreat;
}

// ─── Notification ──────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title_es: string;
  title_en: string | null;
  body_es: string | null;
  body_en: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  new_booking_email: boolean;
  new_booking_push: boolean;
  new_message_email: boolean;
  new_message_push: boolean;
  new_review_email: boolean;
  new_review_push: boolean;
  booking_reminder: boolean;
  marketing_email: boolean;
  updated_at: string;
}

// ─── Organizer Verification ───────────────────────────────────────────────

export interface OrganizerVerificationStep {
  id: string;
  organizer_id: string;
  step: VerificationStep;
  status: VerificationStepStatus;
  data: Record<string, unknown>;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Organizer Attendee Tags ──────────────────────────────────────────────

export interface OrganizerAttendeeTag {
  id: string;
  organizer_id: string;
  attendee_id: string;
  tag: string;
  created_at: string;
}

// ─── Penalty ──────────────────────────────────────────────────────────────

export interface Penalty {
  id: string;
  organizer_id: string;
  type: PenaltyType;
  reason: string;
  points: number;
  booking_id: string | null;
  issued_by: string | null;
  created_at: string;
}

// ─── Refund ───────────────────────────────────────────────────────────────

export interface Refund {
  id: string;
  booking_id: string;
  attendee_id: string;
  retreat_id: string;
  amount: number;
  reason: RefundReason;
  reason_detail: string | null;
  status: RefundStatus;
  stripe_refund_id: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  booking?: Booking;
  attendee?: Profile;
  retreat?: Retreat;
}

// ─── Center (Directorio) ──────────────────────────────────────────────────

export interface Center {
  id: string;
  name: string;
  slug: string;
  description_es: string;
  description_en: string | null;
  type: CenterType;
  categories: string[];
  logo_url: string | null;
  cover_url: string | null;
  images: string[];
  website: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  address: string;
  city: string;
  province: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  plan: CenterPlan;
  status: CenterStatus;
  price_monthly: number;
  subscription_start: string | null;
  subscription_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  services_es: string[];
  services_en: string[];
  schedule_summary_es: string | null;
  schedule_summary_en: string | null;
  price_range_es: string | null;
  price_range_en: string | null;
  meta_title_es: string | null;
  meta_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
  avg_rating: number;
  review_count: number;
  view_count: number;
  claimed_by: string | null;
  /** Usuario que propuso el centro (pendiente de revisión admin) */
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
  description_ai_generated_at: string | null;
  google_place_id: string | null;
  google_types: string | null;
  google_maps_url: string | null;
  google_status: string | null;
  region: string | null;
  country: string | null;
  web_valid_ia: string | null;
  quality_ia: string | null;
  search_terms: string | null;
  price_level: string | null;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type ClaimMethod = 'email_match' | 'magic_link' | 'manual_request';

export interface CenterClaim {
  id: string;
  center_id: string;
  user_id: string;
  status: ClaimStatus;
  method: ClaimMethod;
  notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  center?: Center;
  user?: Profile;
}

export interface ClaimToken {
  id: string;
  center_id: string;
  token: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface CenterReview {
  id: string;
  center_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string;
  response: string | null;
  responded_at: string | null;
  is_visible: boolean;
  created_at: string;
  user?: Profile;
}

// ─── Shop (Tienda) ────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  name_es: string;
  name_en: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name_es: string;
  name_en: string | null;
  slug: string;
  description_es: string;
  description_en: string | null;
  features_es: string[];
  features_en: string[];
  category_id: string;
  price: number;
  compare_price: number | null;
  currency: string;
  images: string[];
  status: ProductStatus;
  stock: number;
  sku: string | null;
  weight_grams: number | null;
  tags: string[];
  badge: string | null;
  featured: boolean;
  stripe_price_id: string | null;
  meta_title_es: string | null;
  meta_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
  view_count: number;
  sold_count: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_province: string;
  shipping_country: string;
  stripe_payment_intent_id: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  content: string;
  is_visible: boolean;
  created_at: string;
  user?: Profile;
  product?: Product;
}

// ─── Blog ─────────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: string;
  name_es: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

export interface BlogArticle {
  id: string;
  title_es: string;
  title_en: string | null;
  slug: string;
  excerpt_es: string;
  excerpt_en: string | null;
  content_es: string;
  content_en: string | null;
  category_id: string;
  author_id: string;
  cover_image_url: string | null;
  read_time_min: number;
  is_published: boolean;
  published_at: string | null;
  meta_title_es: string | null;
  meta_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  category?: BlogCategory;
  author?: Profile;
}

// ─── Analytics ────────────────────────────────────────────────────────────

export interface PageView {
  id: string;
  retreat_id: string | null;
  center_id: string | null;
  product_id: string | null;
  article_id: string | null;
  source: string;
  referrer: string | null;
  created_at: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string | null;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Saved Retreats ───────────────────────────────────────────────────────

export interface SavedRetreat {
  user_id: string;
  retreat_id: string;
  created_at: string;
}

// ─── Search ───────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string;
  category?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  durationMin?: number;
  durationMax?: number;
  language?: string;
  hasAvailability?: boolean;
  instantConfirmation?: boolean;
  minRating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  retreats: Retreat[];
  centers?: Center[];
  total: number;
  page: number;
  totalPages: number;
}
