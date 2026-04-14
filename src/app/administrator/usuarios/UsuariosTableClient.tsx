'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, X, Trash2, MessageCircle } from 'lucide-react';
import { EmailLink } from '@/components/ui/email-link';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  roles: string[];
  preferred_locale: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
  /** ISO de Supabase Auth; null si nunca ha iniciado sesión o no hay dato en auth */
  last_sign_in_at: string | null;
}

type SortKey = 'full_name' | 'email' | 'roles' | 'created_at' | 'last_sign_in_at';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 50;

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-red-100 text-red-700' },
  organizer: { label: 'Organizador', cls: 'bg-amber-100 text-amber-700' },
  center: { label: 'Centro', cls: 'bg-blue-100 text-blue-700' },
  attendee: { label: 'Asistente', cls: 'bg-sand-200 text-[#7a6b5d]' },
};

const ROLE_PRIORITY: Record<string, number> = { admin: 0, center: 1, organizer: 2, attendee: 3 };

function rolesSortValue(roles: string[]): string {
  const min = Math.min(...roles.map((r) => ROLE_PRIORITY[r] ?? 9));
  return String(min).padStart(2, '0') + roles.length;
}

function getSortValue(u: UserRow, key: SortKey): string {
  switch (key) {
    case 'full_name': return (u.full_name || '').toLowerCase();
    case 'email': return (u.email || '').toLowerCase();
    case 'roles': return rolesSortValue(u.roles);
    case 'created_at': return u.created_at || '';
    case 'last_sign_in_at': return u.last_sign_in_at || '';
  }
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={14} className="text-[#bbb] ml-1 inline" />;
  return dir === 'asc'
    ? <ChevronUp size={14} className="text-terracotta-600 ml-1 inline" />
    : <ChevronDown size={14} className="text-terracotta-600 ml-1 inline" />;
}

function ThSortable({ label, sortKey, current, dir, onSort, align = 'left' }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; align?: 'left' | 'center' | 'right';
}) {
  const textAlign = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      className={`${textAlign} py-3 px-4 font-semibold text-[#7a6b5d] cursor-pointer select-none hover:text-terracotta-600 transition-colors whitespace-nowrap`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <SortIcon active={current === sortKey} dir={dir} />
    </th>
  );
}

function PaginationBtn({ disabled, active, onClick, label }: { disabled?: boolean; active?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-colors ${
        active
          ? 'bg-terracotta-600 text-white'
          : disabled
            ? 'text-[#ccc] cursor-not-allowed'
            : 'text-[#666] hover:bg-sand-100'
      }`}
    >
      {label}
    </button>
  );
}

function paginationRange(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: number[] = [];
  pages.push(0);
  if (current > 2) pages.push(-1);
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
  if (current < total - 3) pages.push(-1);
  pages.push(total - 1);
  return pages;
}

export function UsuariosTableClient({ users, currentUserId }: { users: UserRow[]; currentUserId: string | null }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [messaging, setMessaging] = useState<string | null>(null);

  async function handleMessage(userId: string) {
    setMessaging(userId);
    try {
      const res = await fetch('/api/admin/messages/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.conversation_id) {
        window.location.href = `/administrator/mensajes?open=${data.conversation_id}`;
      } else {
        alert(data.error || 'Error al abrir conversación');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setMessaging(null);
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`¿Eliminar al usuario ${email || userId}? Esta acción no se puede deshacer.`)) return;
    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.reload();
      } else {
        alert(data.error || 'Error al eliminar el usuario');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = useMemo(() => {
    const words = query.toLowerCase().trim() ? query.toLowerCase().trim().split(/\s+/) : [];
    return users.filter((u) => {
      if (words.length > 0) {
        const rolesText = u.roles.map((r) => ROLE_BADGE[r]?.label || r).join(' ');
        const searchable = `${u.full_name || ''} ${u.email || ''} ${u.phone || ''} ${rolesText}`
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normed = words.map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
        if (!normed.every(w => searchable.includes(w))) return false;
      }
      if (filterRole && !u.roles.includes(filterRole)) return false;
      return true;
    });
  }, [users, query, filterRole]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortKey === 'last_sign_in_at') {
        const ta = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : NaN;
        const tb = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : NaN;
        const aNull = Number.isNaN(ta);
        const bNull = Number.isNaN(tb);
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
        const cmp = ta - tb;
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir(key === 'created_at' || key === 'last_sign_in_at' ? 'desc' : 'asc');
    }
    setPage(0);
  };

  const hasFilters = !!(query || filterRole);
  const clearAll = () => { setQuery(''); setFilterRole(''); setPage(0); };

  const selectClasses = 'rounded-lg border border-sand-200 bg-white text-sm text-[#333] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-300 appearance-none cursor-pointer';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-terracotta-300 transition-shadow"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="organizer">Organizador</option>
          <option value="center">Centro</option>
          <option value="attendee">Asistente</option>
        </select>
        {hasFilters && (
          <button onClick={clearAll} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-terracotta-600 hover:bg-terracotta-50 transition-colors">
            <X size={14} /> Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-[#999]">
          {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {pageData.length === 0 ? (
          <div className="bg-white border border-sand-200 rounded-2xl px-4 py-12 text-center text-[#999] text-sm">
            {hasFilters ? 'No hay usuarios que coincidan con los filtros.' : 'No hay usuarios en la base de datos.'}
          </div>
        ) : (
          pageData.map((u) => {
            const sortedRoles = [...u.roles].sort((a, b) => (ROLE_PRIORITY[a] ?? 9) - (ROLE_PRIORITY[b] ?? 9));
            const date = u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
            return (
              <div key={u.id} className="bg-white border border-sand-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-sand-100 shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#bbb]">
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{u.full_name || '—'}</p>
                    <p className="text-xs text-[#7a6b5d] truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {sortedRoles.map((role) => {
                      const b = ROLE_BADGE[role] || ROLE_BADGE.attendee;
                      return <span key={role} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>;
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {u.phone && <div><span className="text-[#a09383]">Tel:</span> {u.phone}</div>}
                  <div><span className="text-[#a09383]">Registro:</span> {date}</div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-sand-100">
                  <button onClick={() => handleMessage(u.id)} disabled={messaging === u.id} className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:bg-terracotta-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    <MessageCircle size={14} /> Mensaje
                  </button>
                  {u.id !== currentUserId && (
                    <button onClick={() => handleDelete(u.id, u.email)} disabled={deleting === u.id} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] w-14">Img</th>
                <ThSortable label="Nombre" sortKey="full_name" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThSortable label="Email" sortKey="email" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Teléfono</th>
                <ThSortable label="Rol" sortKey="roles" current={sortKey} dir={sortDir} onSort={handleSort} align="center" />
                <ThSortable label="Registro" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThSortable label="Último acceso" sortKey="last_sign_in_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="text-right py-3 px-4 font-semibold text-[#a09383] w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#999]">
                    {hasFilters ? 'No hay usuarios que coincidan con los filtros.' : 'No hay usuarios en la base de datos.'}
                  </td>
                </tr>
              ) : (
                pageData.map((u) => {
                  const sortedRoles = [...u.roles].sort((a, b) => (ROLE_PRIORITY[a] ?? 9) - (ROLE_PRIORITY[b] ?? 9));
                  const date = u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  const lastIn = u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—';
                  return (
                    <tr key={u.id} className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                      <td className="py-2 px-4">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-sand-100 shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#bbb]">{(u.full_name || u.email || '?')[0].toUpperCase()}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium max-w-[200px] truncate">{u.full_name || '—'}</td>
                      <td className="py-3 px-4 text-[#7a6b5d] max-w-[220px] truncate">
                        <EmailLink email={u.email} className="text-[#7a6b5d] hover:text-terracotta-600 hover:underline" />
                      </td>
                      <td className="py-3 px-4 text-[#7a6b5d]">{u.phone || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {sortedRoles.map((role) => {
                            const badge = ROLE_BADGE[role] || ROLE_BADGE.attendee;
                            return <span key={role} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>;
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#7a6b5d] text-sm">{date}</td>
                      <td className="py-3 px-4 text-[#7a6b5d] text-sm whitespace-nowrap">{lastIn}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleMessage(u.id)} disabled={messaging === u.id} className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50" title="Enviar mensaje">
                            <MessageCircle size={14} /> Mensaje
                          </button>
                          {u.id !== currentUserId ? (
                            <button onClick={() => handleDelete(u.id, u.email)} disabled={deleting === u.id} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50" title="Eliminar usuario">
                              <Trash2 size={14} /> Eliminar
                            </button>
                          ) : (
                            <span className="text-xs text-[#999]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-[#999]">
            Mostrando {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <PaginationBtn disabled={safePage === 0} onClick={() => setPage(0)} label="«" />
            <PaginationBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)} label="‹" />
            {paginationRange(safePage, totalPages).map((p, i) =>
              p === -1 ? (
                <span key={`dots-${i}`} className="px-2 text-[#ccc]">…</span>
              ) : (
                <PaginationBtn key={p} active={p === safePage} onClick={() => setPage(p)} label={String(p + 1)} />
              ),
            )}
            <PaginationBtn disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)} label="›" />
            <PaginationBtn disabled={safePage >= totalPages - 1} onClick={() => setPage(totalPages - 1)} label="»" />
          </div>
        </div>
      )}
    </div>
  );
}
