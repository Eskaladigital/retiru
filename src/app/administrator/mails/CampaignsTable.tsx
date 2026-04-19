'use client';
// Tabla del listado de /administrator/mails con ordenación por columnas.
// Recibe los datos del server component y reordena en cliente con useMemo
// (no hace falta refetch ni query strings: caben miles de filas en memoria).

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type CampaignRow = {
  id: string;
  slug: string;
  number: number | null;
  subject: string;
  description: string | null;
  status: 'draft' | 'sending' | 'sent' | 'archived';
  is_paused: boolean;
  total_recipients: number;
  recipients: number;
  sent: number;
  failed: number;
  has_html: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type SortKey = 'number' | 'subject' | 'status' | 'progress' | 'created_at' | 'sent_at';
type SortDir = 'asc' | 'desc';

// Orden lógico por estado: las activas arriba, las cerradas abajo.
const STATUS_RANK: Record<string, number> = {
  sending_paused: 0,
  sending: 1,
  draft: 2,
  sent: 3,
  archived: 4,
};

function statusBadge(c: CampaignRow) {
  if (c.is_paused && c.status === 'sending') {
    return { label: 'Pausada', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  switch (c.status) {
    case 'draft':
      return { label: 'Borrador', classes: 'bg-sand-100 text-[#7a6b5d] border-sand-200' };
    case 'sending':
      return { label: 'Enviando', classes: 'bg-sage-50 text-sage-700 border-sage-200' };
    case 'sent':
      return { label: 'Enviada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'archived':
      return { label: 'Archivada', classes: 'bg-[#f3eee8] text-[#7a6b5d] border-sand-200' };
  }
}

function formatDateEs(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Fecha "efectiva" de envío para ordenar y mostrar:
//   - enviada/archivada → completed_at (cuándo terminó)
//   - enviando/pausada  → started_at (desde cuándo está en curso)
//   - borrador          → null
function sentAtEffective(c: CampaignRow): string | null {
  if (c.status === 'sent' || c.status === 'archived') {
    return c.completed_at || c.started_at || null;
  }
  if (c.status === 'sending') {
    return c.started_at || null;
  }
  return null;
}

function sentLabel(c: CampaignRow): { primary: string; hint?: string } {
  if (c.status === 'draft') return { primary: '—', hint: 'sin lanzar' };
  const iso = sentAtEffective(c);
  if (!iso) return { primary: '—' };
  if (c.status === 'sending') {
    return { primary: formatDateEs(iso), hint: c.is_paused ? 'pausada' : 'en curso' };
  }
  return { primary: formatDateEs(iso) };
}

function progressPct(c: CampaignRow): number {
  const total = c.total_recipients || c.recipients || 0;
  return total > 0 ? c.sent / total : 0;
}

function statusRank(c: CampaignRow): number {
  if (c.is_paused && c.status === 'sending') return STATUS_RANK.sending_paused;
  return STATUS_RANK[c.status] ?? 99;
}

function compare(a: CampaignRow, b: CampaignRow, key: SortKey): number {
  switch (key) {
    case 'number': {
      // Sin número va al final.
      const an = a.number ?? Number.POSITIVE_INFINITY;
      const bn = b.number ?? Number.POSITIVE_INFINITY;
      return an - bn;
    }
    case 'subject':
      return a.subject.localeCompare(b.subject, 'es', { sensitivity: 'base' });
    case 'status':
      return statusRank(a) - statusRank(b);
    case 'progress':
      return progressPct(a) - progressPct(b);
    case 'created_at':
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    case 'sent_at': {
      // Sin fecha de envío al final en 'asc' (o al principio en 'desc').
      const ai = sentAtEffective(a);
      const bi = sentAtEffective(b);
      if (!ai && !bi) return 0;
      if (!ai) return 1;
      if (!bi) return -1;
      return new Date(ai).getTime() - new Date(bi).getTime();
    }
  }
}

export function CampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Defaults sensatos por columna: las numéricas/fecha empiezan desc, las
      // textuales asc (alfabético natural).
      setSortDir(key === 'subject' || key === 'status' ? 'asc' : 'desc');
    }
  }

  const sorted = useMemo(() => {
    const out = [...campaigns].sort((a, b) => compare(a, b, sortKey));
    if (sortDir === 'desc') out.reverse();
    return out;
  }, [campaigns, sortKey, sortDir]);

  return (
    <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 border-b border-sand-200">
            <tr>
              <SortHeader label="#" sortKey="number" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortHeader label="Campaña" sortKey="subject" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortHeader label="Estado" sortKey="status" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortHeader label="Progreso" sortKey="progress" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortHeader label="Creada" sortKey="created_at" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortHeader label="Enviada" sortKey="sent_at" current={sortKey} dir={sortDir} onClick={onSort} />
              <th className="text-right px-4 py-3 font-semibold text-[#7a6b5d]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const badge = statusBadge(c);
              const total = c.total_recipients || c.recipients || 0;
              const pct = Math.round(progressPct(c) * 100);
              return (
                <tr key={c.id} className="border-b border-sand-100 last:border-0 hover:bg-cream-100/50">
                  <td className="px-4 py-3 font-mono text-xs text-[#a09383]">{c.number ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/administrator/mails/${c.slug}`} className="block">
                      <div className="font-medium text-foreground line-clamp-1">{c.subject}</div>
                      <div className="text-xs text-[#a09383] font-mono mt-0.5">{c.slug}</div>
                      {c.description && (
                        <div className="text-xs text-[#7a6b5d] mt-1 line-clamp-1">{c.description}</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge?.classes}`}>
                      {badge?.label}
                    </span>
                    {!c.has_html && c.status !== 'archived' && (
                      <div className="text-xs text-amber-700 mt-1">sin HTML</div>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    {total === 0 ? (
                      <span className="text-xs text-[#a09383]">sin audiencia</span>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-sand-100 overflow-hidden">
                            <div
                              className="h-full bg-sage-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#7a6b5d] font-mono whitespace-nowrap">
                            {c.sent}/{total}
                          </span>
                        </div>
                        {c.failed > 0 && (
                          <div className="text-xs text-red-600 mt-1">{c.failed} fallidos</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#7a6b5d] whitespace-nowrap">
                    {formatDateEs(c.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {(() => {
                      const s = sentLabel(c);
                      return (
                        <>
                          <div className={s.primary === '—' ? 'text-[#a09383]' : 'text-[#7a6b5d]'}>
                            {s.primary}
                          </div>
                          {s.hint && (
                            <div className="text-[10px] text-[#a09383] italic">{s.hint}</div>
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/administrator/mails/${c.slug}`}
                      className="text-sage-700 hover:text-sage-800 font-semibold text-xs"
                    >
                      Abrir →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors ${
          active ? 'text-foreground' : 'hover:text-foreground'
        }`}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span>{label}</span>
        <span className={`text-[10px] leading-none ${active ? 'opacity-100' : 'opacity-30'}`}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
