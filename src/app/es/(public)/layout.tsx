// ============================================================================
// RETIRU · Public layout (Header + Footer) — ES
// ============================================================================

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header locale="es" />
      <main className="min-h-[60vh]">{children}</main>
      <Footer locale="es" />
    </>
  );
}
