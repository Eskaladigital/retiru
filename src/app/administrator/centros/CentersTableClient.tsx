'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, Search, ChevronUp, ChevronDown, ChevronsUpDown, X, Pencil, ExternalLink, Trash2, EyeOff, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CENTER_FILTER_OPTIONS_ES, getCenterTypeLabel } from '@/lib/utils';

export type CenterRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  plan: string;
  status: string;
  type?: string;
  price_monthly?: number;
  description_es?: string | null;
  cover_url?: string | null;
  email?: string | null;
  submitted_by?: string | null;
};

function exportStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Activo';
    case 'pending_review': return 'Propuesta usuario';
    case 'pending_payment': return 'Pago pendiente';
    case 'inactive': return 'Inactivo';
    case 'expired': return 'Caducado';
    default: return status || '—';
  }
}

function getMainImage(c: CenterRow): string {
  return c.cover_url || '';
}

function getMRR(c: CenterRow): number {
  return c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0;
}

function hasDesc(c: CenterRow): boolean {
  return !!(c.description_es?.trim() && c.description_es.trim().length >= 80);
}

type SortKey = 'name' | 'city' | 'province' | 'plan' | 'type' | 'status' | 'mrr' | 'desc';
type SortDir = 'asc' | 'desc';

function getSortValue(c: CenterRow, key: SortKey): string | number {
  switch (key) {
    case 'name': return (c.name || '').toLowerCase();
    case 'city': return (c.city || '').toLowerCase();
    case 'province': return (c.province || '').toLowerCase();
    case 'plan': return c.plan || '';
    case 'type': return (c.type || '').toLowerCase();
    case 'status': return c.status || '';
    case 'mrr': return getMRR(c);
    case 'desc': return hasDesc(c) ? 1 : 0;
  }
}

function exportCSV(list: CenterRow[]) {
  const headers = ['Imagen', 'Centro', 'Slug', 'Ciudad', 'Provincia', 'Plan', 'Estado', 'MRR', 'Descripción'];
  const rows = list.map((c) => [
    getMainImage(c) || '',
    c.name,
    c.slug,
    c.city || '',
    c.province || '',
    c.plan === 'featured' ? 'Destacado' : 'Básico',
    exportStatusLabel(c.status),
    getMRR(c),
    hasDesc(c) ? 'Sí' : 'No',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `centros-retiru-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportExcel(list: CenterRow[]) {
  const XLSX = await import('xlsx');
  const data = list.map((c) => ({
    Imagen: getMainImage(c) || '',
    Centro: c.name,
    Slug: c.slug,
    Ciudad: c.city || '',
    Provincia: c.province || '',
    Plan: c.plan === 'featured' ? 'Destacado' : 'Básico',
    Estado: exportStatusLabel(c.status),
    MRR: getMRR(c),
    'Tiene descripción': hasDesc(c) ? 'Sí' : 'No',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Centros');
  XLSX.writeFile(wb, `centros-retiru-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

const PAGE_SIZE = 50;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={14} className="text-[#bbb] ml-1 inline" />;
  return dir === 'asc'
    ? <ChevronUp size={14} className="text-terracotta-600 ml-1 inline" />
    : <ChevronDown size={14} className="text-terracotta-600 ml-1 inline" />;
}

export function CentersTableClient({ list }: { list: CenterRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleDelete = async (c: CenterRow) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${c.name}"?\n\nEsta acción no se puede deshacer.`)) return;
    setDeleting(c.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('centers').delete().eq('id', c.id);
      if (error) {
        alert(`Error al eliminar: ${error.message}`);
      } else {
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (c: CenterRow) => {
    if (c.status === 'pending_review') {
      if (!window.confirm(
        `¿Aprobar la propuesta "${c.name}"?\n\nSe publicará el centro y se asignará al usuario que la envió como titular.`,
      )) return;
      setToggling(c.id);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('centers')
          .update({
            status: 'active',
            claimed_by: c.submitted_by || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', c.id);
        if (error) {
          alert(`Error al aprobar: ${error.message}`);
        } else {
          router.refresh();
        }
      } finally {
        setToggling(null);
      }
      return;
    }

    const isActive = c.status === 'active';
    const action = isActive ? 'despublicar' : 'publicar';
    if (!window.confirm(`¿${isActive ? 'Despublicar' : 'Publicar'} "${c.name}"?`)) return;
    setToggling(c.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('centers')
        .update({ status: isActive ? 'inactive' : 'active' })
        .eq('id', c.id);
      if (error) {
        alert(`Error al ${action}: ${error.message}`);
      } else {
        router.refresh();
      }
    } finally {
      setToggling(null);
    }
  };

  const [filterProvince, setFilterProvince] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDesc, setFilterDesc] = useState('');
  const [page, setPage] = useState(0);

  const provinces = useMemo(() => {
    const set = new Set(list.map((c) => c.province).filter(Boolean));
    return Array.from(set).sort();
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const words = q ? q.split(/\s+/) : [];
    return list.filter((c) => {
      if (words.length > 0) {
        const searchable = `${c.name || ''} ${c.slug || ''} ${c.city || ''} ${c.province || ''} ${c.plan || ''} ${c.status || ''} ${c.email || ''}`
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const qNorm = words.map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
        if (!qNorm.every(w => searchable.includes(w))) return false;
      }
      if (filterProvince && c.province !== filterProvince) return false;
      if (filterPlan && c.plan !== filterPlan) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterType && c.type !== filterType) return false;
      if (filterDesc === 'yes' && !hasDesc(c)) return false;
      if (filterDesc === 'no' && hasDesc(c)) return false;
      return true;
    });
  }, [list, query, filterProvince, filterPlan, filterStatus, filterType, filterDesc]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
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
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const hasFilters = !!(query || filterProvince || filterPlan || filterStatus || filterType || filterDesc);

  const clearAll = () => {
    setQuery('');
    setFilterProvince('');
    setFilterPlan('');
    setFilterStatus('');
    setFilterType('');
    setFilterDesc('');
    setPage(0);
  };

  const selectClasses = 'rounded-lg border border-sand-200 bg-white text-sm text-[#333] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-300 appearance-none cursor-pointer';

  return (
    <div className="space-y-4">
      {/* Barra superior: buscador + exportar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad, provincia, slug..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-terracotta-300 transition-shadow"
          />
        </div>
        <button
          onClick={() => exportCSV(sorted)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sand-200 text-sm font-medium text-[#7a6b5d] hover:bg-sand-50 transition-colors"
        >
          <Download size={16} /> CSV
        </button>
        <button
          type="button"
          onClick={() => void exportExcel(sorted)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sand-200 text-sm font-medium text-[#7a6b5d] hover:bg-sand-50 transition-colors"
        >
          <FileSpreadsheet size={16} /> Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterProvince} onChange={(e) => { setFilterProvince(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">Todas las provincias</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterPlan} onChange={(e) => { setFilterPlan(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">Todos los planes</option>
          <option value="basic">Básico</option>
          <option value="featured">Destacado</option>
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="pending_review">Propuesta de usuario</option>
          <option value="pending_payment">Pago pendiente</option>
          <option value="inactive">Inactivo</option>
          <option value="expired">Caducado</option>
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">Todos los tipos</option>
          {CENTER_FILTER_OPTIONS_ES.filter((o) => o.slug).map((o) => (
            <option key={o.slug} value={o.slug}>{o.label}</option>
          ))}
        </select>
        <select value={filterDesc} onChange={(e) => { setFilterDesc(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">Descripción: todas</option>
          <option value="yes">Con descripción</option>
          <option value="no">Sin descripción</option>
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

      {/* Tabla */}
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] w-14">Img</th>
                <ThSortable label="Centro" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThSortable label="Ciudad" sortKey="city" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThSortable label="Provincia" sortKey="province" current={sortKey} dir={sortDir} onSort={handleSort} align="left" />
                <ThSortable label="Plan" sortKey="plan" current={sortKey} dir={sortDir} onSort={handleSort} align="center" />
                <ThSortable label="Tipo" sortKey="type" current={sortKey} dir={sortDir} onSort={handleSort} align="left" />
                <ThSortable label="Estado" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} align="center" />
                <ThSortable label="MRR" sortKey="mrr" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                <ThSortable label="Desc" sortKey="desc" current={sortKey} dir={sortDir} onSort={handleSort} align="center" />
                <th className="py-3 px-4 w-36"></th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#999]">
                    {hasFilters ? 'No hay centros que coincidan con los filtros.' : 'No hay centros en la base de datos.'}
                  </td>
                </tr>
              ) : (
                pageData.map((c) => {
                  const imgSrc = getMainImage(c);
                  return (
                    <tr key={c.id} className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                      <td className="py-2 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-sand-100 shrink-0">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-[#bbb]">—</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium max-w-[240px] truncate">{c.name}</td>
                      <td className="py-3 px-4 text-[#7a6b5d]">{c.city}</td>
                      <td className="py-3 px-4 text-[#7a6b5d]">{c.province}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.plan === 'featured' ? 'bg-amber-100 text-amber-700' : 'bg-sand-200 text-[#7a6b5d]'}`}>
                          {c.plan === 'featured' ? 'Destacado' : 'Básico'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7a6b5d]">
                        {c.type ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-50 text-sage-700">{getCenterTypeLabel(c.type)}</span> : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          c.status === 'active'
                            ? 'bg-sage-100 text-sage-700'
                            : c.status === 'pending_review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-600'
                        }`}>
                          {exportStatusLabel(c.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{getMRR(c)}€</td>
                      <td className="py-3 px-4 text-center">
                        {hasDesc(c) ? (
                          <span className="text-sage-600 text-xs">✓</span>
                        ) : (
                          <span className="text-amber-500 text-xs">✗</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/administrator/centros/${c.id}`}
                            title="Editar centro"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                          >
                            <Pencil size={15} />
                          </Link>
                          {c.status === 'active' ? (
                            <a
                              href={`/es/centro/${c.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver ficha pública"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sage-600 hover:bg-sage-50 transition-colors"
                            >
                              <ExternalLink size={15} />
                            </a>
                          ) : (
                            <span
                              title="Ficha pública solo cuando el centro está activo"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#ddd] cursor-not-allowed"
                            >
                              <ExternalLink size={15} />
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleStatus(c)}
                            disabled={toggling === c.id}
                            title={
                              c.status === 'pending_review'
                                ? 'Aprobar propuesta y publicar'
                                : c.status === 'active'
                                  ? 'Despublicar'
                                  : 'Publicar'
                            }
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 ${
                              c.status === 'active'
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-sage-500 hover:text-sage-700 hover:bg-sage-50'
                            }`}
                          >
                            {c.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            disabled={deleting === c.id}
                            title="Eliminar centro"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
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
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 3) pages.push(-1);
  pages.push(total - 1);
  return pages;
}
