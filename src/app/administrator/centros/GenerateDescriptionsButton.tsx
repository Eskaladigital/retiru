'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface LogEntry {
  type: 'info' | 'start' | 'detail' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

export function GenerateDescriptionsButton() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [limit, setLimit] = useState(30); // Por defecto 30 por lote (~5-7 min) para evitar timeout
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<{ processed: number; ok: number; errors: number } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const handleGenerate = async () => {
    setRunning(true);
    setLogs([]);
    setSummary(null);

    addLog({ type: 'info', message: '⏳ Conectando con el servidor...', timestamp: new Date() });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/admin/generate-center-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: limit > 0 ? limit : 0 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === 'log') {
              addLog({ ...data, timestamp: new Date() });
            } else if (currentEvent === 'done') {
              setSummary(data);
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        addLog({ type: 'error', message: `❌ Error: ${(err as Error).message}`, timestamp: new Date() });
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const handleClose = () => {
    if (running && abortRef.current) {
      abortRef.current.abort();
    }
    setOpen(false);
    setRunning(false);
    setLogs([]);
    setSummary(null);
  };

  const handleOpen = () => {
    setOpen(true);
    setLogs([]);
    setSummary(null);
  };

  const logColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'start': return 'text-amber-300 font-semibold';
      case 'info': return 'text-blue-300 font-semibold';
      default: return 'text-gray-300';
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 bg-sage-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sage-700 transition-colors"
      >
        <span>✨</span> Generando con IA...
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!running ? handleClose : undefined} />

          {/* Modal */}
          <div className="relative w-full max-w-3xl bg-[#1e1e2e] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-lg">✨</span>
                <div>
                  <h2 className="text-white font-semibold text-base">Generador de descripciones con IA</h2>
                  <p className="text-gray-400 text-xs mt-0.5">SerpAPI + Google Maps + GPT-4o-mini</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Logs area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed min-h-[300px]">
              {logs.length === 0 && !running && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                  <p className="text-sm">Pulsa "Iniciar" para generar descripciones enriquecidas</p>
                  <p className="text-xs text-gray-600">Se procesarán centros sin descripción (&lt; 400 caracteres)</p>
                  <p className="text-xs text-amber-500/80">Por lote para evitar timeout. Ejecuta varias veces hasta completar todos.</p>
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className={`${logColor(log.type)} whitespace-pre-wrap`}>
                  <span className="text-gray-600 text-[11px] mr-2">
                    {log.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Summary bar */}
            {summary && (
              <div className="px-6 py-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-300">
                    Procesados: <strong className="text-white">{summary.processed}</strong>
                  </span>
                  <span className="text-emerald-400">
                    OK: <strong>{summary.ok}</strong>
                  </span>
                  {summary.errors > 0 && (
                    <span className="text-red-400">
                      Errores: <strong>{summary.errors}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              {!running && !summary && (
                <>
                  <div className="flex items-center gap-2 mr-auto">
                    <label className="text-gray-400 text-sm">Límite por lote:</label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm border border-white/20"
                    >
                      <option value={10}>10 centros</option>
                      <option value={20}>20 centros</option>
                      <option value={30}>30 centros</option>
                      <option value={50}>50 centros</option>
                      <option value={100}>100 centros</option>
                      <option value={0}>Todos (puede dar timeout)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="bg-sage-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-sage-700 transition-colors"
                  >
                    Iniciar generación
                  </button>
                </>
              )}
              {running && (
                <div className="flex items-center gap-3">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-gray-300 text-sm">Procesando...</span>
                </div>
              )}
              {summary && (
                <button
                  onClick={handleClose}
                  className="bg-white/10 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
