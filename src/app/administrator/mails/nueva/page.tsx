'use client';
// /administrator/mails/nueva — Crear campaña (draft) y redirigir al detalle.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default function NuevaCampanaPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalSlug = touchedSlug ? slug : slugify(subject);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/mailing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          slug: finalSlug,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo crear la campaña');
        setSubmitting(false);
        return;
      }
      router.push(`/administrator/mails/${data.campaign.slug}`);
    } catch (err) {
      setError((err as Error).message || 'Error inesperado');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl pt-2">
      <div className="mb-6">
        <Link href="/administrator/mails" className="text-sm text-sage-700 hover:underline">
          ← Volver al listado
        </Link>
      </div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Nueva campaña</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        Crea la campaña en borrador. En el siguiente paso la IA generará el HTML basándose en un diseño anterior y tu briefing.
      </p>

      <form onSubmit={onSubmit} className="bg-white border border-sand-200 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="subject">
            Asunto del email <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ej: ¿Aún no has reclamado tu centro en Retiru?"
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            required
            maxLength={200}
          />
          <p className="text-xs text-[#a09383] mt-1">
            Lo que verá el destinatario en la bandeja. La IA lo respetará tal cual.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="slug">
            Slug interno
          </label>
          <input
            id="slug"
            type="text"
            value={finalSlug}
            onChange={(e) => { setTouchedSlug(true); setSlug(slugify(e.target.value)); }}
            placeholder="se-genera-automaticamente"
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sage-400"
            maxLength={80}
          />
          <p className="text-xs text-[#a09383] mt-1">
            Identificador interno (URL y exportaciones). Se genera desde el asunto; puedes sobrescribirlo.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="description">
            Descripción interna
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para qué es esta campaña, a quién va dirigida, objetivo, CTA principal…"
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 min-h-[100px]"
            maxLength={1000}
          />
          <p className="text-xs text-[#a09383] mt-1">
            No sale en el mail. Sirve para recordar de qué iba cada campaña y se lo pasamos también a la IA como contexto.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !subject.trim()}
            className="rounded-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 transition-colors"
          >
            {submitting ? 'Creando…' : 'Crear campaña'}
          </button>
          <Link
            href="/administrator/mails"
            className="rounded-full bg-white border border-sand-200 hover:bg-cream-50 text-[#7a6b5d] text-sm font-semibold px-6 py-2.5 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
