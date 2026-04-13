'use client';

// ============================================================================
// RETIRU · Shell público — Header + Footer (locale desde URL)
// ============================================================================

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SupportChatWidget from '@/components/chat/SupportChatWidget';
import type { Locale } from '@/i18n/config';

interface PublicShellProps {
  user: { name: string; roles: string[] } | null;
  children: React.ReactNode;
}

export default function PublicShell({ user, children }: PublicShellProps) {
  const pathname = usePathname();
  const locale: Locale = pathname?.startsWith('/en') ? 'en' : 'es';

  // Navegación cliente no vuelve a ejecutar el layout raíz: sincronizar <html lang> con la URL.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = pathname?.startsWith('/en') ? 'en' : 'es';
  }, [pathname]);

  return (
    <>
      <Header locale={locale} user={user} />
      <main className="min-h-[60vh] pt-16 md:pt-[72px]">{children}</main>
      <Footer locale={locale} />
      <SupportChatWidget locale={locale} />
    </>
  );
}
