'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface FormField {
  id: string;
  label_es: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number';
  required: boolean;
  options?: string[];
  placeholder_es?: string;
}

export default function FormularioPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [retreatTitle, setRetreatTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/form`)
      .then((r) => r.json())
      .then((data) => {
        setFields(data.formFields || []);
        setResponses(data.responses || {});
        setRetreatTitle(data.retreatTitle || 'Retiro');
      })
      .catch(() => setError('Error cargando el formulario'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  function updateResponse(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit() {
    const missing = fields.filter((f) => f.required && !responses[f.id]);
    if (missing.length > 0) {
      setError(`Completa los campos obligatorios: ${missing.map((f) => f.label_es).join(', ')}`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/bookings/${bookingId}/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
        return;
      }

      setSaved(true);
      setTimeout(() => router.push(`/es/mis-reservas/${bookingId}`), 2000);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-[#7a6b5d]">Cargando formulario...</div>;

  if (fields.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-[#7a6b5d] mb-4">Este retiro no requiere formulario de inscripción</p>
        <Link href={`/es/mis-reservas/${bookingId}`} className="text-sm text-terracotta-600 font-medium hover:underline">
          Volver a mi reserva
        </Link>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 mx-auto mb-4">
          <Check size={32} className="text-sage-600" />
        </div>
        <h2 className="font-serif text-2xl mb-2">¡Formulario enviado!</h2>
        <p className="text-sm text-[#7a6b5d]">El organizador recibirá tus datos. Redirigiendo...</p>
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all';

  return (
    <div className="max-w-2xl">
      <Link href={`/es/mis-reservas/${bookingId}`} className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium mb-6">
        ← Volver a mi reserva
      </Link>

      <h1 className="font-serif text-2xl text-foreground mb-2">Formulario de inscripción</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{retreatTitle} — Completa estos datos para que el organizador pueda preparar tu experiencia</p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {field.label_es} {field.required && '*'}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                value={(responses[field.id] as string) || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
                placeholder={field.placeholder_es}
                className={inputCls}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                rows={3}
                value={(responses[field.id] as string) || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
                placeholder={field.placeholder_es}
                className={`${inputCls} resize-none`}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={(responses[field.id] as string) || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
                className={inputCls}
              />
            )}

            {field.type === 'select' && field.options && (
              <select
                value={(responses[field.id] as string) || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
                className={inputCls}
              >
                <option value="">Selecciona una opción</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'radio' && field.options && (
              <div className="flex flex-wrap gap-3">
                {field.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={field.id}
                      value={opt}
                      checked={responses[field.id] === opt}
                      onChange={() => updateResponse(field.id, opt)}
                      className="text-terracotta-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(responses[field.id])}
                  onChange={(e) => updateResponse(field.id, e.target.checked)}
                  className="text-terracotta-600"
                />
                Sí
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="pt-8">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {saving ? 'Guardando...' : 'Enviar formulario'}
        </button>
      </div>
    </div>
  );
}
