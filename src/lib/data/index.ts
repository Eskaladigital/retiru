// ============================================================================
// RETIRU · Capa de datos Supabase
// Funciones para consultar tablas públicas (categories, destinations, retreats, centers, products)
// Usar createServerSupabase en Server Components / Route Handlers
// ============================================================================

import { createServerSupabase, createStaticSupabase, createAdminSupabase } from '@/lib/supabase/server';
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
  organizer_profiles!organizer_id(id, slug, business_name, logo_url, avg_rating, review_count, total_retreats, status),
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
      categories: [] as Category[],
      images: (retreat_images as Retreat['images']) ?? [],
    } as unknown as Retreat;
  });

  if (retreats.length) {
    const retreatIds = retreats.map((r) => r.id);
    const { data: catLinks } = await supabase
      .from('retreat_categories')
      .select('retreat_id, category_id')
      .in('retreat_id', retreatIds);
    if (catLinks?.length) {
      const catIds = [...new Set(catLinks.map((c) => c.category_id))];
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .in('id', catIds);
      const catMap = new Map((cats || []).map((c) => [c.id, c]));
      for (const r of retreats) {
        r.categories = catLinks
          .filter((cl) => cl.retreat_id === r.id)
          .map((cl) => catMap.get(cl.category_id))
          .filter(Boolean) as Category[];
      }
    }
  }

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

/** Obtiene un retiro por slug sin filtrar por status. Solo para admin (preview de pendientes). */
export async function getRetreatBySlugForAdmin(slug: string): Promise<Retreat | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('retreats')
    .select(RETREAT_SELECT)
    .eq('slug', slug)
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
    const catIds = (catLinks as { category_id: string }[]).map((c) => c.category_id);
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .in('id', catIds);
    retreat.categories = (cats || []) as Category[];
  }

  return retreat;
}

// ─── Centers ──────────────────────────────────────────────────────────────

const CENTER_SELECT = `
  id, name, slug, description_es, description_en, type, categories,
  logo_url, cover_url, images, website, email, phone, instagram, facebook,
  address, city, province, postal_code, latitude, longitude,
  services_es, services_en, schedule_summary_es, schedule_summary_en,
  price_range_es, price_range_en, avg_rating, review_count, status, claimed_by,
  google_place_id, google_maps_url
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

/** Usar solo en generateStaticParams (build time, sin cookies) */
export async function getCenterSlugs(): Promise<string[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('centers')
    .select('slug')
    .eq('status', 'active')
    .order('slug');
  if (error) throw error;
  return (data || []).map((r) => r.slug).filter((s): s is string => !!s && typeof s === 'string');
}

/** Usar solo en generateStaticParams */
export async function getRetreatSlugs(): Promise<string[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('retreats')
    .select('slug')
    .eq('status', 'published')
    .gte('end_date', new Date().toISOString().slice(0, 10))
    .order('slug');
  if (error) throw error;
  return (data || []).map((r) => r.slug).filter(Boolean);
}

/** Usar solo en generateStaticParams */
export async function getBlogPostSlugs(locale: 'es' | 'en' = 'es'): Promise<string[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('blog_articles')
    .select('slug, slug_en')
    .eq('is_published', true)
    .order('slug');
  if (error) throw error;
  if (locale === 'en') {
    return (data || []).map((r: any) => r.slug_en || r.slug).filter(Boolean);
  }
  return (data || []).map((r) => r.slug).filter(Boolean);
}

/** Usar solo en generateStaticParams */
export async function getOrganizerSlugs(): Promise<string[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('slug')
    .eq('status', 'verified')
    .order('slug');
  if (error) throw error;
  return (data || []).map((r) => r.slug).filter(Boolean);
}

/** Usar solo en generateStaticParams */
export async function getProductSlugs(): Promise<string[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('products')
    .select('slug')
    .eq('status', 'active')
    .order('slug');
  if (error) throw error;
  return (data || []).map((r) => r.slug).filter(Boolean);
}

/** Slugs para tienda/shop (usa products — tienda puede usar products o shop_products) */
export async function getShopProductSlugs(): Promise<string[]> {
  return getProductSlugs();
}

/** Misma tabla que `/es/tienda` y `/en/shop` (`shop_products`). Home: ocultar bloque si vacío. */
export type HomeShopProductRow = {
  id: string;
  slug: string;
  name_es: string;
  name_en: string | null;
  price: number;
  compare_price: number | null;
  images: unknown;
};

export async function getHomeShopProducts(limit = 4): Promise<HomeShopProductRow[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('shop_products')
    .select('id, slug, name_es, name_en, price, compare_price, images')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as HomeShopProductRow[];
}

/** Usar solo en generateStaticParams */
export async function getDestinationSlugs(): Promise<string[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('destinations')
    .select('slug')
    .eq('is_active', true)
    .order('slug');
  if (error) throw error;
  return (data || []).map((r) => r.slug).filter(Boolean);
}

/** Destinos que tienen al menos 1 retiro publicado (para sitemap y generateStaticParams) */
export async function getDestinationsWithRetreats(): Promise<{ slug: string; name_es: string; name_en: string }[]> {
  const supabase = createStaticSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data: retreats, error: rErr } = await supabase
    .from('retreats')
    .select('destination_id')
    .eq('status', 'published')
    .gte('end_date', today);
  if (rErr) throw rErr;
  const destIds = [...new Set((retreats || []).map(r => r.destination_id).filter(Boolean))];
  if (!destIds.length) return [];
  const { data: dests, error: dErr } = await supabase
    .from('destinations')
    .select('slug, name_es, name_en')
    .eq('is_active', true)
    .in('id', destIds)
    .order('slug');
  if (dErr) throw dErr;
  return (dests || []).map(d => ({ slug: d.slug, name_es: d.name_es, name_en: d.name_en }));
}

/** Ciudades/provincias distintas con centros activos (para generateStaticParams) */
export async function getCenterProvinces(): Promise<{ slug: string; name: string }[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('centers')
    .select('province')
    .eq('status', 'active');
  if (error) throw error;
  const unique = new Map<string, string>();
  for (const row of data || []) {
    if (!row.province) continue;
    const slug = row.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    if (!unique.has(slug)) unique.set(slug, row.province);
  }
  return Array.from(unique.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Centros activos filtrados por provincia (slug normalizado) */
export async function getCentersByProvince(provinceSlug: string): Promise<{ centers: Center[]; provinceName: string | null }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('centers')
    .select(CENTER_SELECT)
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  const all = (data || []) as Center[];
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const filtered = all.filter(c => c.province && normalize(c.province) === provinceSlug);
  const provinceName = filtered.length ? filtered[0].province : null;
  return { centers: filtered, provinceName };
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

// ─── Bookings (usuario attendee) ──────────────────────────────────────────

export async function getBookingsForUser(userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, status, total_price, platform_fee, organizer_amount, created_at, payment_deadline,
      retreats!retreat_id(id, title_es, title_en, slug, start_date, end_date, retreat_images(url, is_cover)),
      organizer_profiles!organizer_id(id, business_name, slug)
    `)
    .eq('attendee_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as Array<{
    id: string;
    booking_number: string;
    status: string;
    total_price: number;
    platform_fee: number;
    organizer_amount: number;
    created_at: string;
    payment_deadline: string | null;
    retreats: { id: string; title_es: string; title_en: string; slug: string; start_date: string; end_date: string; retreat_images?: { url: string; is_cover: boolean }[] } | null;
    organizer_profiles: { id: string; business_name: string; slug: string } | null;
  }>;
}

export async function getBookingById(bookingId: string, userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, status, total_price, platform_fee, organizer_amount,
      platform_payment_status, remaining_payment_status, qr_code, created_at,
      retreats!retreat_id(id, title_es, title_en, slug, start_date, end_date, duration_days, address, destination_id, destinations(name_es), retreat_images(url, alt_text, is_cover)),
      organizer_profiles!organizer_id(id, business_name, slug)
    `)
    .eq('id', bookingId)
    .eq('attendee_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// ─── SEO Landings: funciones para landings programáticas ──────────────────

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Category;
}

/** Categorías con al menos 1 retiro publicado vigente (para generateStaticParams) */
export async function getCategoriesWithRetreats(): Promise<{ slug: string; name_es: string; name_en: string }[]> {
  const supabase = createStaticSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: links, error: lErr } = await supabase
    .from('retreat_categories')
    .select('category_id, retreats!inner(status, end_date)')
    .eq('retreats.status', 'published')
    .gte('retreats.end_date', today);
  if (lErr) throw lErr;

  const catIds = [...new Set((links || []).map((l: any) => l.category_id).filter(Boolean))];
  if (!catIds.length) return [];

  const { data: cats, error: cErr } = await supabase
    .from('categories')
    .select('slug, name_es, name_en')
    .eq('is_active', true)
    .in('id', catIds)
    .order('sort_order');
  if (cErr) throw cErr;
  return (cats || []) as { slug: string; name_es: string; name_en: string }[];
}

/** Pares {categorySlug, destinationSlug} con al menos 1 retiro publicado vigente */
export async function getCategoryDestinationPairs(): Promise<{ category: string; destination: string }[]> {
  const supabase = createStaticSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: retreats, error: rErr } = await supabase
    .from('retreats')
    .select('id, destination_id')
    .eq('status', 'published')
    .gte('end_date', today);
  if (rErr) throw rErr;
  if (!retreats?.length) return [];

  const retreatIds = retreats.map(r => r.id);
  const { data: links, error: lErr } = await supabase
    .from('retreat_categories')
    .select('retreat_id, category_id')
    .in('retreat_id', retreatIds);
  if (lErr) throw lErr;

  const catIds = [...new Set((links || []).map(l => l.category_id))];
  const destIds = [...new Set(retreats.map(r => r.destination_id).filter(Boolean))];
  if (!catIds.length || !destIds.length) return [];

  const [{ data: cats }, { data: dests }] = await Promise.all([
    supabase.from('categories').select('id, slug').eq('is_active', true).in('id', catIds),
    supabase.from('destinations').select('id, slug').eq('is_active', true).in('id', destIds),
  ]);

  const catMap = new Map((cats || []).map(c => [c.id, c.slug]));
  const destMap = new Map((dests || []).map(d => [d.id, d.slug]));
  const retreatDestMap = new Map(retreats.map(r => [r.id, r.destination_id]));

  const pairs = new Set<string>();
  for (const link of links || []) {
    const catSlug = catMap.get(link.category_id);
    const destSlug = destMap.get(retreatDestMap.get(link.retreat_id) ?? '');
    if (catSlug && destSlug) pairs.add(`${catSlug}|${destSlug}`);
  }

  return Array.from(pairs).map(p => {
    const [category, destination] = p.split('|');
    return { category, destination };
  });
}

/** Pares {type, provinceSlug} con al menos 1 centro activo */
export async function getCenterTypeProvincePairs(): Promise<{ type: string; province: string; provinceName: string }[]> {
  const supabase = createStaticSupabase();
  const { data, error } = await supabase
    .from('centers')
    .select('type, province')
    .eq('status', 'active');
  if (error) throw error;

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

  const seen = new Map<string, { type: string; province: string; provinceName: string }>();
  for (const row of data || []) {
    if (!row.type || !row.province) continue;
    const key = `${row.type}|${normalize(row.province)}`;
    if (!seen.has(key)) seen.set(key, { type: row.type, province: normalize(row.province), provinceName: row.province });
  }
  return Array.from(seen.values());
}

/** Provincias con al menos 1 centro del tipo dado */
export async function getProvincesForCenterType(type: string): Promise<{ slug: string; name: string; count: number }[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('centers')
    .select('province')
    .eq('status', 'active')
    .eq('type', type);
  if (error) throw error;

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

  const counts = new Map<string, { name: string; count: number }>();
  for (const row of data || []) {
    if (!row.province) continue;
    const slug = normalize(row.province);
    const prev = counts.get(slug);
    if (prev) prev.count++;
    else counts.set(slug, { name: row.province, count: 1 });
  }
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Destinos con al menos 1 retiro de la categoría dada */
export async function getDestinationsForCategory(categorySlug: string): Promise<{ slug: string; name_es: string; name_en: string; count: number }[]> {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: catRow } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();
  if (!catRow) return [];

  const { data: links } = await supabase
    .from('retreat_categories')
    .select('retreat_id')
    .eq('category_id', catRow.id);
  if (!links?.length) return [];

  const retreatIds = links.map(l => l.retreat_id);
  const { data: retreats } = await supabase
    .from('retreats')
    .select('destination_id')
    .eq('status', 'published')
    .gte('end_date', today)
    .in('id', retreatIds);
  if (!retreats?.length) return [];

  const destCounts = new Map<string, number>();
  for (const r of retreats) {
    if (!r.destination_id) continue;
    destCounts.set(r.destination_id, (destCounts.get(r.destination_id) || 0) + 1);
  }

  const destIds = Array.from(destCounts.keys());
  const { data: dests } = await supabase
    .from('destinations')
    .select('id, slug, name_es, name_en')
    .eq('is_active', true)
    .in('id', destIds)
    .order('name_es');

  return (dests || []).map(d => ({
    slug: d.slug,
    name_es: d.name_es,
    name_en: d.name_en,
    count: destCounts.get(d.id) || 0,
  }));
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
