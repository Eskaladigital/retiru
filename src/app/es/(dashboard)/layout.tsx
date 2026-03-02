// Layout del dashboard de usuario
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const NAV = [
  { href: '/es/mis-reservas', label: 'Mis reservas', icon: '📋' },
  { href: '/es/mensajes', label: 'Mensajes', icon: '💬' },
  { href: '/es/perfil', label: 'Perfil', icon: '👤' },
  { href: '/es/facturas', label: 'Facturas', icon: '🧾' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header locale="es" />
      <div className="container-wide py-8">
        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <nav className="sticky top-24 space-y-1">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#7a6b5d] hover:bg-sand-100 hover:text-foreground transition-colors">
                  <span>{n.icon}</span> {n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer locale="es" />
    </>
  );
}
