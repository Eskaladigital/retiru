// Contenido de la ficha de retiro — reutilizable en página pública y preview admin
import Link from 'next/link';
import { Star, MapPin, Calendar, Clock, Users, Globe, Shield, Zap, ChevronRight, Check, X as XIcon } from 'lucide-react';
import AskOrganizerButton from '@/components/messaging/AskOrganizerButton';
import type { Retreat } from '@/types';

const dateFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80';

function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

function durationLabel(days: number) {
  if (days <= 1) return '1 día';
  return `${days} días · ${days - 1} noches`;
}

interface Props {
  retreat: Retreat;
  isPreview?: boolean;
}

export function RetiroDetailContent({ retreat, isPreview }: Props) {
  const r = retreat;
  const sortedImages = [...(r.images ?? [])].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });
  const hasImages = sortedImages.length > 0;
  const location = r.destination
    ? `${r.destination.name_es}${r.destination.region ? `, ${r.destination.region}` : ''}`
    : r.address ?? '';

  return (
    <div>
      {isPreview && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-amber-800">
            Vista previa — Este retiro está pendiente de aprobación. Así es como lo verán los usuarios cuando lo publiques.
          </p>
          <Link
            href="/administrator/retiros"
            className="shrink-0 text-sm font-semibold text-terracotta-600 hover:underline"
          >
            ← Volver a retiros
          </Link>
        </div>
      )}

      {/* Image Gallery */}
      <section className="bg-sand-100 rounded-2xl overflow-hidden mb-6">
        <div className="p-4">
          {hasImages ? (
            sortedImages.length >= 3 ? (
              <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2 rounded-xl overflow-hidden" style={{ maxHeight: '400px' }}>
                <div className="md:col-span-2 md:row-span-2 relative">
                  <img src={sortedImages[0].url} alt={sortedImages[0].alt_text ?? r.title_es} className="h-full w-full object-cover" style={{ minHeight: '250px' }} />
                </div>
                {sortedImages.slice(1, 5).map((img, i) => (
                  <div key={img.id ?? i} className="hidden md:block relative">
                    <img src={img.url} alt={img.alt_text ?? ''} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ maxHeight: '360px' }}>
                <img src={sortedImages[0].url} alt={sortedImages[0].alt_text ?? r.title_es} className="w-full h-full object-cover" style={{ minHeight: '240px', maxHeight: '360px' }} />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center rounded-xl bg-sand-200 text-muted-foreground" style={{ height: '280px' }}>
              <span className="text-sm">Sin imágenes disponibles</span>
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-10">
        <div className="flex-1 max-w-3xl">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
            <Link href={isPreview ? '/administrator/retiros' : '/es'} className="hover:text-terracotta-600">
              {isPreview ? 'Admin Retiros' : 'Inicio'}
            </Link>
            <ChevronRight size={12} />
            <Link href={isPreview ? '/administrator/retiros' : '/es/retiros-retiru'} className="hover:text-terracotta-600">Retiros</Link>
            <ChevronRight size={12} />
            <span className="text-foreground">{r.title_es}</span>
          </nav>

          <div className="mb-6">
            <div className="mb-2 flex flex-wrap gap-2">
              {r.categories?.map((cat) => (
                <span key={cat.id} className="badge-sand">{cat.name_es}</span>
              ))}
              {r.confirmation_type === 'automatic' && <span className="badge-sage"><Zap size={12} /> Confirmación inmediata</span>}
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">{r.title_es}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {location && <span className="flex items-center gap-1"><MapPin size={15} /> {location}</span>}
              <span className="flex items-center gap-1"><Calendar size={15} /> {formatDate(r.start_date)} — {formatDate(r.end_date)}</span>
              <span className="flex items-center gap-1"><Clock size={15} /> {durationLabel(r.duration_days)}</span>
              {r.review_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={15} className="fill-terracotta-500 text-terracotta-500" />
                  <strong className="text-foreground">{r.avg_rating.toFixed(1)}</strong> ({r.review_count} reseñas)
                </span>
              )}
            </div>
          </div>

          <section className="mb-10">
            <h2 className="mb-4 font-serif text-2xl font-semibold">Sobre este retiro</h2>
            <div className="prose prose-sand text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
              {r.description_es}
            </div>
          </section>

          <section className="mb-10 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold">Qué incluye</h3>
              <ul className="space-y-2">
                {(r.includes_es ?? []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="mt-0.5 shrink-0 text-sage-600" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold">Qué no incluye</h3>
              <ul className="space-y-2">
                {(r.excludes_es ?? []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XIcon size={16} className="mt-0.5 shrink-0 text-sand-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {r.schedule?.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Programa</h2>
              <div className="space-y-4">
                {r.schedule.map((day) => (
                  <div key={day.day} className="rounded-xl border border-sand-200 p-5">
                    <h4 className="mb-2 font-semibold text-foreground">Día {day.day}: {day.title_es}</h4>
                    <ul className="space-y-1">
                      {day.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{item.time} {item.title_es}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {r.organizer && (
            <section className="mb-10 rounded-2xl border border-sand-200 p-6">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Organizador</h2>
              <div className="flex items-center gap-4">
                {r.organizer.logo_url ? (
                  <img src={r.organizer.logo_url} alt={r.organizer.business_name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-xl font-bold text-sage-700">
                    {r.organizer.business_name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{r.organizer.business_name}</h3>
                    {r.organizer.status === 'verified' && <Shield size={16} className="text-sage-600" />}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {r.organizer.review_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={13} className="fill-terracotta-500 text-terracotta-500" /> {r.organizer.avg_rating.toFixed(1)} ({r.organizer.review_count} reseñas)
                      </span>
                    )}
                    <span>{r.organizer.total_retreats} retiros</span>
                  </div>
                </div>
              </div>
              <Link href={`/es/organizador/${r.organizer.slug}`} className="btn-outline mt-4 text-sm inline-block">
                Ver perfil completo
              </Link>
            </section>
          )}

          {r.cancellation_policy?.refund_tiers?.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Política de cancelación</h2>
              <div className="rounded-xl bg-cream-100 p-5">
                <p className="mb-3 text-sm font-medium text-foreground">Cancelación {r.cancellation_policy.type}</p>
                <ul className="space-y-2">
                  {r.cancellation_policy.refund_tiers.map((tier, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`h-2 w-2 rounded-full ${tier.refund_percent === 100 ? 'bg-sage-500' : tier.refund_percent > 0 ? 'bg-yellow-500' : 'bg-red-400'}`} />
                      Más de {tier.days_before} días antes: reembolso del {tier.refund_percent}%
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        <aside className="hidden w-96 shrink-0 lg:block">
          <div className="sticky top-24">
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-elevated">
              <div className="mb-4 text-center">
                <span className="text-sm text-muted-foreground">Precio total</span>
                <p className="text-3xl font-bold text-foreground">{r.total_price}€ <span className="text-base font-normal text-muted-foreground">/ persona</span></p>
              </div>
              <div className="mb-6 rounded-xl bg-cream-100 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cuota Retiru (20%)</span>
                  <span className="font-semibold text-terracotta-600">{r.platform_fee}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Al organizador (80%)</span>
                  <span className="font-semibold">{r.organizer_amount}€</span>
                </div>
              </div>
              <div className="mb-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={16} /> {formatDate(r.start_date)} — {formatDate(r.end_date)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} /> {durationLabel(r.duration_days)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users size={16} /> {r.available_spots} plazas disponibles
                </div>
                {r.languages?.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe size={16} /> {r.languages.join(', ')}
                  </div>
                )}
              </div>
              {isPreview ? (
                <p className="text-sm text-amber-700 font-medium text-center py-3 bg-amber-50 rounded-xl">
                  Vista previa — Reservas deshabilitadas
                </p>
              ) : (
                <>
                  <button className="btn-primary w-full py-4 text-base" disabled={r.available_spots === 0}>
                    {r.available_spots === 0 ? 'Agotado' : `Reservar plaza · ${r.platform_fee}€`}
                  </button>
                  <div className="mt-4">
                    <AskOrganizerButton retreatId={r.id} locale="es" />
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
