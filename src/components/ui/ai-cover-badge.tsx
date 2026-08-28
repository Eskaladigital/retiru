import { isCenterCoverIA } from '@/lib/utils';

type Size = 'full' | 'card' | 'thumb';

const COPY = {
  es: {
    full: 'Imagen generada por inteligencia artificial',
    card: 'Imagen IA',
    thumb: 'IA',
    tip: 'Esta foto se generó con inteligencia artificial al no disponer de una imagen original del centro. Si eres el titular o tienes una foto real, la sustituimos encantados.',
  },
  en: {
    full: 'AI-generated image',
    card: 'AI image',
    thumb: 'AI',
    tip: 'This photo was generated with artificial intelligence because we did not have an original image of the center. If you are the owner or have a real photo, we will gladly replace it.',
  },
} as const;

export function AiCoverBadge({
  url,
  locale = 'es',
  size = 'card',
}: {
  url?: string | null;
  locale?: 'es' | 'en';
  size?: Size;
}) {
  if (!isCenterCoverIA(url)) return null;
  const t = COPY[locale];
  const label = t[size];
  const pad = size === 'full' ? 'px-3 py-1.5 text-xs' : size === 'card' ? 'px-2 py-1 text-[10px]' : 'px-1.5 py-0.5 text-[9px]';
  const pos = size === 'thumb' ? 'bottom-1 left-1' : 'bottom-2.5 left-2.5';

  return (
    <div className={`absolute ${pos} z-20 group/ai`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-[#2c241c]/85 text-white font-semibold shadow-sm backdrop-blur-[2px] ${pad}`}
        tabIndex={0}
        aria-label={t.full}
      >
        <span aria-hidden>✦</span>
        {label}
      </span>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg bg-white text-[#3d342c] text-xs leading-relaxed p-3 shadow-lg opacity-0 invisible group-hover/ai:opacity-100 group-hover/ai:visible group-focus-within/ai:opacity-100 group-focus-within/ai:visible transition-opacity"
      >
        {t.tip}
      </div>
    </div>
  );
}
