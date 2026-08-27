'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Cookie, Shield, X } from 'lucide-react';

export const OPEN_COOKIE_SETTINGS = 'openCookieSettings';
const KEY = 'retiru_cookie_consent';
const PREFS_KEY = 'retiru_cookie_preferences';

type Prefs = {
  necessary: true;
  analytics: boolean;
};

const ALL_ON: Prefs = { necessary: true, analytics: true };
const ONLY_NECESSARY: Prefs = { necessary: true, analytics: false };

function updateGtag(prefs: Prefs) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  const v = prefs.analytics ? 'granted' : 'denied';
  (window as any).gtag('consent', 'update', {
    analytics_storage: v,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

function persist(prefs: Prefs) {
  localStorage.setItem(KEY, prefs.analytics ? 'granted' : 'denied');
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  updateGtag(prefs);
}

function readPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return { necessary: true, analytics: Boolean(parsed.analytics) };
    }
    const legacy = localStorage.getItem(KEY);
    if (legacy === 'granted') return ALL_ON;
    if (legacy === 'denied') return ONLY_NECESSARY;
  } catch {
    /* modo privado */
  }
  return null;
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));
}

export function CookieSettingsButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {label ?? 'Configurar cookies'}
    </button>
  );
}

function useLocale(): 'es' | 'en' {
  const [locale, setLocale] = useState<'es' | 'en'>('es');
  useEffect(() => {
    setLocale(document.documentElement.lang === 'en' ? 'en' : 'es');
  }, []);
  return locale;
}

export function CookieConsentBar() {
  const locale = useLocale();
  const es = locale === 'es';
  const [view, setView] = useState<'hidden' | 'banner' | 'settings'>('hidden');
  const [prefs, setPrefs] = useState<Prefs>(ALL_ON);

  useEffect(() => {
    const stored = readPrefs();
    if (stored) {
      setPrefs(stored);
      updateGtag(stored);
    } else {
      setView('banner');
    }
    const open = () => {
      const current = readPrefs();
      if (current) setPrefs(current);
      setView('settings');
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
  }, []);

  const acceptAll = useCallback(() => {
    persist(ALL_ON);
    setPrefs(ALL_ON);
    setView('hidden');
  }, []);

  const rejectAll = useCallback(() => {
    persist(ONLY_NECESSARY);
    setPrefs(ONLY_NECESSARY);
    setView('hidden');
  }, []);

  const save = useCallback(() => {
    persist(prefs);
    setView('hidden');
  }, [prefs]);

  const policyHref = `/${locale}/legal/cookies`;

  if (view === 'hidden') return null;

  if (view === 'settings') {
    return (
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
        <div className="bg-background rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-sand-200">
            <div className="flex items-center gap-3">
              <Cookie className="h-8 w-8 text-terracotta-500" aria-hidden="true" />
              <h2 id="cookie-settings-title" className="text-xl font-serif font-bold text-foreground">
                {es ? 'Configuración de cookies' : 'Cookie settings'}
              </h2>
            </div>
            <button type="button" onClick={() => setView(readPrefs() ? 'hidden' : 'banner')} className="p-2 text-muted-foreground hover:bg-sand-100 rounded-lg" aria-label={es ? 'Cerrar' : 'Close'}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-muted-foreground mb-6">
              {es
                ? 'Elige qué tipos de cookies deseas aceptar. Las cookies necesarias no se pueden desactivar.'
                : 'Choose which cookies to accept. Necessary cookies cannot be turned off.'}
            </p>
            <div className={`p-4 rounded-xl border-2 mb-4 ${prefs.necessary ? 'border-terracotta-500 bg-terracotta-50' : 'border-sand-200'}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-terracotta-500 text-white shrink-0">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-foreground">{es ? 'Cookies necesarias' : 'Necessary cookies'}</h3>
                    <span className="text-xs bg-sand-200 text-foreground/70 px-2 py-1 rounded-full">{es ? 'Siempre activas' : 'Always on'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{es ? 'Sesión, idioma, seguridad y tu consentimiento.' : 'Session, language, security and your consent.'}</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border-2 mb-4 ${prefs.analytics ? 'border-terracotta-500 bg-terracotta-50' : 'border-sand-200 bg-sand-50'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${prefs.analytics ? 'bg-terracotta-500 text-white' : 'bg-sand-200 text-muted-foreground'}`}>
                  <BarChart3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-foreground">{es ? 'Cookies analíticas' : 'Analytics cookies'}</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={prefs.analytics} onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))} aria-label={es ? 'Analíticas' : 'Analytics'} />
                      <span className="w-10 h-6 bg-sand-300 rounded-full peer-checked:bg-terracotta-500 transition-colors" />
                      <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">{es ? 'Nos permiten medir visitas y mejorar Retiru (Google Analytics).' : 'Help us measure visits and improve Retiru (Google Analytics).'}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {es ? 'Más información en la ' : 'More information in our '}
              <Link href={policyHref} className="text-terracotta-600 hover:underline" onClick={() => setView('hidden')}>
                {es ? 'Política de cookies' : 'Cookie policy'}
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-sand-200 bg-sand-50">
            <button type="button" onClick={rejectAll} className="flex-1 px-4 py-2.5 border border-sand-300 rounded-lg font-medium hover:bg-background">
              {es ? 'Rechazar todas' : 'Reject all'}
            </button>
            <button type="button" onClick={save} className="flex-1 px-4 py-2.5 bg-background border border-sand-300 rounded-lg font-medium">
              {es ? 'Guardar preferencias' : 'Save preferences'}
            </button>
            <button type="button" onClick={acceptAll} className="flex-1 px-4 py-2.5 bg-terracotta-600 text-white rounded-lg font-medium hover:bg-terracotta-500">
              {es ? 'Aceptar todas' : 'Accept all'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 bg-background border-t border-sand-200 shadow-lg md:p-6" role="region" aria-label={es ? 'Banner de consentimiento de cookies' : 'Cookie consent banner'}>
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 flex items-start gap-3">
          <Cookie className="h-8 w-8 text-terracotta-500 flex-shrink-0 mt-1" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground mb-1">{es ? 'Utilizamos cookies' : 'We use cookies'}</h3>
            <p className="text-sm text-muted-foreground">
              {es
                ? 'Usamos cookies de analítica para medir visitas y mejorar Retiru. Puedes aceptar todas o configurar tus preferencias. '
                : 'We use analytics cookies to measure visits and improve Retiru. You can accept all or set your preferences. '}
              <Link href={policyHref} className="text-terracotta-600 hover:underline">
                {es ? 'Política de cookies' : 'Cookie policy'}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
          <button type="button" onClick={() => setView('settings')} className="px-4 py-2 bg-sand-100 text-foreground rounded-lg font-medium text-sm hover:bg-sand-200">
            {es ? 'Configurar' : 'Settings'}
          </button>
          <button type="button" onClick={acceptAll} className="px-4 py-2 bg-terracotta-600 text-white rounded-lg font-medium text-sm hover:bg-terracotta-500">
            {es ? 'Aceptar todas' : 'Accept all'}
          </button>
        </div>
      </div>
    </div>
  );
}
