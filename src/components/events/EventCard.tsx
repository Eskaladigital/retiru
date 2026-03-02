// ============================================================================
// RETIRU · Event Card Component
// ============================================================================

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Star, Zap, Users } from 'lucide-react';
import type { Retreat } from '@/types';
import type { Locale } from '@/i18n/config';
import { getLocalized, getDictionary } from '@/i18n';
import { formatPrice, formatDateRange } from '@/lib/utils';

interface EventCardProps {
  event: Retreat;
  locale: Locale;
}

export default function EventCard({ event, locale }: EventCardProps) {
  const t = getDictionary(locale);
  const title = getLocalized(event, 'title', locale);
  const summary = getLocalized(event, 'summary', locale);
  const coverImage = event.images?.find((img) => img.is_cover)?.url
    || event.images?.[0]?.url
    || '/images/placeholder-retreat.jpg';

  const slug = event.slug;
  const link = locale === 'es' ? `/es/retiro/${slug}` : `/en/retreat/${slug}`;
  const nights = event.duration_days - 1;
  const spotsLeft = event.available_spots;
  const isLastSpots = spotsLeft > 0 && spotsLeft <= 3;
  const isSoldOut = spotsLeft <= 0;

  return (
    <Link href={link} className="group">
      <article className="card h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-cover overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badges overlay */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {event.confirmation_type === 'automatic' && (
              <span className="badge bg-white/90 text-sage-700 backdrop-blur-sm">
                <Zap size={12} /> {t.eventCard.instantConfirm}
              </span>
            )}
            {isLastSpots && (
              <span className="badge bg-terracotta-600 text-white">
                {t.eventCard.lastSpots.replace('{n}', String(spotsLeft))}
              </span>
            )}
            {isSoldOut && (
              <span className="badge bg-foreground text-white">
                {t.eventCard.soldOut}
              </span>
            )}
          </div>
          {/* Rating overlay */}
          {event.avg_rating > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
              <Star size={12} className="fill-terracotta-500 text-terracotta-500" />
              {event.avg_rating.toFixed(1)}
              <span className="text-muted-foreground">({event.review_count})</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          {/* Categories */}
          {event.categories && event.categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {event.categories.slice(0, 2).map((cat) => (
                <span key={cat.id} className="badge-sand text-[11px]">
                  {getLocalized(cat, 'name', locale)}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="mb-1 font-serif text-lg font-semibold leading-tight text-foreground group-hover:text-terracotta-600 transition-colors">
            {title}
          </h3>

          {/* Summary */}
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {summary}
          </p>

          {/* Meta */}
          <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {event.destination && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {getLocalized(event.destination, 'name', locale)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {formatDateRange(event.start_date, event.end_date, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {t.eventCard.spotsLeft.replace('{n}', String(spotsLeft))}
            </span>
          </div>

          {/* Price + Duration */}
          <div className="mt-3 flex items-end justify-between border-t border-sand-100 pt-3">
            <div>
              <span className="text-xs text-muted-foreground">{t.eventCard.from}</span>
              <span className="ml-1 text-lg font-bold text-terracotta-600">
                {formatPrice(event.total_price)}
              </span>
              <span className="text-xs text-muted-foreground"> {t.eventCard.perPerson}</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {event.duration_days} {locale === 'es' ? 'días' : 'days'}
              {nights > 0 && ` · ${nights} ${locale === 'es' ? 'noches' : 'nights'}`}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
