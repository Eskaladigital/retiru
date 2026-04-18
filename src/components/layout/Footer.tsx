// ============================================================================
// RETIRU · Footer
// ============================================================================

import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import LocaleSwitchLink from '@/components/layout/LocaleSwitchLink';

function IconVisa({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#1A1F71"/>
      <path d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7h-53.4zm224.5-190.9c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.6 43.9 46.9 53.3 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-31.9 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.8.2-22.3-14-39.2-44.8-53.2-18.7-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.3-42.8zm137.3-4.8h-41.3c-12.8 0-22.4 3.5-28 16.2l-79.4 179.5h56.2s9.2-24.1 11.3-29.4h68.6c1.6 6.9 6.5 29.4 6.5 29.4h49.7l-43.6-195.7zm-65.8 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.6h-44.6zM247 153l-52.5 133.6-5.6-27.2c-9.7-31.2-39.9-65.1-73.7-82l47.9 171.2h56.6l84.2-195.6H247z" fill="#fff"/>
      <path d="M146.9 153H60.1l-.7 3.8c67.1 16.2 111.5 55.4 129.9 102.4L171.1 170c-3.2-12.3-12.6-16.5-24.2-17z" fill="#F9A533"/>
    </svg>
  );
}

function IconMastercard({ className = 'w-10 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#16366F"/>
      <circle cx="310" cy="250" r="170" fill="#EB001B"/>
      <circle cx="470" cy="250" r="170" fill="#F79E1B"/>
      <path d="M390 120.8a169.5 169.5 0 0 0-62.7 129.2A169.5 169.5 0 0 0 390 379.2a169.5 169.5 0 0 0 62.7-129.2A169.5 169.5 0 0 0 390 120.8z" fill="#FF5F00"/>
    </svg>
  );
}

function IconStripe({ className = 'w-12 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 468 222" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M414 113.4c0-25.6-12.4-45.8-36.1-45.8-23.8 0-38.2 20.2-38.2 45.6 0 30.1 16.1 45.3 39.1 45.3 11.2 0 19.7-2.5 26.1-6.1v-21.5c-6.4 3.2-13.7 5.2-23 5.2-9.1 0-17.2-3.2-18.2-14.2h45.9c0-1.2.4-6.1.4-8.5zm-46.4-9.5c0-10.6 6.5-15 12.4-15 5.7 0 11.9 4.4 11.9 15h-24.3zM313.3 67.6c-9.2 0-15.1 4.3-18.4 7.3l-1.2-5.8h-22.5v116.4l25.6-5.4.1-28.2c3.4 2.5 8.5 6 16.8 6 17 0 32.5-13.7 32.5-43.7-.1-27.5-15.8-46.6-32.9-46.6zm-5.8 71.7c-5.6 0-8.9-2-11.2-4.5l-.1-35.5c2.5-2.7 5.9-4.6 11.3-4.6 8.6 0 14.6 9.7 14.6 22.3 0 12.8-5.9 22.3-14.6 22.3zM223.8 61.7l25.6-5.5V35l-25.6 5.4v21.3zm0 7.9h25.6v87.3h-25.6V69.6zm-28.8-4l-1.6-7h-22.2v87.3h25.6V94.5c6-7.9 16.3-6.4 19.5-5.3V65.1c-3.3-1.3-15.5-3.6-21.3 4.5zM131 40.4l-25 5.3-.1 79.9c0 14.8 11.1 25.7 25.9 25.7 8.2 0 14.2-1.5 17.5-3.3V127c-3.2 1.3-18.9 5.8-18.9-8.7V90.6h18.9V69.6H130.3l.7-29.2zM46.5 90.1c0-3.7 3-5.1 8-5.1 7.1 0 16.1 2.2 23.2 6V67.5C70.1 64.6 62.7 63 55.3 63h-.8c-20.2 0-33.6 10.6-33.6 28.2 0 27.5 37.9 23.1 37.9 35 0 4.4-3.8 5.8-9.1 5.8-7.9 0-18-3.2-26-7.6v23.8c8.8 3.8 17.8 5.4 26 5.4 20.7 0 34.9-10.2 34.9-28.1-.1-29.7-38.1-24.4-38.1-35.5z" fill="#fff"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-5 h-5 text-sage-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

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
  const forAttPath = locale === 'es' ? `${prefix}/para-asistentes` : `${prefix}/for-attendees`;
  const helpPath = locale === 'es' ? `${prefix}/ayuda` : `${prefix}/help`;
  const aboutPath = locale === 'es' ? `${prefix}/sobre-nosotros` : `${prefix}/about`;
  const contactPath = locale === 'es' ? `${prefix}/contacto` : `${prefix}/contact`;

  return (
    <footer className="bg-[#2d2319] text-white/70">
      {/* Secure payment strip */}
      <div className="bg-[#352b21] border-b border-white/5">
        <div className="container-wide py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <IconLock />
              <span className="text-sm font-semibold text-white tracking-wide">
                {locale === 'es' ? 'Pago 100 % seguro' : '100% secure payment'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <IconStripe className="w-14 h-7 opacity-90" />
              <span className="text-white/30 text-xs">|</span>
              <IconVisa className="w-11 h-7 rounded opacity-90" />
              <IconMastercard className="w-11 h-7 rounded opacity-90" />
            </div>
            <p className="text-xs text-white/50 text-center sm:text-left max-w-xs">
              {locale === 'es'
                ? 'Visa, Mastercard y más. Tus datos nunca pasan por nuestros servidores.'
                : 'Visa, Mastercard & more. Your data never touches our servers.'}
            </p>
          </div>
        </div>
      </div>

      <div className="container-wide pt-16 pb-6">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={prefix} className="inline-flex items-center">
              <Image src="/Logo_retiru_transparente.png" alt="Retiru" width={100} height={36} className="h-8 w-auto brightness-0 invert" />
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
              <li><Link href={forAttPath} className="text-sm text-white/70 hover:text-white transition-colors">{locale === 'es' ? 'Para asistentes' : 'For attendees'}</Link></li>
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

        {/* Social + Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-[13px] text-white/50">
            {t.footer.allRights.replace('{year}', String(year))}
          </p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/retiru.es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Retiru"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-7.5h2.5l.375-3h-2.875V8.625c0-.866.24-1.458 1.484-1.458h1.588v-2.68A21.5 21.5 0 0 0 14.267 4.5C12 4.5 10.5 5.884 10.5 8.31v2.19H8v3h2.5V21h3Z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/retiru.es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Retiru"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>
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
