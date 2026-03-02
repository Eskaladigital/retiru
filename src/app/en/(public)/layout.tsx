// ============================================================================
// RETIRU · Public layout (Header + Footer) — EN
// ============================================================================

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header locale="en" />
      <main className="min-h-[60vh]">{children}</main>
      <Footer locale="en" />
    </>
  );
}
