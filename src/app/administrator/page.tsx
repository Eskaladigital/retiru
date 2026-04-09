// /administrator — Dashboard admin (datos en vivo desde Supabase)
import Link from 'next/link';
import { unstable_noStore } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type PendingOrgRow = { id: string; business_name: string | null; created_at: string };
type PendingRetreatRow = {
  id: string;
  title_es: string;
  slug: string;
  created_at: string;
  organizer_id: string;
};
type PendingRetreatEnriched = PendingRetreatRow & { organizer_name: string };

function formatRelativeEs(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'Hace un momento';
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? 'Hace 1 min' : `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'Hace 1 h' : `Hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatEuro(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  }).format(rounded);
}

export default async function AdminDashboardPage() {
  unstable_noStore();
  const supabase = createAdminSupabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    verifiedRes,
    publishedRes,
    bookingsMonthRes,
    feesPaidAtRes,
    feesPaidLegacyRes,
    pendingOrgsRes,
    pendingRetreatsRes,
  ] = await Promise.all([
    supabase.from('organizer_profiles').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
    supabase.from('retreats').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase
      .from('bookings')
      .select('platform_fee')
      .eq('platform_payment_status', 'paid')
      .gte('platform_paid_at', monthStart),
    supabase
      .from('bookings')
      .select('platform_fee')
      .eq('platform_payment_status', 'paid')
      .is('platform_paid_at', null)
      .gte('created_at', monthStart),
    supabase
      .from('organizer_profiles')
      .select('id, business_name, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('retreats')
      .select('id, title_es, slug, created_at, organizer_id')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  for (const res of [verifiedRes, publishedRes, bookingsMonthRes, feesPaidAtRes, feesPaidLegacyRes, pendingOrgsRes, pendingRetreatsRes]) {
    if (res.error) console.error('[admin dashboard]', res.error);
  }

  const verifiedCount = verifiedRes.count ?? 0;
  const publishedCount = publishedRes.count ?? 0;
  const bookingsMonthCount = bookingsMonthRes.count ?? 0;
  const sumFees = (rows: { platform_fee: string | number }[] | null) =>
    (rows || []).reduce((s, r) => s + Number(r.platform_fee), 0);
  const revenueMonth = sumFees(feesPaidAtRes.data) + sumFees(feesPaidLegacyRes.data);

  const pendingOrgs = (pendingOrgsRes.data || []) as PendingOrgRow[];
  const pendingRetreatsRaw = (pendingRetreatsRes.data || []) as PendingRetreatRow[];

  const orgIds = [...new Set(pendingRetreatsRaw.map((r: PendingRetreatRow) => r.organizer_id).filter(Boolean))] as string[];
  let orgNameById: Record<string, string> = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from('organizer_profiles').select('id, business_name').in('id', orgIds);
    for (const o of orgs || []) {
      orgNameById[o.id] = o.business_name || '—';
    }
  }

  const pendingRetreats: PendingRetreatEnriched[] = pendingRetreatsRaw.map((r: PendingRetreatRow) => ({
    ...r,
    organizer_name: orgNameById[r.organizer_id] || '—',
  }));

  const kpiCards = [
    { label: 'Organizadores activos', value: String(verifiedCount), icon: '👥' },
    { label: 'Retiros publicados', value: String(publishedCount), icon: '📅' },
    { label: 'Reservas este mes', value: String(bookingsMonthCount), icon: '📋' },
    { label: 'Ingresos Retiru (mes)', value: formatEuro(revenueMonth), icon: '💰' },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Panel de administración</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Resumen general de la plataforma (datos en vivo)</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-white border border-sand-200 rounded-2xl p-5">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-2xl font-bold mt-2">{k.value}</p>
            <p className="text-xs text-[#a09383] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-serif text-lg">Organizadores pendientes de verificación</h2>
            <Link href="/administrator/organizadores" className="text-xs text-sage-600 font-semibold hover:underline shrink-0">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {pendingOrgs.length === 0 ? (
              <p className="text-sm text-[#a09383] py-2">No hay organizadores pendientes.</p>
            ) : (
              pendingOrgs.map((o: PendingOrgRow) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0 gap-2"
                >
                  <span className="text-sm font-medium min-w-0 truncate">{o.business_name || 'Sin nombre'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#a09383] whitespace-nowrap">{formatRelativeEs(o.created_at)}</span>
                    <Link
                      href={`/administrator/organizadores#org-${o.id}`}
                      className="text-xs text-sage-600 font-semibold hover:underline"
                    >
                      Revisar
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-serif text-lg">Retiros pendientes de revisión</h2>
            <Link
              href="/administrator/retiros?filter=pending_review"
              className="text-xs text-sage-600 font-semibold hover:underline shrink-0"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRetreats.length === 0 ? (
              <p className="text-sm text-[#a09383] py-2">No hay retiros pendientes de revisión.</p>
            ) : (
              pendingRetreats.map((e: PendingRetreatEnriched) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0 gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium line-clamp-2">{e.title_es}</span>
                    <br />
                    <span className="text-xs text-[#a09383] truncate block">{e.organizer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#a09383] whitespace-nowrap">{formatRelativeEs(e.created_at)}</span>
                    <Link
                      href={`/administrator/retiros?filter=pending_review#retreat-${e.id}`}
                      className="text-xs text-sage-600 font-semibold hover:underline"
                    >
                      Revisar
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
