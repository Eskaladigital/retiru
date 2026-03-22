'use client';

// ============================================================================
// RETIRU · Header / Navbar — glass overlay + off-canvas mobile
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Globe, User, ChevronDown, MapPin, Compass, ShoppingBag, Heart, BookOpen, LogOut, Shield, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import LocaleSwitchLink from '@/components/layout/LocaleSwitchLink';

interface HeaderProps {
  locale: Locale;
  user?: { name: string; role: string } | null;
}

export default function Header({ locale, user }: HeaderProps) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const altLocale = locale === 'es' ? 'en' : 'es';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    closeMenu();
    router.refresh();
  }

  const prefix = `/${locale}`;
  const centersPath = locale === 'es' ? `${prefix}/centros-retiru` : `${prefix}/centers-retiru`;
  const shopPath = locale === 'es' ? `${prefix}/tienda` : `${prefix}/shop`;
  const eventosPath = locale === 'es' ? `${prefix}/retiros-retiru` : `${prefix}/retreats-retiru`;
  const forOrgPath = locale === 'es' ? `${prefix}/para-organizadores` : `${prefix}/for-organizers`;
  const loginPath = `${prefix}/login`;
  const registerPath = locale === 'es' ? `${prefix}/registro` : `${prefix}/register`;

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-sand-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="container-wide flex h-16 items-center justify-between md:h-[72px]">
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
          {user?.role === 'admin' && (
            <Link href="/administrator" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-terracotta-600 hover:bg-terracotta-50 hover:text-terracotta-700 transition-colors">
              <Shield size={14} /> Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex shrink-0">
          <LocaleSwitchLink locale={locale} className="btn-ghost flex items-center gap-1 text-sm">
            <Globe size={16} />
            {altLocale.toUpperCase()}
          </LocaleSwitchLink>
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-sand-300 px-4 py-2 text-sm transition-colors hover:bg-sand-50"
              >
                <User size={16} />
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-sand-200 bg-white py-1 shadow-lg">
                  <Link href={`${prefix}/mis-reservas`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sand-50" onClick={() => setUserMenuOpen(false)}>
                    <span className="text-base w-5">📋</span> {locale === 'es' ? 'Mis reservas' : 'My bookings'}
                  </Link>
                  <Link href="/es/mensajes" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sand-50" onClick={() => setUserMenuOpen(false)}>
                    <MessageCircle size={16} className="w-5" /> {locale === 'es' ? 'Mensajes' : 'Messages'}
                  </Link>
                  <Link href={`${prefix}/perfil`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sand-50" onClick={() => setUserMenuOpen(false)}>
                    <span className="text-base w-5">👤</span> {locale === 'es' ? 'Mi perfil' : 'My profile'}
                  </Link>
                  <Link href={`${prefix}/mis-centros`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sand-50" onClick={() => setUserMenuOpen(false)}>
                    <span className="text-base w-5">🏢</span> {locale === 'es' ? 'Mis centros' : 'My centers'}
                  </Link>
                  <Link href={`${prefix}/mis-eventos`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sand-50" onClick={() => setUserMenuOpen(false)}>
                    <span className="text-base w-5">📅</span> {locale === 'es' ? 'Mis eventos' : 'My events'}
                  </Link>
                  <hr className="my-1 border-sand-100" />
                  {user.role === 'admin' && (
                    <Link href="/administrator" className="flex items-center gap-2 px-4 py-2.5 text-sm text-terracotta-600 hover:bg-terracotta-50" onClick={() => setUserMenuOpen(false)}>
                      <Shield size={14} /> Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={14} /> {locale === 'es' ? 'Cerrar sesión' : 'Log out'}
                  </button>
                </div>
              )}
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
          className={`md:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            scrolled ? 'hover:bg-sand-100' : 'hover:bg-white/20'
          }`}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
    </header>

    {/* Off-canvas mobile menu — fuera del header para evitar stacking context */}
    <div
      className={`fixed inset-0 z-[9999] md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden
        />
        {/* Panel lateral */}
        <div
          className={`absolute top-0 right-0 h-full w-[min(320px,85vw)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header del panel */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-sand-100 shrink-0">
            <Link href={prefix} className="flex items-center gap-[3px]" onClick={closeMenu}>
              <span className="font-serif text-[22px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
              <span className="w-1.5 h-1.5 bg-terracotta-600 rounded-full -mb-0.5" />
            </Link>
            <button
              onClick={closeMenu}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-sand-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            <div className="flex flex-col gap-0.5">
              <Link href={centersPath} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                <span className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center"><MapPin size={17} className="text-sage-600" /></span>
                {locale === 'es' ? 'Centros' : 'Centers'}
              </Link>
              <Link href={eventosPath} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                <span className="w-9 h-9 rounded-xl bg-terracotta-50 flex items-center justify-center"><Compass size={17} className="text-terracotta-600" /></span>
                {t.nav.retreats}
              </Link>
              <Link href={shopPath} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><ShoppingBag size={17} className="text-amber-600" /></span>
                {locale === 'es' ? 'Tienda' : 'Shop'}
              </Link>
              <Link href={forOrgPath} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sage-50 transition-colors text-[15px]" onClick={closeMenu}>
                <span className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center"><Heart size={17} className="text-sage-600" /></span>
                {t.nav.forOrganizers}
              </Link>
              <Link href={`${prefix}/blog`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                <span className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center"><BookOpen size={17} className="text-sand-600" /></span>
                Blog
              </Link>
              {user?.role === 'admin' && (
                <Link href="/administrator" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-terracotta-50 text-terracotta-600 font-semibold transition-colors text-[15px]" onClick={closeMenu}>
                  <span className="w-9 h-9 rounded-xl bg-terracotta-50 flex items-center justify-center"><Shield size={17} className="text-terracotta-600" /></span>
                  Admin
                </Link>
              )}
            </div>

            <hr className="my-3 border-sand-100" />

            <div className="flex flex-col gap-0.5">
              <LocaleSwitchLink
                locale={locale}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]"
                onNavigate={closeMenu}
              >
                <span className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center"><Globe size={17} className="text-sand-500" /></span>
                {altLocale === 'en' ? 'English' : 'Español'}
              </LocaleSwitchLink>
              {user ? (
                <>
                  <Link href={`${prefix}/mis-reservas`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                    <span className="text-base">📋</span> {locale === 'es' ? 'Mis reservas' : 'My bookings'}
                  </Link>
                  <Link href="/es/mensajes" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                    <MessageCircle size={17} /> {locale === 'es' ? 'Mensajes' : 'Messages'}
                  </Link>
                  <Link href={`${prefix}/perfil`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                    <span className="text-base">👤</span> {locale === 'es' ? 'Mi perfil' : 'My profile'}
                  </Link>
                  <Link href={`${prefix}/mis-centros`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                    <span className="text-base">🏢</span> {locale === 'es' ? 'Mis centros' : 'My centers'}
                  </Link>
                  <Link href={`${prefix}/mis-eventos`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                    <span className="text-base">📅</span> {locale === 'es' ? 'Mis eventos' : 'My events'}
                  </Link>
                  <hr className="my-1 border-sand-100" />
                  {user.role === 'admin' && (
                    <Link href="/administrator" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-terracotta-50 text-terracotta-600 transition-colors text-[15px]" onClick={closeMenu}>
                      <Shield size={17} /> Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 text-[15px] text-left">
                    <LogOut size={17} /> {locale === 'es' ? 'Cerrar sesión' : 'Log out'}
                  </button>
                </>
              ) : (
                <>
                  <Link href={loginPath} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors text-[15px]" onClick={closeMenu}>
                    <span className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center"><User size={17} className="text-sand-500" /></span>
                    {t.nav.login}
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Footer del panel */}
          {!user && (
            <div className="shrink-0 p-4 border-t border-sand-100">
              <Link
                href={registerPath}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-terracotta-600 text-white font-semibold hover:bg-terracotta-700 transition-colors text-[15px]"
                onClick={closeMenu}
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
