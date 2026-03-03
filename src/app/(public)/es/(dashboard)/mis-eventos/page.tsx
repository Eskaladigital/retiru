// /es/mis-eventos — Retiros/eventos del usuario
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado', color: 'bg-sage-100 text-sage-700' },
  draft: { label: 'Borrador', color: 'bg-sand-200 text-[#7a6b5d]' },
  pending_review: { label: 'En revisión', color: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default async function MisEventosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/mis-eventos');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let retreats: any[] = [];
  if (orgProfile) {
    const { data } = await admin
      .from('retreats')
      .select(`
        id, slug, title_es, status, start_date, end_date,
        max_attendees, confirmed_bookings, total_price,
        retreat_images(url, is_cover)
      `)
      .eq('organizer_id', orgProfile.id)
      .order('start_date', { ascending: false });
    retreats = data || [];
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Mis eventos</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">{retreats.length} {retreats.length === 1 ? 'evento' : 'eventos'}</p>
        </div>
        <Link
          href="/es/mis-eventos/nuevo"
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors shrink-0"
        >
          + Nuevo evento
        </Link>
      </div>

      {retreats.length > 0 ? (
        <div className="space-y-3">
          {retreats.map((r: any) => {
            const s = STATUS_MAP[r.status] || STATUS_MAP.draft;
            const cover = r.retreat_images?.find((i: any) => i.is_cover)?.url || r.retreat_images?.[0]?.url;
            const occupancy = r.max_attendees ? Math.round((r.confirmed_bookings / r.max_attendees) * 100) : 0;
            const dateStr = r.start_date
              ? `${new Date(r.start_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}${r.end_date ? ` – ${new Date(r.end_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
              : 'Sin fecha';

            return (
              <div key={r.id} className="flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft transition-all">
                <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0 bg-sand-100">
                  {cover ? (
                    <img src={cover} alt={r.title_es} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-[#a09383]">📅</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-base leading-tight">{r.title_es}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-[#7a6b5d] mb-2">{dateStr} · {r.total_price}€/persona</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[200px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#a09383]">Ocupación</span>
                        <span className="font-semibold">{r.confirmed_bookings || 0}/{r.max_attendees || 0}</span>
                      </div>
                      <div className="h-2 bg-sand-200 rounded-full overflow-hidden">
                        <div className="h-full bg-terracotta-500 rounded-full transition-all" style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/es/mis-eventos/${r.id}`} className="text-xs font-medium text-terracotta-600 hover:underline">Editar</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📅</p>
          <h3 className="font-serif text-xl mb-2">Aún no has creado ningún evento</h3>
          <p className="text-sm text-[#7a6b5d] mb-6 max-w-md mx-auto">
            Crea retiros, talleres, masterclasses o escapadas. Publica tu primer evento y empieza a recibir reservas.
          </p>
          <Link href="/es/mis-eventos/nuevo" className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
            Crear mi primer evento
          </Link>
        </div>
      )}
    </div>
  );
}
