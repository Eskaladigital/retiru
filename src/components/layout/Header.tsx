'use client';

// ============================================================================
// RETIRU · Header / Navbar
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Globe, User, ChevronDown } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';

interface HeaderProps {
  locale: Locale;
  user?: { name: string; role: string } | null;
}

export default function Header({ locale, user }: HeaderProps) {
  const t = getDictionary(locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const altLocale = locale === 'es' ? 'en' : 'es';

  const prefix = `/${locale}`;
  const centersPath = locale === 'es' ? `${prefix}/centros-retiru` : `${prefix}/centers-retiru`;
  const shopPath = locale === 'es' ? `${prefix}/tienda` : `${prefix}/shop`;
  const eventosPath = locale === 'es' ? `${prefix}/retiros-retiru` : `${prefix}/retreats-retiru`;
  const forOrgPath = locale === 'es' ? `${prefix}/para-organizadores` : `${prefix}/for-organizers`;
  const loginPath = `${prefix}/login`;
  const registerPath = locale === 'es' ? `${prefix}/registro` : `${prefix}/register`;

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-white/95 backdrop-blur-sm">
      <nav className="container-wide flex h-16 items-center justify-between md:h-18">
        {/* Logo */}
        <Link href={prefix} className="flex items-center gap-[3px]">
          <span className="font-serif text-[28px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
          <span className="w-2 h-2 bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link href={centersPath} className="btn-ghost text-sm">
            {locale === 'es' ? 'Centros' : 'Centers'}
          </Link>
          <Link href={eventosPath} className="btn-ghost text-sm">
            {t.nav.retreats}
          </Link>
          <Link href={shopPath} className="btn-ghost text-sm">
            {locale === 'es' ? 'Tienda' : 'Shop'}
          </Link>
          <Link href={forOrgPath} className="btn-ghost text-sm text-sage-600">
            {t.nav.forOrganizers}
          </Link>
          <Link href={`${prefix}/blog`} className="btn-ghost text-sm">
            Blog
          </Link>
          <Link href={`${prefix}/condiciones`} className="btn-ghost text-sm text-foreground hover:text-terracotta-600 whitespace-nowrap">
            {t.nav.conditions}
          </Link>
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex shrink-0">
          <Link href={`/${altLocale}`} className="btn-ghost flex items-center gap-1 text-sm">
            <Globe size={16} />
            {altLocale.toUpperCase()}
          </Link>
          {user ? (
            <div className="relative">
              <button className="flex items-center gap-2 rounded-full border border-sand-300 px-4 py-2 text-sm transition-colors hover:bg-sand-50">
                <User size={16} />
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown size={14} />
              </button>
            </div>
          ) : (
            <>
              <Link href={loginPath} className="btn-ghost text-sm">{t.nav.login}</Link>
              <Link href={registerPath} className="btn-primary text-sm">{t.nav.register}</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn-ghost md:hidden p-2 -mr-2"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Off-canvas mobile menu */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden
        />
        {/* Panel lateral */}
        <div
          className={`absolute top-0 right-0 h-full w-[min(320px,85vw)] max-w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-sand-200">
            <span className="font-serif text-xl text-terracotta-700">Menú</span>
            <button
              onClick={closeMenu}
              className="btn-ghost p-2 -mr-2"
              aria-label="Cerrar menú"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-4">
            <div className="flex flex-col gap-1">
              <Link href={centersPath} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                <span className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-sage-600 text-sm font-bold">C</span>
                {locale === 'es' ? 'Centros' : 'Centers'}
              </Link>
              <Link href={eventosPath} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                <span className="w-8 h-8 rounded-lg bg-terracotta-100 flex items-center justify-center text-terracotta-600 text-sm font-bold">E</span>
                {t.nav.retreats}
              </Link>
              <Link href={shopPath} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                {locale === 'es' ? 'Tienda' : 'Shop'}
              </Link>
              <Link href={forOrgPath} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sage-50 text-sage-700 transition-colors" onClick={closeMenu}>
                {t.nav.forOrganizers}
              </Link>
              <Link href={`${prefix}/blog`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                Blog
              </Link>
              <Link href={`${prefix}/condiciones`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                {t.nav.conditions}
              </Link>
            </div>
            <hr className="my-4 border-sand-200" />
            <div className="flex flex-col gap-1">
              <Link href={`/${altLocale}`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                <Globe size={20} className="text-[#a09383]" /> {altLocale === 'en' ? 'English' : 'Español'}
              </Link>
              {user ? (
                <>
                  <Link href={`${prefix}/mis-reservas`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                    {t.nav.myBookings}
                  </Link>
                  <Link href={`${prefix}/perfil`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                    {t.nav.profile}
                  </Link>
                </>
              ) : (
                <>
                  <Link href={loginPath} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-50 transition-colors" onClick={closeMenu}>
                    {t.nav.login}
                  </Link>
                  <Link href={registerPath} className="flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl bg-terracotta-600 text-white font-semibold hover:bg-terracotta-700 transition-colors" onClick={closeMenu}>
                    {t.nav.register}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
