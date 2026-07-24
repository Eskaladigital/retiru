// Bloque para landings sin retiros futuros: muestra ediciones celebradas + CTA
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, CalendarDays } from 'lucide-react';
import type { Retreat } from '@/types';

type Props = {
  locale: 'es' | 'en';
  pastRetreats: Retreat[];
  heading: string;
  subheading: string;
  ctaHref: string;
  ctaLabel: string;
  organizeHref?: string;
  organizeLabel?: string;
};

export function PastRetreatsFallback({
  locale,
  pastRetreats,
  heading,
  subheading,
  ctaHref,
  ctaLabel,
  organizeHref,
  organizeLabel,
}: Props) {
  const celebrated = locale === 'es' ? 'Celebrado' : 'Held';

  if (pastRetreats.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-xl text-foreground mb-2">{heading}</p>
        <p className="text-sm text-[#7a6b5d] mb-6">{subheading}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={ctaHref} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">
            {ctaLabel}
          </Link>
          {organizeHref && organizeLabel && (
            <Link href={organizeHref} className="text-sm font-semibold text-sage-700 hover:text-sage-800">
              {organizeLabel}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-sand-200 bg-sand-50 px-6 py-5">
        <h2 className="font-serif text-xl text-foreground mb-1">{heading}</h2>
        <p className="text-sm text-[#7a6b5d] mb-4">{subheading}</p>
        <div className="flex flex-wrap gap-4">
          <Link href={ctaHref} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">
            {ctaLabel}
          </Link>
          {organizeHref && organizeLabel && (
            <Link href={organizeHref} className="text-sm font-semibold text-sage-700 hover:text-sage-800">
              {organizeLabel}
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pastRetreats.map((r) => {
          const coverImg = r.images?.find((i) => i.is_cover)?.url || r.images?.[0]?.url || '';
          const title = locale === 'es' ? r.title_es : (r.title_en || r.title_es);
          const destName =
            locale === 'es'
              ? r.destination?.name_es || ''
              : r.destination?.name_en || r.destination?.name_es || '';
          const href = locale === 'es' ? `/es/retiro/${r.slug}` : `/en/retreat/${r.slug}`;
          return (
            <Link
              key={r.id}
              href={href}
              className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
                {coverImg ? (
                  <Image
                    src={coverImg}
                    alt={title}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-[600ms] group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-sand-300">·</div>
                )}
                <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-foreground">
                  {celebrated}
                </span>
              </div>
              <div className="p-5">
                {destName && (
                  <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1 mb-2">
                    <MapPin size={13} /> {destName}
                  </span>
                )}
                <h3 className="font-serif text-lg leading-[1.3] mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
                  {title}
                </h3>
                {r.start_date && (
                  <span className="text-sm text-[#7a6b5d] flex items-center gap-1">
                    <CalendarDays size={14} />
                    {new Date(r.start_date).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
