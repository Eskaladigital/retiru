import Link from 'next/link';

type SeriesDate = { slug: string; start_date: string };

function formatChip(iso: string, locale: 'es' | 'en') {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${iso}T12:00:00`));
}

export function SeriesDateChips({
  dates,
  currentSlug,
  locale,
}: {
  dates: SeriesDate[];
  currentSlug: string;
  locale: 'es' | 'en';
}) {
  if (!dates.length) return null;
  const prefix = locale === 'es' ? '/es/retiro' : '/en/retreat';
  const label = locale === 'es' ? 'Clase diaria · elige día' : 'Daily class · pick a day';
  return (
    <div className="mb-4">
      {dates.length > 1 && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7a6b5d]">{label}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {dates.map((d) =>
          d.slug === currentSlug ? (
            <span key={d.slug} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-terracotta-600 text-white">
              {formatChip(d.start_date, locale)}
            </span>
          ) : (
            <Link
              key={d.slug}
              href={`${prefix}/${d.slug}`}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand-100 text-foreground hover:bg-sand-200 transition-colors"
            >
              {formatChip(d.start_date, locale)}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
