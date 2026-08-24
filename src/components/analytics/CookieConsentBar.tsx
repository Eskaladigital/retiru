'use client';

import { useEffect, useState } from 'react';

const KEY = 'retiru_cookie_consent';

function updateConsent(granted: boolean) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  const value = granted ? 'granted' : 'denied';
  (window as any).gtag('consent', 'update', {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export function CookieConsentBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  const save = (granted: boolean) => {
    localStorage.setItem(KEY, granted ? 'granted' : 'denied');
    updateConsent(granted);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-foreground text-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">Usamos cookies de analítica para medir visitas y mejorar Retiru.</p>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => save(false)} className="px-4 py-2 text-sm opacity-80">
            Rechazar
          </button>
          <button type="button" onClick={() => save(true)} className="px-4 py-2 text-sm font-semibold rounded bg-background text-foreground">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
