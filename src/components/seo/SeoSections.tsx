// src/components/seo/SeoSections.tsx
//
// Renderer de los bloques editoriales enriquecidos generados por
// scripts/generate-seo-sections.mjs (§8 docs/SEO-LANDINGS.md).
//
// Recibe un array de {key, heading, html} y los pinta como <section>
// con card + icono a la izquierda, para que el contenido SEO tenga
// personalidad visual (no ser un párrafo plano).
//
// El HTML interno viene saneado por el prompt (solo p, strong, em, ul, ol, li).
import {
  MapPin,
  Compass,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react';
import type { SeoSection } from '@/lib/data';

interface Props {
  sections: SeoSection[];
  className?: string;
}

interface VisualStyle {
  Icon: LucideIcon;
  accent: string; // borde lateral + color icono
  bg: string;     // fondo card
}

const STYLES: Record<string, VisualStyle> = {
  why_here:                 { Icon: MapPin,     accent: 'border-terracotta-400 text-terracotta-600', bg: 'bg-terracotta-50/40' },
  why_here_for_style:       { Icon: MapPin,     accent: 'border-terracotta-400 text-terracotta-600', bg: 'bg-terracotta-50/40' },
  what_to_expect:           { Icon: Compass,    accent: 'border-sage-500 text-sage-700',             bg: 'bg-sage-50/60' },
  how_to_choose:            { Icon: CheckSquare,accent: 'border-amber-500 text-amber-700',           bg: 'bg-amber-50/50' },
  how_to_choose_style_local:{ Icon: CheckSquare,accent: 'border-amber-500 text-amber-700',           bg: 'bg-amber-50/50' },
  history:                  { Icon: BookOpen,   accent: 'border-sand-400 text-[#7a6b5d]',            bg: 'bg-sand-50/80' },
};

const DEFAULT_STYLE: VisualStyle = {
  Icon: Sparkles,
  accent: 'border-terracotta-400 text-terracotta-600',
  bg: 'bg-sand-50/80',
};

export default function SeoSections({ sections, className = '' }: Props) {
  if (!sections || sections.length === 0) return null;
  return (
    <div className={`space-y-6 max-w-4xl ${className}`}>
      {sections.map((s, idx) => {
        const v = STYLES[s.key] || DEFAULT_STYLE;
        const { Icon } = v;
        return (
          <section
            key={s.key || `sec-${idx}`}
            data-seo-section={s.key}
            className={`group rounded-2xl border border-sand-200 ${v.bg} p-6 md:p-7 border-l-4 ${v.accent.split(' ')[0]}`}
          >
            <div className="flex items-start gap-4">
              <div className={`shrink-0 w-10 h-10 rounded-xl bg-white border border-sand-200 flex items-center justify-center ${v.accent.split(' ').slice(1).join(' ')}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-[22px] md:text-[26px] text-foreground mb-3 leading-tight">
                  {s.heading}
                </h2>
                <div
                  className="prose prose-sand max-w-none text-[#44362b] leading-relaxed prose-p:mb-3 prose-ul:my-3 prose-li:my-1 prose-strong:text-foreground"
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Componente auxiliar: bloque FAQ reutilizable con el mismo lenguaje visual.
interface FaqItem { question: string; answer: string }
interface FaqProps {
  items: FaqItem[];
  heading?: string;
  className?: string;
}

export function SeoFaqSection({ items, heading, className = '' }: FaqProps) {
  if (!items || items.length === 0) return null;
  return (
    <section className={`max-w-4xl ${className}`}>
      {heading && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-terracotta-600">
            <HelpCircle size={20} />
          </div>
          <h2 className="font-serif text-[22px] md:text-[28px] text-foreground leading-tight">
            {heading}
          </h2>
        </div>
      )}
      <div className="space-y-3">
        {items.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl bg-white border border-sand-200 hover:border-sand-300 transition-colors overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer font-medium text-foreground list-none [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{item.question}</span>
              <span className="shrink-0 w-8 h-8 rounded-full bg-sand-50 border border-sand-200 flex items-center justify-center text-[#7a6b5d] group-open:bg-terracotta-50 group-open:border-terracotta-200 group-open:text-terracotta-600 transition-colors">
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </summary>
            <div className="px-5 pb-5 pt-1 text-[15px] text-[#44362b] leading-relaxed border-t border-sand-100">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
