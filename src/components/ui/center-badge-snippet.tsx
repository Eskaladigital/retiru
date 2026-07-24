'use client';

// Insignia «Estamos en Retiru» para la web del centro reclamado.
// El enlace desde la web del centro a su ficha aporta autoridad SEO al
// directorio (y visibilidad al propio centro). Se muestra en /es/mis-centros.
import { useState } from 'react';

const SITE = 'https://www.retiru.com';

export function CenterBadgeSnippet({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<a href="${SITE}/es/centro/${slug}?utm_source=badge" title="${name} en Retiru"><img src="${SITE}/badge-retiru.svg" alt="${name} — centro verificado en el directorio Retiru" width="170" height="48" style="border:0" loading="lazy" /></a>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // El usuario puede seleccionar y copiar manualmente
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-sage-700 hover:underline"
      >
        {open ? '− Ocultar insignia para tu web' : '+ Insignia «Estamos en Retiru» para tu web'}
      </button>
      {open && (
        <div className="mt-3 bg-sand-50 border border-sand-200 rounded-xl p-4">
          <p className="text-xs text-[#7a6b5d] mb-3 leading-relaxed">
            Pega este código en tu página web para mostrar la insignia enlazada a tu ficha.
            Ayuda a tus visitantes a encontrar tus reseñas y horarios, y mejora la visibilidad
            de tu centro en Google.
          </p>
          <div className="flex items-center gap-4 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badge-retiru.svg" alt="Estamos en Retiru" width={170} height={48} />
          </div>
          <textarea
            readOnly
            value={snippet}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full text-[11px] font-mono bg-white border border-sand-200 rounded-lg p-2.5 text-[#7a6b5d] resize-none"
          />
          <button
            type="button"
            onClick={copy}
            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors"
          >
            {copied ? '✓ Copiado' : 'Copiar código'}
          </button>
        </div>
      )}
    </div>
  );
}
