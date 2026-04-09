import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Users, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice, formatDateRange, getOrganizerReviewStats, organizerHasRatingToShow } from "@/lib/utils";
import type { Retreat, Locale } from "@/types";
import { getLocalized as localized } from "@/i18n";

interface EventCardProps {
  event: Retreat;
  locale: Locale;
}

export function EventCard({ event, locale }: EventCardProps) {
  const title = localized(event, "title", locale);
  const summary = localized(event, "summary", locale);
  const coverImage = event.images?.find((i) => i.is_cover)?.url || event.images?.[0]?.url;
  const destinationName = event.destination ? localized(event.destination, "name", locale) : null;

  const href = locale === "es" ? `/es/retiro/${event.slug}` : `/en/retreat/${event.slug}`;
  const { avg_rating: orgAvg, review_count: orgReviews } = getOrganizerReviewStats(event);
  const showOrgRating = organizerHasRatingToShow(event);

  return (
    <Card hover className="group">
      <Link href={href}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-terracotta-100 to-sage-100 flex items-center justify-center">
              <span className="font-serif text-3xl text-terracotta-300">retiru</span>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {event.confirmation_type === "automatic" && (
              <Badge variant="success" className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-sage-700">
                <Zap className="h-3 w-3" />
                {locale === "es" ? "Confirmación inmediata" : "Instant"}
              </Badge>
            )}
          </div>

          {/* Price tag */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-sand-500">{locale === "es" ? "Desde" : "From"}</span>
            <span className="block font-semibold text-sand-900">{formatPrice(event.total_price)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Categories */}
          {event.categories && event.categories.length > 0 && (
            <div className="flex gap-1.5 mb-2">
              {event.categories.slice(0, 2).map((cat) => (
                <span key={cat.id} className="text-xs text-terracotta-600 font-medium">
                  {localized(cat, "name", locale)}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-serif text-lg font-semibold text-sand-900 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
            {title}
          </h3>

          {summary && (
            <p className="mt-1.5 text-sm text-sand-500 line-clamp-2">{summary}</p>
          )}

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sand-500">
            {destinationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {destinationName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDateRange(event.start_date, event.end_date, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {event.available_spots} {locale === "es" ? "plazas" : "spots"}
            </span>
            {showOrgRating && (
              <span className="flex items-center gap-1 text-terracotta-600" title={locale === "es" ? "Valoración del organizador" : "Organizer rating"}>
                <Star className="h-3.5 w-3.5 fill-current" /> {orgAvg.toFixed(1)} ({orgReviews})
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
