// Layout del dashboard de usuario — Header+Footer desde (public)/layout
import Link from 'next/link';

const NAV = [
  { href: '/es/mis-reservas', label: 'Mis reservas', icon: '📋' },
  { href: '/es/mensajes', label: 'Mensajes', icon: '💬' },
  { href: '/es/perfil', label: 'Mi perfil', icon: '👤' },
  { href: '/es/mis-centros', label: 'Mis centros', icon: '🏢' },
  { href: '/es/mis-eventos', label: 'Mis eventos', icon: '📅' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-wide pt-12 pb-8">
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
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
