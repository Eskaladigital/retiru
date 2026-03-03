// /es/mis-centros — Centros reclamados por el usuario
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function MisCentrosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/mis-centros');

  const { data: centers } = await supabase
    .from('centers')
    .select('id, name, slug, city, province, type, cover_url, images, avg_rating, review_count, status')
    .eq('claimed_by', user.id)
    .order('name');

  const list = centers || [];

  const { data: pendingClaims } = await supabase
    .from('center_claims')
    .select('id, center_id, status, created_at, centers!center_id(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  const pending = pendingClaims || [];

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Mis centros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} {list.length === 1 ? 'centro reclamado' : 'centros reclamados'}
            {pending.length > 0 && <span className="ml-1 text-amber-600">· {pending.length} pendientes</span>}
          </p>
        </div>
        <Link
          href="/es/centros-retiru"
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors shrink-0"
        >
          Buscar centros
        </Link>
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-amber-700 mb-3">Solicitudes pendientes</h2>
          <div className="space-y-2">
            {pending.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div>
                  <Link href={`/es/centro/${c.centers?.slug}`} className="text-sm font-medium text-foreground hover:text-terracotta-600">
                    {c.centers?.name || 'Centro'}
                  </Link>
                  <p className="text-xs text-amber-600">Pendiente de aprobación · {new Date(c.created_at).toLocaleDateString('es')}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Pendiente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((c) => {
            const img = c.cover_url || (Array.isArray(c.images) ? c.images[0] : null);
            return (
              <Link
                key={c.id}
                href={`/es/centro/${c.slug}`}
                className="flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all group"
              >
                <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-sand-100">
                  {img ? (
                    <img src={img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-[#a09383]">🏢</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-lg leading-tight">{c.name}</h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${c.status === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-sand-200 text-[#7a6b5d]'}`}>
                      {c.status === 'active' ? 'Activo' : c.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#7a6b5d]">
                    {c.type && <span className="text-xs px-2 py-0.5 rounded-full bg-sand-100">{c.type}</span>}
                    {(c.city || c.province) && <span>{c.city}{c.province ? `, ${c.province}` : ''}</span>}
                    {c.avg_rating != null && (
                      <span className="flex items-center gap-1">
                        <span className="text-amber-400">★</span>
                        <span className="font-semibold text-foreground">{c.avg_rating}</span>
                        <span>({c.review_count ?? 0})</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏢</p>
          <h3 className="font-serif text-xl mb-2">No tienes centros reclamados</h3>
          <p className="text-sm text-[#7a6b5d] mb-6 max-w-md mx-auto">
            Si eres propietario de un centro de yoga, pilates, meditación o wellness, búscalo en nuestro directorio y reclámalo para gestionar tu perfil.
          </p>
          <Link href="/es/centros-retiru" className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
            Buscar centros para reclamar
          </Link>
        </div>
      ) : null}
    </div>
  );
}
