// /es/mis-centros — Centros reclamados y propuestas del usuario
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCenterTypeLabel } from '@/lib/utils';
import { MisCentrosActions } from './MisCentrosActions';

/** Supabase a veces tipa la FK embebida como array; normalizamos a un solo objeto. */
function joinedCenter(centers: unknown): { name?: string; slug?: string } | null {
  if (!centers) return null;
  if (Array.isArray(centers)) return (centers[0] as { name?: string; slug?: string }) ?? null;
  return centers as { name?: string; slug?: string };
}

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

  const { data: pendingProposals } = await supabase
    .from('centers')
    .select('id, name, slug, city, province, type, created_at')
    .eq('submitted_by', user.id)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  const proposals = pendingProposals || [];

  const { data: pendingClaims } = await supabase
    .from('center_claims')
    .select('id, center_id, status, created_at, reviewed_at, centers!center_id(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  const { data: rejectedClaims } = await supabase
    .from('center_claims')
    .select('id, center_id, status, created_at, reviewed_at, admin_notes, centers!center_id(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'rejected')
    .order('reviewed_at', { ascending: false });

  const pending = pendingClaims || [];
  const rejectedList = rejectedClaims || [];
  const pendingTotal = pending.length + proposals.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Mis centros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} {list.length === 1 ? 'centro en tu cuenta' : 'centros en tu cuenta'}
            {pendingTotal > 0 && (
              <span className="ml-1 text-amber-600">
                · {pendingTotal} {pendingTotal === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
              </span>
            )}
          </p>
        </div>
        <MisCentrosActions />
      </div>

      {proposals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Propuestas de centro (revisión admin)</h2>
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-amber-700">
                    Enviada el {new Date(p.created_at).toLocaleDateString('es')}
                    {(p.city || p.province) && ` · ${[p.city, p.province].filter(Boolean).join(', ')}`}
                  </p>
                  <p className="text-xs text-[#7a6b5d] mt-1">
                    No es público hasta que un administrador lo apruebe. Entonces podrás gestionarlo aquí.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">En revisión</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectedList.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#7a6b5d] mb-3">Solicitudes de reclamación no aprobadas</h2>
          <p className="text-xs text-[#a09383] mb-3 max-w-xl">
            Si un administrador no aprobó una solicitud anterior, puedes volver a enviarla desde la ficha pública del centro con «Reclamar este centro». Las solicitudes nuevas por email distinto al de la ficha quedan en revisión manual; no se rechazan solas por eso.
          </p>
          <div className="space-y-2">
            {rejectedList.map((c) => {
              const center = joinedCenter(c.centers);
              return (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-sand-50 border border-sand-200 rounded-xl px-4 py-3">
                <div>
                  {center?.slug ? (
                    <Link href={`/es/centro/${center.slug}`} className="text-sm font-medium text-foreground hover:text-terracotta-600">
                      {center?.name || 'Centro'}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{center?.name || 'Centro'}</span>
                  )}
                  <p className="text-xs text-[#7a6b5d]">
                    Revisada el {c.reviewed_at ? new Date(c.reviewed_at).toLocaleDateString('es') : '—'}
                    {c.admin_notes ? ` · ${c.admin_notes}` : ''}
                  </p>
                </div>
                {center?.slug && (
                  <Link
                    href={`/es/centro/${center.slug}`}
                    className="text-xs font-semibold text-terracotta-600 hover:underline shrink-0"
                  >
                    Volver a solicitar
                  </Link>
                )}
              </div>
            );
            })}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-amber-700 mb-3">Reclamos pendientes</h2>
          <div className="space-y-2">
            {pending.map((c) => {
              const center = joinedCenter(c.centers);
              return (
              <div key={c.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div>
                  {center?.slug ? (
                    <Link href={`/es/centro/${center.slug}`} className="text-sm font-medium text-foreground hover:text-terracotta-600">
                      {center.name || 'Centro'}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{center?.name || 'Centro'}</span>
                  )}
                  <p className="text-xs text-amber-600">Pendiente de aprobación · {new Date(c.created_at).toLocaleDateString('es')}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Pendiente</span>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((c) => {
            const img = c.cover_url || (Array.isArray(c.images) ? c.images[0] : null);
            return (
              <div
                key={c.id}
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
                    {c.type && <span className="text-xs px-2 py-0.5 rounded-full bg-sand-100">{getCenterTypeLabel(c.type)}</span>}
                    {(c.city || c.province) && <span>{c.city}{c.province ? `, ${c.province}` : ''}</span>}
                    {c.avg_rating != null && (
                      <span className="flex items-center gap-1">
                        <span className="text-amber-400">★</span>
                        <span className="font-semibold text-foreground">{c.avg_rating}</span>
                        <span>({c.review_count ?? 0})</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Link href={`/es/mis-centros/${c.id}`} className="text-xs font-semibold text-terracotta-600 hover:underline">Editar perfil</Link>
                    <Link href={`/es/centro/${c.slug}`} className="text-xs font-medium text-[#7a6b5d] hover:text-foreground">Ver ficha pública</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : pendingTotal === 0 && rejectedList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏢</p>
          <h3 className="font-serif text-xl mb-2">Aún no tienes centros en tu cuenta</h3>
          <p className="text-sm text-[#7a6b5d] mb-6 max-w-md mx-auto">
            Puedes <strong className="font-semibold text-foreground">proponer uno nuevo</strong> (lo revisamos antes de publicarlo) o <strong className="font-semibold text-foreground">buscar y reclamar</strong> un centro que ya esté en el directorio.
          </p>
        </div>
      ) : null}
    </div>
  );
}
