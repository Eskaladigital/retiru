'use client';

// ============================================================================
// RETIRU · Shell público — Header + Footer (locale desde URL)
// ============================================================================

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Locale } from '@/i18n/config';

interface PublicShellProps {
  user: { name: string; role: string } | null;
  children: React.ReactNode;
}

export default function PublicShell({ user, children }: PublicShellProps) {
  const pathname = usePathname();
  const locale: Locale = pathname?.startsWith('/en') ? 'en' : 'es';

  return (
    <>
      <Header locale={locale} user={user} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
