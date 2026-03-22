// ============================================================================
// RETIRU · Footer
// ============================================================================

import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import LocaleSwitchLink from '@/components/layout/LocaleSwitchLink';

interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  const t = getDictionary(locale);
  const prefix = `/${locale}`;
  const year = new Date().getFullYear();

  const searchPath = locale === 'es' ? `${prefix}/buscar` : `${prefix}/search`;
  const centersPath = locale === 'es' ? `${prefix}/centros-retiru` : `${prefix}/centers-retiru`;
  const shopPath = locale === 'es' ? `${prefix}/tienda` : `${prefix}/shop`;
  const eventosPath = locale === 'es' ? `${prefix}/retiros-retiru` : `${prefix}/retreats-retiru`;
  const destinationsPath = locale === 'es' ? `${prefix}/destinos` : `${prefix}/destinations`;
  const forOrgPath = locale === 'es' ? `${prefix}/para-organizadores` : `${prefix}/for-organizers`;
  const helpPath = locale === 'es' ? `${prefix}/ayuda` : `${prefix}/help`;
  const aboutPath = locale === 'es' ? `${prefix}/sobre-nosotros` : `${prefix}/about`;
  const contactPath = locale === 'es' ? `${prefix}/contacto` : `${prefix}/contact`;

  return (
    <footer className="bg-[#2d2319] text-white/70">
      <div className="container-wide pt-16 pb-6">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={prefix} className="inline-flex items-center gap-[3px]">
              <span className="font-serif text-[28px] text-white tracking-[-0.02em]">retiru</span>
              <span className="w-2 h-2 bg-terracotta-500 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
            </Link>
            <p className="mt-3 text-sm leading-[1.7] text-white/70">
              {t.footer.tagline}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-white">
              {t.footer.explore}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href={searchPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.search}</Link></li>
              <li><Link href={centersPath} className="text-sm text-white/70 hover:text-white transition-colors">{locale === 'es' ? 'Centros' : 'Centers'}</Link></li>
              <li><Link href={shopPath} className="text-sm text-white/70 hover:text-white transition-colors">{locale === 'es' ? 'Tienda' : 'Shop'}</Link></li>
              <li><Link href={eventosPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.retreats}</Link></li>
              <li><Link href={destinationsPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.destinations}</Link></li>
              <li><Link href={forOrgPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.forOrganizers}</Link></li>
              <li><Link href={`${prefix}/blog`} className="text-sm text-white/70 hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-white">
              {t.footer.company}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href={aboutPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.footer.about}</Link></li>
              <li><Link href={helpPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.help}</Link></li>
              <li><Link href={contactPath} className="text-sm text-white/70 hover:text-white transition-colors">{t.footer.contact}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-white">
              {t.footer.legal}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href={`${prefix}/condiciones`} className="text-sm text-white/70 hover:text-white transition-colors">{t.footer.conditions}</Link></li>
              <li><Link href={`${prefix}/legal/terminos`} className="text-sm text-white/70 hover:text-white transition-colors">{t.footer.terms}</Link></li>
              <li><Link href={`${prefix}/legal/privacidad`} className="text-sm text-white/70 hover:text-white transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href={`${prefix}/legal/cookies`} className="text-sm text-white/70 hover:text-white transition-colors">{t.footer.cookies}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-[13px] text-white/50">
            {t.footer.allRights.replace('{year}', String(year))}
          </p>
          <div className="flex items-center gap-6">
            <LocaleSwitchLink
              locale={locale}
              className="text-[13px] text-white/50 hover:text-white transition-colors"
            />
          </div>
        </div>
        <div className="text-center text-white/40 text-xs md:text-sm leading-relaxed pt-4">
          <span className="block sm:inline">Hecho con <span className="text-red-500 inline-block animate-pulse">❤️</span> en Murcia</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline mt-1 sm:mt-0">Web desarrollada por{' '}
            <a href="https://www.eskaladigital.com" target="_blank" rel="noopener noreferrer" className="text-terracotta-400 hover:text-terracotta-300 transition-colors font-medium whitespace-nowrap">
              ESKALA Agencia de Marketing Digital
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
