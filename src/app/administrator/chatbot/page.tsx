'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ResponseQuality } from '@/lib/chatbot/config';
import { renderChatMarkdown } from '@/lib/chatbot/markdown';

type QualityStats = Record<ResponseQuality, number>;

type MessageRow = {
  id: string;
  content: string;
  response_quality: ResponseQuality;
  admin_notes: string | null;
  created_at: string;
  conversation_id: string;
  user_question: string;
  chatbot_conversations?: { language: string; session_id: string };
};

type ConversationRow = {
  id: string;
  session_id: string;
  language: string;
  status: string;
  last_message_at: string;
  contact_name: string | null;
  assistant_count: number;
  unclassified_responses: number;
  classified_responses: number;
  quality_score: number | null;
  first_user_message: string;
};

const QUALITY_LABELS: Record<ResponseQuality, string> = {
  correcta: 'Correcta',
  mejorable: 'Mejorable',
  incorrecta: 'Incorrecta',
  sin_tipo: 'Sin clasificar',
};

const QUALITY_COLORS: Record<ResponseQuality, string> = {
  correcta: 'bg-green-100 text-green-800',
  mejorable: 'bg-amber-100 text-amber-800',
  incorrecta: 'bg-red-100 text-red-800',
  sin_tipo: 'bg-sand-100 text-[#7a6b5d]',
};

const EMPTY_STATS: QualityStats = { correcta: 0, mejorable: 0, incorrecta: 0, sin_tipo: 0 };

function ScoreBadge({
  score,
  classified,
  pending,
}: {
  score: number | null;
  classified: number;
  pending: number;
}) {
  if (score === null) {
    return (
      <span className="text-xs text-[#a09383]" title="Aún no hay respuestas clasificadas">
        Sin valorar{pending > 0 ? ` (${pending})` : ''}
      </span>
    );
  }
  const color =
    score >= 7
      ? 'bg-green-100 text-green-800'
      : score >= 4
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}
      title={`Media de ${classified} respuesta(s)${pending > 0 ? ` · ${pending} sin clasificar` : ''}`}
    >
      {score.toFixed(1)}/10
      {pending > 0 && <span className="font-normal opacity-70">·{pending}</span>}
    </span>
  );
}

function QualityDonut({ stats }: { stats: QualityStats }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
  const entries: ResponseQuality[] = ['correcta', 'mejorable', 'incorrecta', 'sin_tipo'];
  let offset = 0;
  const colors: Record<ResponseQuality, string> = {
    correcta: '#22c55e',
    mejorable: '#f59e0b',
    incorrecta: '#ef4444',
    sin_tipo: '#c4b5a5',
  };
  const segments = entries.map((q) => {
    const pct = (stats[q] / total) * 100;
    const seg = `${colors[q]} ${offset}% ${offset + pct}%`;
    offset += pct;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="w-24 h-24 rounded-full shrink-0" style={{ background: `conic-gradient(${segments.join(', ')})` }} />
      <div className="text-sm space-y-1">
        {entries.map((q) => (
          <div key={q} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: colors[q] }} />
            <span>{QUALITY_LABELS[q]}: {stats[q]}</span>
          </div>
        ))}
        <p className="text-[#a09383] text-xs mt-2">Total respuestas: {Object.values(stats).reduce((a, b) => a + b, 0)}</p>
      </div>
    </div>
  );
}

export default function AdminChatbotRoyPage() {
  const [tab, setTab] = useState<'responses' | 'conversations'>('responses');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [stats, setStats] = useState<QualityStats>(EMPTY_STATS);
  const [filterQuality, setFilterQuality] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [notes, setNotes] = useState('');
  const [quality, setQuality] = useState<ResponseQuality>('sin_tipo');
  const [loading, setLoading] = useState(false);
  const [detailConv, setDetailConv] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<
    { id: string; role: string; content: string; response_quality?: string }[]
  >([]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterQuality) params.set('quality', filterQuality);
    if (search.trim()) params.set('q', search.trim());
    const res = await fetch(`/api/admin/chatbot/messages?${params}`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages ?? []);
      if (data.qualityStats) setStats(data.qualityStats);
    }
    setLoading(false);
  }, [filterQuality, search]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/chatbot?limit=100');
    const data = await res.json();
    if (res.ok) {
      setConversations(data.conversations ?? []);
      if (data.stats?.byQuality) setStats(data.stats.byQuality);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'responses') loadMessages();
    else loadConversations();
  }, [tab, loadMessages, loadConversations]);

  const openDetail = (row: MessageRow) => {
    setSelected(row);
    setNotes(row.admin_notes ?? '');
    setQuality(row.response_quality);
  };

  const saveClassification = async () => {
    if (!selected) return;
    const res = await fetch(`/api/admin/chatbot/messages/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_quality: quality, admin_notes: notes }),
    });
    if (res.ok) {
      setSelected(null);
      loadMessages();
    }
  };

  const loadConvDetail = async (id: string) => {
    setDetailConv(id);
    const res = await fetch(`/api/admin/chatbot/${id}`);
    const data = await res.json();
    if (res.ok) setConvMessages(data.messages ?? []);
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Roy</h1>
      <p className="text-sm text-[#7a6b5d] mb-6">
        Se califican las <strong>respuestas</strong> de Roy (una a una). La nota de cada conversación es la media: correcta 10, mejorable 5, incorrecta 0. Mensajes (sidebar) es el chat humano, no este.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('responses')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === 'responses' ? 'bg-terracotta-600 text-white' : 'bg-white border border-sand-200 text-[#7a6b5d]'
          }`}
        >
          Respuestas
        </button>
        <button
          type="button"
          onClick={() => setTab('conversations')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === 'conversations' ? 'bg-terracotta-600 text-white' : 'bg-white border border-sand-200 text-[#7a6b5d]'
          }`}
        >
          Conversaciones
        </button>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg mb-4">Calidad de respuestas</h2>
        <QualityDonut stats={stats} />
      </div>

      {tab === 'responses' && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas las calidades</option>
              {(Object.keys(QUALITY_LABELS) as ResponseQuality[]).map((q) => (
                <option key={q} value={q}>{QUALITY_LABELS[q]}</option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en respuestas…"
              className="rounded-xl border border-sand-200 px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <button
              type="button"
              onClick={loadMessages}
              className="px-4 py-2 bg-terracotta-600 text-white rounded-xl text-sm font-medium"
            >
              Filtrar
            </button>
          </div>

          <div className="rounded-2xl border border-sand-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Pregunta</th>
                  <th className="px-4 py-3 font-medium">Respuesta</th>
                  <th className="px-4 py-3 font-medium">Calidad</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#a09383]">Cargando…</td></tr>
                ) : messages.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#a09383]">Aún no hay respuestas de Roy</td></tr>
                ) : (
                  messages.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-sand-100 hover:bg-sand-50 cursor-pointer"
                      onClick={() => openDetail(m)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-[#7a6b5d]">
                        {new Date(m.created_at).toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{m.user_question}</td>
                      <td className="px-4 py-3 max-w-[280px] truncate">{m.content}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${QUALITY_COLORS[m.response_quality]}`}>
                          {QUALITY_LABELS[m.response_quality]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'conversations' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-sand-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand-50">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Primer mensaje</th>
                  <th className="px-4 py-3 text-center">Resp.</th>
                  <th className="px-4 py-3 text-center">Nota</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#a09383]">Cargando…</td></tr>
                ) : conversations.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#a09383]">Sin conversaciones</td></tr>
                ) : (
                  conversations.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-t border-sand-100 cursor-pointer hover:bg-sand-50 ${detailConv === c.id ? 'bg-terracotta-50' : ''}`}
                      onClick={() => loadConvDetail(c.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-[#7a6b5d]">
                        {new Date(c.last_message_at).toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate">
                        {c.contact_name ? `${c.contact_name}: ` : ''}
                        {c.first_user_message || `${c.session_id.slice(0, 12)}…`}
                      </td>
                      <td className="px-4 py-3 text-center text-[#7a6b5d]">{c.assistant_count}</td>
                      <td className="px-4 py-3 text-center">
                        <ScoreBadge
                          score={c.quality_score}
                          classified={c.classified_responses}
                          pending={c.unclassified_responses}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {detailConv && (
            <div className="rounded-2xl border border-sand-200 bg-white p-4 space-y-3 max-h-[500px] overflow-y-auto">
              <p className="text-xs text-[#a09383]">Hilo de la conversación. La calidad se marca en cada respuesta, no en el hilo.</p>
              {convMessages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl p-3 text-sm ${
                    m.role === 'user' ? 'bg-terracotta-50 ml-8' : 'bg-sand-50 mr-8'
                  }`}
                >
                  <p className="text-xs text-[#a09383] mb-1">{m.role === 'user' ? 'Visitante' : 'Roy'}</p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.role === 'assistant' && m.response_quality && (
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${QUALITY_COLORS[m.response_quality as ResponseQuality] ?? ''}`}>
                      {QUALITY_LABELS[m.response_quality as ResponseQuality] ?? m.response_quality}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 p-6 pb-4">
              <h3 className="font-serif text-lg">Clasificar respuesta</h3>
              <button type="button" onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-sand-100" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-[#a09383] mb-1">Pregunta</p>
              <div className="text-sm mb-4 rounded-2xl bg-terracotta-50 px-3.5 py-2.5 leading-relaxed">{selected.user_question}</div>
              <p className="text-sm text-[#a09383] mb-1">Roy</p>
              <div className="text-sm mb-4 rounded-2xl border border-sand-200 px-3.5 py-2.5 leading-relaxed chat-markdown">
                <div dangerouslySetInnerHTML={{ __html: renderChatMarkdown(selected.content) }} />
              </div>
              <label className="block text-sm font-medium mb-2">Calidad</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as ResponseQuality)}
                className="w-full rounded-xl border border-sand-200 px-3 py-2 mb-4"
              >
                {(Object.keys(QUALITY_LABELS) as ResponseQuality[]).map((q) => (
                  <option key={q} value={q}>{QUALITY_LABELS[q]}</option>
                ))}
              </select>
              <label className="block text-sm font-medium mb-2">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-sand-200 px-3 py-2 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-[#7a6b5d]">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveClassification}
                  className="px-4 py-2 bg-terracotta-600 text-white rounded-xl text-sm font-medium"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
