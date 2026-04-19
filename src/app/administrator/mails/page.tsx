// /administrator/mails — Listado del CRM de mails
import Link from 'next/link';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CampaignStats = {
  id: string;
  slug: string;
  number: number | null;
  subject: string;
  description: string | null;
  status: 'draft' | 'sending' | 'sent' | 'archived';
  is_paused: boolean;
  max_per_hour: number;
  batch_size_per_tick: number;
  total_recipients: number;
  recipients: number;
  pending: number;
  sent: number;
  failed: number;
  skipped_opt_out: number;
  has_html: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_tick_at: string | null;
  last_tick_note: string | null;
};

function statusBadge(c: CampaignStats) {
  if (c.is_paused && c.status === 'sending') {
    return { label: 'Pausada', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  switch (c.status) {
    case 'draft':
      return { label: 'Borrador', classes: 'bg-sand-100 text-[#7a6b5d] border-sand-200' };
    case 'sending':
      return { label: 'Enviando', classes: 'bg-sage-50 text-sage-700 border-sage-200' };
    case 'sent':
      return { label: 'Completada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'archived':
      return { label: 'Archivada', classes: 'bg-[#f3eee8] text-[#7a6b5d] border-sand-200' };
  }
}

function formatDateEs(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function AdminMailsPage() {
  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from('mailing_campaigns_stats')
    .select('*')
    .order('created_at', { ascending: false });

  const campaigns = (data || []) as CampaignStats[];

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Mails</h1>
          <p className="text-sm text-[#7a6b5d]">
            CRM de campañas: crea, genera con Nia, previsualiza y lanza envíos masivos sin tocar terminal.
          </p>
        </div>
        <Link
          href="/administrator/mails/nueva"
          className="rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          + Nueva campaña
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 px-5 py-4 text-sm mb-6">
          <p className="font-semibold mb-1">No se pudo cargar el listado</p>
          <p className="font-mono text-xs break-all opacity-90">{error.message}</p>
          <p className="mt-2 text-[#7a6b5d]">
            Si la tabla <code className="bg-white/80 px-1 rounded">mailing_campaigns</code> no existe, aplica las migraciones 038 y 039 en Supabase.
          </p>
        </div>
      )}

      {!error && campaigns.length === 0 && (
        <div className="bg-white border border-sand-200 rounded-2xl p-10 text-center">
          <p className="font-serif text-xl text-foreground mb-2">No hay campañas todavía</p>
          <p className="text-sm text-[#7a6b5d] mb-6">
            Crea la primera y Nia te ayudará a generar el HTML partiendo de un diseño previo.
          </p>
          <Link
            href="/administrator/mails/nueva"
            className="inline-block rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            Crear campaña
          </Link>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 border-b border-sand-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Campaña</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Progreso</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Creada</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#7a6b5d]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const badge = statusBadge(c);
                  const total = c.total_recipients || c.recipients || 0;
                  const pct = total > 0 ? Math.round((c.sent / total) * 100) : 0;
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
      )}
    </div>
  );
}
