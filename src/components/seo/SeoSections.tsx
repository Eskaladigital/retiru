// src/components/seo/SeoSections.tsx
//
// Renderer de los bloques editoriales enriquecidos generados por
// scripts/generate-seo-sections.mjs (§8 docs/SEO-LANDINGS.md).
//
// Recibe un array de {key, heading, html} y lo pinta como <section> con
// <h2> y contenido HTML (el HTML viene saneado por el prompt: solo p, strong,
// em, ul, ol, li). Si el array está vacío, no renderiza nada.
import type { SeoSection } from '@/lib/data';

interface Props {
  sections: SeoSection[];
  className?: string;
}

export default function SeoSections({ sections, className = '' }: Props) {
  if (!sections || sections.length === 0) return null;
  return (
    <div className={`max-w-3xl space-y-10 ${className}`}>
      {sections.map((s, idx) => (
        <section key={s.key || `sec-${idx}`} data-seo-section={s.key}>
          <h2 className="font-serif text-2xl md:text-[28px] text-foreground mb-4">
            {s.heading}
          </h2>
          <div
            className="prose prose-sand max-w-none text-[#44362b] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: s.html }}
          />
        </section>
      ))}
    </div>
  );
}
