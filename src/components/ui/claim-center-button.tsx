'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClaimCenterButtonProps {
  centerId: string;
  centerSlug: string;
  claimedBy: string | null;
  locale: 'es' | 'en';
}

export function ClaimCenterButton({ centerId, centerSlug, claimedBy, locale }: ClaimCenterButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  if (claimedBy) return null;

  const t = locale === 'es' ? {
    heading: '¿Es tu centro?',
    description: 'Reclámalo y gestiona tu perfil, responde a reseñas y publica eventos.',
    button: 'Reclamar este centro',
    sending: 'Enviando...',
  } : {
    heading: 'Is this your center?',
    description: 'Claim it to manage your profile, respond to reviews and publish events.',
    button: 'Claim this center',
    sending: 'Sending...',
  };

  async function handleClaim() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/centers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        const loginPath = locale === 'es' ? '/es/login' : '/en/login';
        const centerPath = locale === 'es' ? `/es/centro/${centerSlug}` : `/en/center/${centerSlug}`;
        router.push(`${loginPath}?redirect=${encodeURIComponent(centerPath)}&claim=true`);
        return;
      }

      if (!res.ok) {
        setResult({ success: false, message: data.error });
        return;
      }

      setResult({ success: true, message: data.message });
    } catch {
      setResult({
        success: false,
        message: locale === 'es' ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 border border-dashed border-terracotta-300 bg-terracotta-50/40 rounded-2xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <svg className="w-5 h-5 text-terracotta-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        <h3 className="font-serif text-lg text-foreground">{t.heading}</h3>
      </div>
      <p className="text-sm text-[#7a6b5d] mb-4 max-w-md mx-auto">{t.description}</p>

      {result ? (
        <div className={`text-sm px-4 py-2.5 rounded-xl inline-block ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.message}
        </div>
      ) : (
        <button
          onClick={handleClaim}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-wait"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" /></svg>
              {t.sending}
            </>
          ) : (
            t.button
          )}
        </button>
      )}
    </div>
  );
}
