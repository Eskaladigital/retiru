// ============================================================================
// RETIRU · Capa de datos Supabase
// Funciones para consultar tablas públicas (categories, destinations, retreats, centers, products)
// Usar createServerSupabase en Server Components / Route Handlers
// ============================================================================

import { createServerSupabase } from '@/lib/supabase/server';
import type { Locale } from '@/types';
import type { Category, Destination, Retreat, Center, Product, OrganizerProfile } from '@/types';

// ─── Categories ───────────────────────────────────────────────────────────

export async function getCategories(locale: Locale = 'es'): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []) as Category[];
}

// ─── Destinations ─────────────────────────────────────────────────────────

export async function getDestinations(locale: Locale = 'es'): Promise<Destination[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []) as Destination[];
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Destination;
}

// ─── Retreats ──────────────────────────────────────────────────────────────

const RETREAT_SELECT = `
  id, organizer_id, title_es, title_en, slug, summary_es, summary_en,
  description_es, description_en, includes_es, includes_en, excludes_es, excludes_en,
  destination_id, address, latitude, longitude, start_date, end_date, duration_days,
  max_attendees, min_attendees, total_price, platform_fee, organizer_amount, currency,
  confirmation_type, sla_hours, languages, cancellation_policy, post_booking_form, schedule,
  status, confirmed_bookings, available_spots, view_count, avg_rating, review_count,
  organizer_profiles!organizer_id(id, slug, business_name, logo_url, avg_rating, review_count),
  destinations!destination_id(id, name_es, name_en, slug, region, country),
  retreat_images(id, url, alt_text, sort_order, is_cover)
`;

export async function getPublishedRetreats(filters?: {
  categorySlug?: string;
  destinationSlug?: string;
  limit?: number;
  offset?: number;
}): Promise<{ retreats: Retreat[]; total: number }> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from('retreats')
    .select(RETREAT_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .gte('end_date', new Date().toISOString().slice(0, 10))
    .order('start_date', { ascending: true });

  if (filters?.categorySlug) {
    const { data: catIds } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.categorySlug)
      .limit(1);
    if (catIds?.length) {
      const { data: rc } = await supabase
        .from('retreat_categories')
        .select('retreat_id')
        .eq('category_id', catIds[0].id);
      const retreatIds = rc?.map((r) => r.retreat_id) || [];
      if (retreatIds.length) query = query.in('id', retreatIds);
      else return { retreats: [], total: 0 };
    }
  }

  if (filters?.destinationSlug) {
    const { data: dest } = await supabase
      .from('destinations')
      .select('id')
      .eq('slug', filters.destinationSlug)
      .single();
    if (dest) query = query.eq('destination_id', dest.id);
  }

  const limit = filters?.limit ?? 12;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  const retreats = (data || []).map((r: Record<string, unknown>) => {
    const { organizer_profiles, destinations, retreat_images, ...rest } = r;
    return {
      ...rest,
      organizer: organizer_profiles ?? undefined,
      destination: destinations ?? undefined,
      categories: [],
      images: (retreat_images as Retreat['images']) ?? [],
    } as unknown as Retreat;
  });

  return { retreats, total: count ?? 0 };
}

export async function getRetreatBySlug(slug: string): Promise<Retreat | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('retreats')
    .select(RETREAT_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  const raw = data as Record<string, unknown>;
  const { organizer_profiles, destinations, retreat_images, ...rest } = raw;
  const retreat = {
    ...rest,
    organizer: organizer_profiles as OrganizerProfile | undefined,
    destination: destinations as Destination | undefined,
    categories: [] as Category[],
    images: (retreat_images as Retreat['images']) ?? [],
  } as unknown as Retreat;

  const { data: catLinks } = await supabase
    .from('retreat_categories')
    .select('category_id')
    .eq('retreat_id', retreat.id);
  if (catLinks?.length) {
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .in('id', catLinks.map((c) => c.category_id));
    retreat.categories = (cats || []) as Category[];
  }

  return retreat;
}

// ─── Centers ──────────────────────────────────────────────────────────────

const CENTER_SELECT = `
  id, name, slug, description_es, description_en, type, categories,
  logo_url, cover_url, images, website, email, phone, instagram,
  address, city, province, postal_code, latitude, longitude,
  services_es, services_en, schedule_summary_es, schedule_summary_en,
  price_range_es, price_range_en, avg_rating, review_count, status
`;

export async function getActiveCenters(filters?: {
  province?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ centers: Center[]; total: number }> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from('centers')
    .select(CENTER_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (filters?.province) query = query.eq('province', filters.province);
  if (filters?.type) query = query.eq('type', filters.type);

  const limit = filters?.limit ?? 12;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;
  return { centers: (data || []) as Center[], total: count ?? 0 };
}

export async function getCenterBySlug(slug: string): Promise<Center | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('centers')
    .select(CENTER_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Center;
}

// ─── Organizers ───────────────────────────────────────────────────────────

export async function getOrganizerBySlug(slug: string): Promise<OrganizerProfile | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'verified')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as OrganizerProfile;
}

// ─── Products ─────────────────────────────────────────────────────────────

const PRODUCT_SELECT = `
  id, name_es, name_en, slug, description_es, description_en, features_es, features_en,
  category_id, price, compare_price, currency, images, status, stock, badge, featured,
  avg_rating, review_count
`;

export async function getActiveProducts(filters?: {
  categorySlug?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: Product[]; total: number }> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .order('sold_count', { ascending: false });

  if (filters?.categorySlug) {
    const { data: cat } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', filters.categorySlug)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const limit = filters?.limit ?? 12;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;
  return { products: (data || []) as Product[], total: count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Product;
}

// ─── Product categories (para filtros tienda) ────────────────────────────

export async function getProductCategories(): Promise<{ id: string; name_es: string; name_en: string; slug: string }[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name_es, name_en, slug')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []) as { id: string; name_es: string; name_en: string; slug: string }[];
}
