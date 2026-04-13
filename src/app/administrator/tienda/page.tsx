// /administrator/tienda — Gestión de la tienda (admin)
import { unstable_noStore } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import { TiendaClient } from './TiendaClient';
import { SurveyResultsClient } from './SurveyResultsClient';

export const dynamic = 'force-dynamic';

export default async function AdminTiendaPage() {
  unstable_noStore();
  const supabase = createAdminSupabase();

  const { data: products, error: errProducts } = await supabase
    .from('products')
    .select('id, name_es, slug, price, compare_price, stock, sold_count, status, featured, category_id')
    .order('created_at', { ascending: false })
    .limit(500);

  const { data: categories, error: errCategories } = await supabase
    .from('product_categories')
    .select('id, name_es, slug')
    .order('sort_order');

  const { data: orders, error: errOrders } = await supabase
    .from('orders')
    .select('id, order_number, user_id, items, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Survey results
  const { data: surveyStats, error: errSurvey } = await supabase
    .rpc('get_shop_interest_stats');

  const { data: surveyComments } = await supabase
    .from('shop_product_interests')
    .select('product_category, comments, created_at')
    .not('comments', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (errProducts) console.error('Error products:', errProducts);
  if (errCategories) console.error('Error categories:', errCategories);
  if (errOrders) console.error('Error orders:', errOrders);
  if (errSurvey) console.error('Error survey:', errSurvey);

  const productList = (products || []) as any[];
  const categoryList = (categories || []) as any[];
  const orderList = (orders || []) as any[];

  const categoryIds = [...new Set(productList.map((p) => p.category_id).filter(Boolean))];
  const categoryMap = (categoryList || []).reduce((acc: Record<string, string>, c: any) => {
    acc[c.id] = c.name_es || '';
    return acc;
  }, {});

  const userIds = [...new Set(orderList.map((o) => o.user_id).filter(Boolean))];
  let userMap: Record<string, { label: string; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
    userMap = (profiles || []).reduce((acc: Record<string, { label: string; email: string | null }>, p: any) => {
      acc[p.id] = {
        label: p.full_name || p.email || '—',
        email: p.email || null,
      };
      return acc;
    }, {});
  }

  const productsWithCategory = productList.map((p) => ({
    id: p.id,
    name: p.name_es,
    slug: p.slug,
    category: categoryMap[p.category_id] || '—',
    price: Number(p.price || 0),
    compare_price: p.compare_price ? Number(p.compare_price) : null,
    stock: p.stock ?? 0,
    sold: p.sold_count ?? 0,
    status: p.status,
    featured: !!p.featured,
  }));

  const categoriesWithCount = categoryList.map((c) => {
    const count = productList.filter((p) => p.category_id === c.id).length;
    return { id: c.id, name: c.name_es, slug: c.slug, products: count };
  });

  const recentOrders = orderList.slice(0, 10).map((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const u = userMap[o.user_id];
    return {
      id: o.id,
      order_number: o.order_number,
      customer: u?.label || '—',
      customer_email: u?.email || null,
      items: items.length,
      total: Number(o.total || 0),
      status: o.status,
      date: o.created_at,
    };
  });

  const totalRevenue = productsWithCategory.reduce((s, p) => s + p.price * p.sold, 0);
  const totalSold = productsWithCategory.reduce((s, p) => s + p.sold, 0);
  const activeProducts = productsWithCategory.filter((p) => p.status === 'active').length;

  const surveyStatsList = (surveyStats || []).map((s: any) => ({
    category: s.category,
    total_votes: Number(s.total_votes),
    avg_interest: Number(s.avg_interest),
    level_1: Number(s.level_1),
    level_2: Number(s.level_2),
    level_3: Number(s.level_3),
    level_4: Number(s.level_4),
    level_5: Number(s.level_5),
  }));

  const surveyCommentsList = (surveyComments || []).map((c: any) => ({
    category: c.product_category,
    comment: c.comments,
    created_at: c.created_at,
  }));

  return (
    <div className="space-y-8">
      <TiendaClient
        products={productsWithCategory}
        categories={categoriesWithCount}
        recentOrders={recentOrders}
        stats={{
          activeProducts,
          totalSold,
          totalRevenue,
          categoriesCount: categoriesWithCount.length,
        }}
      />

      <div className="border-t-2 border-sand-200 pt-8">
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-foreground mb-2">Encuesta de productos</h2>
          <p className="text-sm text-[#7a6b5d]">
            Resultados de la encuesta de interés de productos de los usuarios
          </p>
        </div>
        <SurveyResultsClient stats={surveyStatsList} comments={surveyCommentsList} />
      </div>
    </div>
  );
}
