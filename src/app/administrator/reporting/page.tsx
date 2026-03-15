// /administrator/reporting — Métricas globales (admin)
import { unstable_noStore } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminReportingPage() {
  unstable_noStore();
  const supabase = createAdminSupabase();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // GMV e ingresos este mes (bookings pagados)
  const { data: bookingsThisMonth } = await supabase
    .from('bookings')
    .select('total_price, platform_fee')
    .gte('platform_paid_at', startOfMonth)
    .not('platform_paid_at', 'is', null);

  const gmvThisMonth = (bookingsThisMonth || []).reduce((s: number, b: { total_price?: number }) => s + Number(b.total_price || 0), 0);
  const ingresosThisMonth = (bookingsThisMonth || []).reduce((s: number, b: { platform_fee?: number }) => s + Number(b.platform_fee || 0), 0);

  // GMV mes anterior (para % cambio)
  const { data: bookingsPrevMonth } = await supabase
    .from('bookings')
    .select('total_price, platform_fee')
    .gte('platform_paid_at', startOfPrevMonth)
    .lte('platform_paid_at', endOfPrevMonth)
    .not('platform_paid_at', 'is', null);

  const gmvPrevMonth = (bookingsPrevMonth || []).reduce((s: number, b: { total_price?: number }) => s + Number(b.total_price || 0), 0);
  const ingresosPrevMonth = (bookingsPrevMonth || []).reduce((s: number, b: { platform_fee?: number }) => s + Number(b.platform_fee || 0), 0);

  const gmvChange = gmvPrevMonth > 0 ? ((gmvThisMonth - gmvPrevMonth) / gmvPrevMonth) * 100 : 0;
  const ingresosChange = ingresosPrevMonth > 0 ? ((ingresosThisMonth - ingresosPrevMonth) / ingresosPrevMonth) * 100 : 0;

  // Nuevos usuarios este mes
  const { count: newUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth);

  const { count: newUsersPrevCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfPrevMonth)
    .lte('created_at', endOfPrevMonth);

  const newUsersChange = (newUsersPrevCount || 0) > 0
    ? (((newUsersCount || 0) - (newUsersPrevCount || 0)) / (newUsersPrevCount || 0)) * 100
    : 0;

  // Tasa cancelación (todas las reservas)
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['confirmed', 'completed', 'cancelled_by_attendee', 'cancelled_by_organizer', 'refunded']);

  const { count: cancelledBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['cancelled_by_attendee', 'cancelled_by_organizer', 'refunded']);

  const totalB = totalBookings || 0;
  const cancelledB = cancelledBookings || 0;
  const cancelRate = totalB > 0 ? (cancelledB / totalB) * 100 : 0;

  // Top categorías por reservas (retreat_categories → retreats → bookings)
  const { data: retreatCats } = await supabase
    .from('retreat_categories')
    .select('retreat_id, category_id');

  const categoryIds = [...new Set((retreatCats || []).map((rc: any) => rc.category_id).filter(Boolean))];
  const { data: categoriesData } = categoryIds.length > 0
    ? await supabase.from('categories').select('id, name_es').in('id', categoryIds)
    : { data: [] };

  const catNameMap = (categoriesData || []).reduce((acc: Record<string, string>, c: any) => {
    acc[c.id] = c.name_es || '';
    return acc;
  }, {});

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('retreat_id')
    .in('status', ['confirmed', 'completed']);

  const catCounts: Record<string, { name: string; count: number }> = {};
  for (const rc of retreatCats || []) {
    const catName = catNameMap[(rc as any).category_id] || 'Otros';
    if (!catCounts[catName]) catCounts[catName] = { name: catName, count: 0 };
    const retreatBookings = (allBookings || []).filter((b: { retreat_id: string }) => b.retreat_id === (rc as { retreat_id: string }).retreat_id).length;
    catCounts[catName].count += retreatBookings;
  }
  const topCategories = Object.values(catCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const totalCatBookings = topCategories.reduce((s, c) => s + c.count, 0);

  // Top organizadores por reservas
  const { data: orgBookings } = await supabase
    .from('bookings')
    .select('organizer_id, total_price')
    .in('status', ['confirmed', 'completed']);

  const orgSums: Record<string, { bookings: number; revenue: number }> = {};
  for (const b of orgBookings || []) {
    const oid = b.organizer_id;
    if (!oid) continue;
    if (!orgSums[oid]) orgSums[oid] = { bookings: 0, revenue: 0 };
    orgSums[oid].bookings += 1;
    orgSums[oid].revenue += Number(b.total_price || 0);
  }

  const orgIds = Object.keys(orgSums).slice(0, 10);
  const { data: orgs } = orgIds.length > 0
    ? await supabase.from('organizer_profiles').select('id, business_name').in('id', orgIds)
    : { data: [] };

  const orgMap = (orgs || []).reduce((acc: Record<string, string>, o: any) => {
    acc[o.id] = o.business_name || '';
    return acc;
  }, {});

  const topOrganizers = Object.entries(orgSums)
    .map(([id, d]) => ({ name: orgMap[id] || 'Desconocido', ...d }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  const formatEur = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '€';
  const formatPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Reporting</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Métricas globales de la plataforma</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">GMV total (mes)</p>
          <p className="text-2xl font-bold mt-1">{formatEur(gmvThisMonth)}</p>
          <p className={`text-xs font-semibold mt-1 ${gmvChange >= 0 ? 'text-sage-600' : 'text-red-600'}`}>{formatPct(gmvChange)}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Ingresos Retiru</p>
          <p className="text-2xl font-bold mt-1">{formatEur(ingresosThisMonth)}</p>
          <p className={`text-xs font-semibold mt-1 ${ingresosChange >= 0 ? 'text-sage-600' : 'text-red-600'}`}>{formatPct(ingresosChange)}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Nuevos usuarios</p>
          <p className="text-2xl font-bold mt-1">{newUsersCount ?? 0}</p>
          <p className={`text-xs font-semibold mt-1 ${newUsersChange >= 0 ? 'text-sage-600' : 'text-red-600'}`}>{formatPct(newUsersChange)}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Tasa cancelación</p>
          <p className="text-2xl font-bold mt-1">{cancelRate.toFixed(1)}%</p>
          <p className="text-xs text-[#a09383] mt-1">{cancelledB} de {totalB} reservas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Top categorías por reservas</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <p className="text-sm text-[#a09383]">No hay datos de reservas por categoría.</p>
            ) : (
              topCategories.map((c) => {
                const pct = totalCatBookings > 0 ? (c.count / totalCatBookings) * 100 : 0;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{c.name}</span>
                      <span className="text-[#7a6b5d]">{c.count} reservas · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-sand-200 rounded-full">
                      <div className="h-full bg-terracotta-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Top organizadores por reservas</h3>
          <div className="space-y-3">
            {topOrganizers.length === 0 ? (
              <p className="text-sm text-[#a09383]">No hay datos de reservas.</p>
            ) : (
              topOrganizers.map((o, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0 text-sm">
                  <span className="font-medium">{o.name}</span>
                  <div className="flex gap-6 text-[#7a6b5d]">
                    <span>{o.bookings} reservas</span>
                    <span className="font-semibold text-foreground">{formatEur(o.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6">
        <h3 className="font-serif text-lg mb-4">Reservas por mes</h3>
        <div className="h-48 bg-sand-100 rounded-xl flex items-center justify-center text-sm text-[#a09383]">
          Gráfico mensual (requiere Recharts o similar)
        </div>
      </div>
    </div>
  );
}
