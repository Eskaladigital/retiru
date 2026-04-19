'use client';

// ============================================================================
// RETIRU · Admin · Detalle de campaña de mail
//
// Cuatro pestañas:
//   1. Contenido — botón "Generar con IA" (SSE) + iframe del HTML
//   2. Preview   — iframe con datos reales + botón "Enviar test"
//   3. Audiencia — seleccionar y cargar destinatarios
//   4. Envío     — Play/Pausa/Reanudar, progreso y destinatarios por status
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type CampaignFull = {
  id: string;
  slug: string;
  number: number | null;
  subject: string;
  description: string | null;
  status: 'draft' | 'sending' | 'sent' | 'archived';
  is_paused: boolean;
  max_per_hour: number;
  batch_size_per_tick: number;
  audience_filter: Record<string, unknown> | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  recipients: number;
  pending: number;
  sent: number;
  failed: number;
  skipped_opt_out: number;
  has_html: boolean;
  html_content: string | null;
  generation_prompt: string | null;
  generation_reference_ids: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_tick_at: string | null;
  last_tick_note: string | null;
};

type Tab = 'contenido' | 'preview' | 'audiencia' | 'envio';

type Reference = {
  id: string;
  slug: string;
  subject: string;
  number: number | null;
  status: string;
  created_at: string;
};

type Center = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
};

type Recipient = {
  id: string;
  email: string;
  nombre_centro: string | null;
  location: string | null;
  status: string;
  failed_reason: string | null;
  sent_at: string | null;
  updated_at: string;
};

export function CampaignDetailClient({ initial }: { initial: CampaignFull }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignFull>(initial);
  const [tab, setTab] = useState<Tab>(initial.has_html ? 'preview' : 'contenido');

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
    }
  }, [campaign.slug]);

  // Auto-refresh mientras la campaña está enviando, para ver el progreso live.
  useEffect(() => {
    if (campaign.status !== 'sending') return;
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [campaign.status, refresh]);

  return (
    <div>
      <Header campaign={campaign} onRefresh={refresh} />

      <div className="flex gap-1 border-b border-sand-200 mb-6 overflow-x-auto">
        {[
          { id: 'contenido' as Tab, label: 'Contenido' },
          { id: 'preview' as Tab, label: 'Vista previa' },
          { id: 'audiencia' as Tab, label: 'Audiencia' },
          { id: 'envio' as Tab, label: 'Envío' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-terracotta-600 text-terracotta-700'
                : 'border-transparent text-[#7a6b5d] hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'contenido' && <TabContenido campaign={campaign} onChange={refresh} router={router} />}
      {tab === 'preview' && <TabPreview campaign={campaign} />}
      {tab === 'audiencia' && <TabAudiencia campaign={campaign} onChange={refresh} />}
      {tab === 'envio' && <TabEnvio campaign={campaign} onChange={refresh} />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Cabecera fija: nombre + estado + métricas rápidas
// ───────────────────────────────────────────────────────────────────────────

function Header({ campaign, onRefresh }: { campaign: CampaignFull; onRefresh: () => void }) {
  const pct = campaign.total_recipients > 0 ? Math.round((campaign.sent / campaign.total_recipients) * 100) : 0;
  const badge = statusBadge(campaign);
  const editable = campaign.status !== 'archived';

  async function patchField(field: 'subject' | 'description', value: string) {
    const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || 'No se pudo guardar');
    }
    onRefresh();
  }

  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            {campaign.number !== null && (
              <span className="text-xs text-[#a09383] font-mono">#{campaign.number}</span>
            )}
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
              {badge.label}
            </span>
            {!editable && (
              <span className="text-xs text-[#a09383] italic">
                · archivada (no editable)
              </span>
            )}
          </div>
          <EditableText
            value={campaign.subject}
            onSave={(v) => patchField('subject', v)}
            editable={editable}
            placeholder="Asunto del email…"
            className="font-serif text-2xl text-foreground"
            ariaLabel="Asunto del email"
          />
          <div className="mt-2">
            <EditableText
              value={campaign.description || ''}
              onSave={(v) => patchField('description', v)}
              editable={editable}
              multiline
              placeholder="Añade una descripción interna (para qué es esta campaña, a quién va dirigida, objetivo…). Sirve también de contexto para la IA."
              className="text-sm text-[#7a6b5d]"
              ariaLabel="Descripción interna"
            />
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-sage-700 hover:underline shrink-0"
        >
          Refrescar
        </button>
      </div>

      {campaign.total_recipients > 0 && (
        <div className="mt-4 pt-4 border-t border-sand-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-1.5 rounded-full bg-sand-100 overflow-hidden">
              <div className="h-full bg-sage-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-mono text-[#7a6b5d]">{pct}%</span>
          </div>
          <div className="flex gap-4 text-xs text-[#7a6b5d] flex-wrap">
            <span><strong className="text-foreground">{campaign.sent}</strong> enviados</span>
            <span><strong className="text-foreground">{campaign.pending}</strong> pendientes</span>
            {campaign.failed > 0 && <span className="text-red-600"><strong>{campaign.failed}</strong> fallidos</span>}
            {campaign.skipped_opt_out > 0 && <span><strong>{campaign.skipped_opt_out}</strong> opt-out</span>}
            <span>de <strong className="text-foreground">{campaign.total_recipients}</strong></span>
          </div>
          {campaign.last_tick_note && (
            <p className="text-xs text-[#a09383] mt-2 italic">
              Último tick: {campaign.last_tick_note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Texto que en hover muestra "✎" y al click se transforma en input/textarea con
// Guardar/Cancelar. Usado para editar subject y description desde el header.
function EditableText({
  value,
  onSave,
  multiline,
  placeholder,
  className,
  editable = true,
  ariaLabel,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  async function save() {
    const trimmed = draft.trim();
    if (trimmed === (value || '').trim()) {
      setEditing(false);
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    setDraft(value);
    setError(null);
  }

  if (!editable) {
    return (
      <span className={`${className} ${value ? '' : 'text-[#a09383] italic'}`}>
        {value || placeholder || '—'}
      </span>
    );
  }

  if (editing) {
    if (multiline) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancel();
            }}
            rows={3}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 min-h-[80px]"
            maxLength={1000}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <EditActions saving={saving} onSave={save} onCancel={cancel} hint="Esc cancela" />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save();
            }
            if (e.key === 'Escape') cancel();
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={`w-full rounded-xl border border-sand-200 bg-cream-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-400 ${className ?? ''}`}
          maxLength={200}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <EditActions saving={saving} onSave={save} onCancel={cancel} hint="Enter guarda · Esc cancela" />
      </div>
    );
  }

  const isEmpty = !value || !value.trim();
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click para editar"
      aria-label={ariaLabel ? `${ariaLabel} (click para editar)` : 'Editar'}
      className={`group block w-full text-left cursor-text rounded-md -mx-1 px-1 py-0.5 hover:bg-cream-100 transition-colors ${className ?? ''}`}
    >
      <span className={`inline-flex items-start gap-2 ${isEmpty ? 'text-[#a09383] italic font-normal text-sm' : ''}`}>
        <span className={multiline ? 'line-clamp-3' : 'line-clamp-2'}>
          {isEmpty ? placeholder || 'Click para añadir…' : value}
        </span>
        <span className="text-xs opacity-0 group-hover:opacity-60 mt-1 shrink-0 not-italic font-normal" aria-hidden>
          ✎
        </span>
      </span>
    </button>
  );
}

function EditActions({
  saving,
  onSave,
  onCancel,
  hint,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 transition-colors"
      >
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-full bg-white border border-sand-200 hover:bg-cream-50 text-[#7a6b5d] text-xs font-semibold px-4 py-1.5 transition-colors"
      >
        Cancelar
      </button>
      {hint && <span className="text-[10px] text-[#a09383] ml-1">{hint}</span>}
    </div>
  );
}

function statusBadge(c: CampaignFull): { label: string; classes: string } {
  if (c.is_paused && c.status === 'sending') {
    return { label: 'Pausada', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  switch (c.status) {
    case 'draft': return { label: 'Borrador', classes: 'bg-sand-100 text-[#7a6b5d] border-sand-200' };
    case 'sending': return { label: 'Enviando', classes: 'bg-sage-50 text-sage-700 border-sage-200' };
    case 'sent': return { label: 'Enviada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'archived': return { label: 'Archivada', classes: 'bg-[#f3eee8] text-[#7a6b5d] border-sand-200' };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Tab 1 · Contenido (IA)
// ───────────────────────────────────────────────────────────────────────────

function TabContenido({
  campaign,
  onChange,
  router,
}: {
  campaign: CampaignFull;
  onChange: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>(campaign.generation_reference_ids || []);
  const [prompt, setPrompt] = useState<string>(campaign.generation_prompt || '');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/admin/mailing/references')
      .then((r) => r.json())
      .then((data) => setRefs((data.references || []).filter((r: Reference) => r.id !== campaign.id)))
      .catch(() => setRefs([]));
  }, [campaign.id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function toggleRef(id: string) {
    setSelectedRefs((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function generate() {
    if (!prompt.trim()) {
      setLogs((l) => [...l, { type: 'error', message: 'Escribe primero qué debe decir el mail.' }]);
      return;
    }
    setRunning(true);
    setLogs([]);
    try {
      const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), referenceCampaignIds: selectedRefs }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '');
        setLogs((l) => [...l, { type: 'error', message: `HTTP ${res.status}: ${txt || res.statusText}` }]);
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const ev of events) {
          const lines = ev.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event:'));
          const dataLine = lines.find((l) => l.startsWith('data:'));
          if (!eventLine || !dataLine) continue;
          const type = eventLine.slice(6).trim();
          try {
            const data = JSON.parse(dataLine.slice(5).trim());
            if (type === 'log') setLogs((l) => [...l, { type: data.type, message: data.message }]);
            if (type === 'done') {
              if (data.ok) {
                setLogs((l) => [...l, { type: 'success', message: `Listo. Ve a Vista previa para comprobarlo.` }]);
                onChange();
                router.refresh();
              }
            }
          } catch {/* ignore JSON parse */}
        }
      }
    } catch (e) {
      setLogs((l) => [...l, { type: 'error', message: (e as Error).message || String(e) }]);
    } finally {
      setRunning(false);
    }
  }

  const disabled = campaign.status === 'archived' || campaign.status === 'sent';

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <h2 className="font-serif text-lg text-foreground mb-1">Generar mail con IA</h2>
          <p className="text-sm text-[#7a6b5d] mb-4">
            Describe qué debe transmitir el mail. La IA generará el HTML completo partiendo del diseño de 1–3 campañas que elijas como referencia.
          </p>

          <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="ia-prompt">
            Briefing para la IA
          </label>
          <textarea
            id="ia-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Recuérdale al centro que tiene 6 meses gratuitos desde su inclusión, que active su ficha cuanto antes, tono cercano y empático…"
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 min-h-[140px] mb-4"
            disabled={disabled || running}
            maxLength={3000}
          />

          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Diseños de referencia <span className="text-xs text-[#a09383] font-normal">(hasta 3)</span>
          </label>
          <div className="border border-sand-200 rounded-xl bg-cream-50 max-h-48 overflow-y-auto divide-y divide-sand-100">
            {refs.length === 0 && (
              <p className="text-xs text-[#a09383] p-3">
                Todavía no hay otras campañas con HTML. Crea la primera a partir de un briefing solo.
              </p>
            )}
            {refs.map((r) => {
              const checked = selectedRefs.includes(r.id);
              const atLimit = !checked && selectedRefs.length >= 3;
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                    atLimit ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={atLimit || disabled || running}
                    onChange={() => toggleRef(r.id)}
                    className="mt-0.5 accent-terracotta-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground line-clamp-1">{r.subject}</div>
                    <div className="text-xs text-[#a09383] font-mono">{r.slug}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            onClick={generate}
            disabled={disabled || running || !prompt.trim()}
            className="mt-5 w-full rounded-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 transition-colors"
          >
            {running ? 'Generando…' : campaign.has_html ? 'Regenerar con IA' : 'Generar con IA'}
          </button>
          {disabled && (
            <p className="text-xs text-[#a09383] mt-2">
              Las campañas enviadas o archivadas no se pueden regenerar.
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#111] text-[#c9e4d1] rounded-2xl p-5 font-mono text-xs overflow-y-auto max-h-[600px] min-h-[400px]">
        {logs.length === 0 ? (
          <p className="text-[#6b7c72]">La consola de la IA aparecerá aquí cuando generes.</p>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'error' ? 'text-red-300' :
                l.type === 'warn' ? 'text-amber-300' :
                l.type === 'success' ? 'text-emerald-300' :
                l.type === 'detail' ? 'text-[#8ea79a]' :
                'text-[#c9e4d1]'
              }
            >
              {l.message}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Tab 2 · Vista previa (iframe + envío de test)
// ───────────────────────────────────────────────────────────────────────────

function TabPreview({ campaign }: { campaign: CampaignFull }) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [centerSlug, setCenterSlug] = useState<string>('');
  const [searchQ, setSearchQ] = useState('');
  const [testTo, setTestTo] = useState('contacto@retiru.com');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState<string>('');

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/admin/mailing/centers-search?q=${encodeURIComponent(searchQ)}`)
        .then((r) => r.json())
        .then((data) => setCenters(data.centers || []))
        .catch(() => setCenters([]));
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ]);

  const previewUrl = useMemo(() => {
    const qs = centerSlug ? `?centerSlug=${encodeURIComponent(centerSlug)}&t=${Date.now()}` : `?t=${Date.now()}`;
    return `/api/admin/mailing/campaigns/${campaign.slug}/preview${qs}`;
  }, [campaign.slug, centerSlug]);

  async function sendTest() {
    setTestStatus('sending');
    setTestMsg('');
    try {
      const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo.trim(), centerSlug: centerSlug || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestStatus('error');
        setTestMsg(data.error || 'Error enviando test');
      } else {
        setTestStatus('ok');
        setTestMsg(`Enviado a ${data.to}. messageId: ${data.messageId || '(n/a)'}`);
      }
    } catch (e) {
      setTestStatus('error');
      setTestMsg((e as Error).message || String(e));
    }
  }

  if (!campaign.has_html) {
    return (
      <div className="bg-white border border-sand-200 rounded-2xl p-10 text-center">
        <p className="font-serif text-xl text-foreground mb-2">Aún no hay HTML</p>
        <p className="text-sm text-[#7a6b5d]">Ve a la pestaña Contenido y pulsa «Generar con IA».</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <iframe
          key={previewUrl}
          src={previewUrl}
          className="w-full h-[calc(100vh-280px)] min-h-[600px] bg-white"
          title="Vista previa"
        />
      </div>

      <div className="space-y-5">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <h3 className="font-serif text-base text-foreground mb-3">Datos para el render</h3>
          <label className="block text-xs font-semibold text-[#7a6b5d] mb-1">Buscar centro</label>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Ej: yoga, Madrid, Mahashakti…"
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 mb-2"
          />
          <select
            value={centerSlug}
            onChange={(e) => setCenterSlug(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          >
            <option value="">— Datos genéricos —</option>
            {centers.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} {c.city ? `· ${c.city}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#a09383] mt-2">
            El preview usa los datos reales del centro (nombre, ciudad, fecha de inclusión → {'{{FIN_MEMBRESIA}}'}).
          </p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <h3 className="font-serif text-base text-foreground mb-3">Enviar test real</h3>
          <label className="block text-xs font-semibold text-[#7a6b5d] mb-1">Destinatario</label>
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            className="w-full rounded-xl border border-sand-200 bg-cream-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 mb-3"
          />
          <button
            onClick={sendTest}
            disabled={testStatus === 'sending' || !testTo.trim()}
            className="w-full rounded-full bg-sage-600 hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            {testStatus === 'sending' ? 'Enviando…' : 'Enviar test por SMTP'}
          </button>
          {testStatus === 'ok' && (
            <p className="text-xs text-emerald-700 mt-2 break-all">{testMsg}</p>
          )}
          {testStatus === 'error' && (
            <p className="text-xs text-red-700 mt-2 break-all">{testMsg}</p>
          )}
          <p className="text-xs text-[#a09383] mt-3">
            El correo sale por el SMTP configurado (OVH Zimbra) con el asunto prefijado con [TEST].
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Tab 3 · Audiencia
// ───────────────────────────────────────────────────────────────────────────

function TabAudiencia({ campaign, onChange }: { campaign: CampaignFull; onChange: () => void }) {
  const af = (campaign.audience_filter || {}) as { audience?: string };
  const [audience, setAudience] = useState<string>(af.audience || 'not_claimed');
  const [maxPerHour, setMaxPerHour] = useState<number>(campaign.max_per_hour);
  const [batchSize, setBatchSize] = useState<number>(campaign.batch_size_per_tick);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lockedAudience = campaign.status !== 'draft';

  async function saveSettings() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_per_hour: maxPerHour, batch_size_per_tick: batchSize }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No se pudo guardar'); }
      else { onChange(); setResult('Ajustes guardados.'); }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function populate() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}/populate-recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error cargando audiencia'); }
      else {
        setResult(
          `Candidatos: ${data.candidates} · opt-out: ${data.skippedOptOut} · fuera de audiencia: ${data.skippedAudience} · ` +
          `ya estaban: ${data.skippedDuplicates} · insertados: ${data.inserted} · total pending: ${data.total}`
        );
        onChange();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const hourlyEstimate = Math.min(maxPerHour, batchSize * 60);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white border border-sand-200 rounded-2xl p-5">
        <h2 className="font-serif text-lg text-foreground mb-4">Seleccionar destinatarios</h2>

        <label className="block text-sm font-semibold text-foreground mb-2">Audiencia</label>
        <div className="space-y-2 mb-5">
          {[
            { id: 'all', label: 'Todos los centros activos', hint: 'Excluye automáticamente quien haya marcado opt-out.' },
            { id: 'not_claimed', label: 'Centros sin reclamar', hint: 'Ideal para recordatorios de activación.' },
            { id: 'claimed', label: 'Centros ya reclamados', hint: 'Para comunicaciones al administrador del centro.' },
          ].map((o) => (
            <label
              key={o.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                audience === o.id ? 'border-terracotta-500 bg-terracotta-50/50' : 'border-sand-200 bg-cream-50 hover:bg-white'
              } ${lockedAudience ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="audience"
                value={o.id}
                checked={audience === o.id}
                onChange={() => setAudience(o.id)}
                disabled={lockedAudience}
                className="mt-1 accent-terracotta-600"
              />
              <div>
                <div className="text-sm font-medium text-foreground">{o.label}</div>
                <div className="text-xs text-[#7a6b5d]">{o.hint}</div>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={populate}
          disabled={lockedAudience || running}
          className="w-full rounded-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          {running ? 'Cargando…' : campaign.total_recipients > 0 ? 'Recargar destinatarios' : 'Cargar destinatarios'}
        </button>
        {lockedAudience && (
          <p className="text-xs text-[#a09383] mt-2">
            No se puede cambiar la audiencia una vez iniciada la campaña.
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-xl border border-sage-200 bg-sage-50 text-sage-800 px-4 py-3 text-xs">
            {result}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-5">
        <h2 className="font-serif text-lg text-foreground mb-4">Ritmo de envío</h2>

        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Tope por hora: <span className="text-terracotta-700">{maxPerHour}</span>
        </label>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={maxPerHour}
          onChange={(e) => setMaxPerHour(Number(e.target.value))}
          className="w-full accent-terracotta-600 mb-1"
        />
        <p className="text-xs text-[#a09383] mb-4">
          OVH Zimbra ronda 200/h. Conservador: 150.
        </p>

        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Correos por tick (cada minuto): <span className="text-terracotta-700">{batchSize}</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="w-full accent-terracotta-600 mb-1"
        />
        <p className="text-xs text-[#a09383] mb-4">
          El cron arranca cada minuto. Con {batchSize} correos/min → {batchSize * 60}/h teóricos, topado a {maxPerHour}/h.
        </p>

        <div className="rounded-xl border border-sand-200 bg-cream-50 px-4 py-3 text-xs text-[#7a6b5d] mb-4">
          <strong className="text-foreground">Ritmo efectivo:</strong> ~{hourlyEstimate}/hora ·
          {campaign.total_recipients > 0 && (
            <>
              {' '}tiempo estimado para {campaign.total_recipients} destinatarios:
              <strong className="text-foreground"> ≈ {formatDuration(campaign.total_recipients / hourlyEstimate)}</strong>
            </>
          )}
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full rounded-full bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar ritmo'}
        </button>
      </div>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  const mins = Math.round(hours * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// ───────────────────────────────────────────────────────────────────────────
// Tab 4 · Envío
// ───────────────────────────────────────────────────────────────────────────

function TabEnvio({ campaign, onChange }: { campaign: CampaignFull; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('pending');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  const loadRecipients = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}/recipients?status=${filter}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        setRecipients(data.recipients || []);
        setTotalFiltered(data.total || 0);
      }
    } finally {
      setLoadingList(false);
    }
  }, [campaign.slug, filter]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  // Refresh automático si está enviando.
  useEffect(() => {
    if (campaign.status !== 'sending') return;
    const t = setInterval(loadRecipients, 15_000);
    return () => clearInterval(t);
  }, [campaign.status, loadRecipients]);

  async function action(endpoint: string, label: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/admin/mailing/campaigns/${campaign.slug}/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); }
      else { onChange(); loadRecipients(); }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const hasHtml = campaign.has_html;
  const hasRecipients = campaign.total_recipients > 0;
  const canStart = campaign.status === 'draft' && hasHtml && hasRecipients;
  const isSending = campaign.status === 'sending' && !campaign.is_paused;
  const isPaused = campaign.status === 'sending' && campaign.is_paused;
  const canArchive = campaign.status !== 'archived';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-sand-200 rounded-2xl p-5">
        <div className="flex flex-wrap gap-3 items-center">
          {canStart && (
            <button
              onClick={() => action('start', 'start', `¿Lanzar la campaña a ${campaign.total_recipients} destinatarios?`)}
              disabled={busy !== null}
              className="rounded-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              {busy === 'start' ? 'Lanzando…' : '▶  Lanzar campaña'}
            </button>
          )}
          {isSending && (
            <button
              onClick={() => action('pause', 'pause')}
              disabled={busy !== null}
              className="rounded-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              {busy === 'pause' ? 'Pausando…' : 'Pausar'}
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => action('resume', 'resume')}
              disabled={busy !== null}
              className="rounded-full bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              {busy === 'resume' ? 'Reanudando…' : '▶  Reanudar'}
            </button>
          )}
          {campaign.failed > 0 && campaign.status !== 'archived' && (
            <button
              onClick={() => action('retry-failed', 'retry-failed', `¿Reintentar ${campaign.failed} fallidos?`)}
              disabled={busy !== null}
              className="rounded-full bg-white border border-sand-300 hover:bg-cream-50 text-[#7a6b5d] text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Reintentar fallidos ({campaign.failed})
            </button>
          )}
          {canArchive && campaign.status !== 'draft' && (
            <button
              onClick={() => action('archive', 'archive', '¿Archivar esta campaña? No se podrá volver a editar.')}
              disabled={busy !== null}
              className="rounded-full bg-white border border-sand-300 hover:bg-cream-50 text-[#7a6b5d] text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Archivar
            </button>
          )}
        </div>

        {!canStart && campaign.status === 'draft' && (
          <p className="text-sm text-amber-700 mt-4">
            Para lanzar necesitas: {hasHtml ? null : <span>generar el HTML con la IA · </span>}
            {hasRecipients ? null : <span>cargar la audiencia en la pestaña Audiencia.</span>}
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap gap-2 p-4 border-b border-sand-100">
          {[
            { id: 'pending', label: `Pendientes (${campaign.pending})` },
            { id: 'sent', label: `Enviados (${campaign.sent})` },
            { id: 'failed', label: `Fallidos (${campaign.failed})` },
            { id: 'skipped_opt_out', label: `Opt-out (${campaign.skipped_opt_out})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? 'bg-terracotta-100 text-terracotta-700'
                  : 'bg-cream-50 text-[#7a6b5d] hover:bg-sand-100'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto text-xs text-[#a09383] self-center">
            {loadingList ? 'Cargando…' : `${recipients.length} de ${totalFiltered}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 border-b border-sand-200 text-xs text-[#7a6b5d]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Email</th>
                <th className="text-left px-4 py-2 font-semibold">Centro</th>
                <th className="text-left px-4 py-2 font-semibold">Actualizado</th>
                {filter === 'failed' && <th className="text-left px-4 py-2 font-semibold">Motivo</th>}
                {filter === 'sent' && <th className="text-left px-4 py-2 font-semibold">Enviado</th>}
              </tr>
            </thead>
            <tbody>
              {recipients.length === 0 && !loadingList && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#a09383]">
                    Sin filas en este estado.
                  </td>
                </tr>
              )}
              {recipients.map((r) => (
                <tr key={r.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{r.email}</td>
                  <td className="px-4 py-2 text-xs">
                    <div className="text-foreground">{r.nombre_centro || '—'}</div>
                    {r.location && <div className="text-[#a09383]">{r.location}</div>}
                  </td>
                  <td className="px-4 py-2 text-xs text-[#7a6b5d] whitespace-nowrap">
                    {new Date(r.updated_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  {filter === 'failed' && (
                    <td className="px-4 py-2 text-xs text-red-700 max-w-[320px] truncate" title={r.failed_reason || ''}>
                      {r.failed_reason || '—'}
                    </td>
                  )}
                  {filter === 'sent' && (
                    <td className="px-4 py-2 text-xs text-[#7a6b5d] whitespace-nowrap">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
