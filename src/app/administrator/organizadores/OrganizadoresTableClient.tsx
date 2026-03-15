'use client';

interface OrganizerRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  full_name: string | null;
  events: number;
  status: string;
  joined: string;
  verified_at: string | null;
  total_bookings: number;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  verified: { label: 'Verificado', cls: 'bg-sage-100 text-sage-700' },
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Suspendido', cls: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rechazado', cls: 'bg-sand-200 text-[#7a6b5d]' },
};

export function OrganizadoresTableClient({ organizers }: { organizers: OrganizerRow[] }) {
  return (
    <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Nombre</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Retiros</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Reservas</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Registro</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr>
        </thead>
        <tbody>
          {organizers.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-[#999]">
                No hay organizadores registrados.
              </td>
            </tr>
          ) : (
            organizers.map((o) => {
              const badge = STATUS_BADGE[o.status] || STATUS_BADGE.pending;
              const date = o.joined ? new Date(o.joined).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
              return (
                <tr key={o.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="py-3 px-4 font-medium">
                    <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">
                      {o.name}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{o.email || '—'}</td>
                  <td className="py-3 px-4 text-center">{o.events}</td>
                  <td className="py-3 px-4 text-center">{o.total_bookings}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#a09383]">{date}</td>
                  <td className="py-3 px-4 text-right">
                    <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-xs font-semibold text-terracotta-600 hover:underline">
                      Ver perfil
                    </a>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
