'use client';

import { useState } from 'react';

interface InterestStats {
  category: string;
  total_votes: number;
  avg_interest: number;
  level_1: number;
  level_2: number;
  level_3: number;
  level_4: number;
  level_5: number;
}

interface Comment {
  category: string;
  comment: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'esterillas-yoga': 'Esterillas de yoga',
  'cojines-meditacion': 'Cojines de meditación',
  'bloques-yoga': 'Bloques y props de yoga',
  'ropa-deportiva': 'Ropa deportiva y yoga',
  'termos-botellas': 'Termos y botellas',
  'incienso-velas': 'Incienso y velas',
  'aceites-esenciales': 'Aceites esenciales',
  'libros-mindfulness': 'Libros de mindfulness y bienestar',
  'mantas-bolsters': 'Mantas y bolsters',
  'joyeria-espiritual': 'Joyería y accesorios espirituales',
};

export function SurveyResultsClient({
  stats,
  comments,
}: {
  stats: InterestStats[];
  comments: Comment[];
}) {
  const [showComments, setShowComments] = useState(false);

  const totalResponses = stats.reduce((sum, s) => sum + s.total_votes, 0);

  const topCategories = [...stats].sort((a, b) => b.avg_interest - a.avg_interest).slice(0, 5);
  const worstCategories = [...stats].sort((a, b) => a.avg_interest - b.avg_interest).slice(0, 5);

  const exportToCSV = () => {
    const headers = ['Categoría', 'Votos', 'Media', 'Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Nivel 5'];
    const rows = stats.map(s => [
      CATEGORY_LABELS[s.category] || s.category,
      s.total_votes,
      s.avg_interest.toFixed(2),
      s.level_1,
      s.level_2,
      s.level_3,
      s.level_4,
      s.level_5,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      'Comentarios',
      'Categoría,Comentario,Fecha',
      ...comments.map(c => `"${CATEGORY_LABELS[c.category] || c.category}","${c.comment.replace(/"/g, '""')}","${c.created_at}"`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `encuesta-productos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div className="bg-white border border-sand-200 rounded-2xl p-5">
            <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Total respuestas</p>
            <p className="text-3xl font-bold mt-1">{totalResponses}</p>
          </div>
          <div className="bg-white border border-sand-200 rounded-2xl p-5">
            <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Categorías evaluadas</p>
            <p className="text-3xl font-bold mt-1">{stats.length}</p>
          </div>
          <div className="bg-white border border-sand-200 rounded-2xl p-5">
            <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Comentarios</p>
            <p className="text-3xl font-bold mt-1">{comments.length}</p>
          </div>
        </div>
        {stats.length > 0 && (
          <button
            type="button"
            onClick={exportToCSV}
            className="ml-4 bg-sage-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sage-700 transition-colors whitespace-nowrap"
            title="Exportar resultados a CSV"
          >
            📊 Exportar CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Top 5 - Mayor interés
          </h3>
          <div className="space-y-3">
            {topCategories.map((s, idx) => (
              <div key={s.category} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-terracotta-600 w-8">{idx + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{CATEGORY_LABELS[s.category] || s.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-sand-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-terracotta-600 h-full transition-all duration-500"
                        style={{ width: `${(s.avg_interest / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#7a6b5d] w-12 text-right">
                      {s.avg_interest.toFixed(1)}/5
                    </span>
                  </div>
                  <p className="text-xs text-[#a09383] mt-1">{s.total_votes} votos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">❄️</span>
            Menor interés
          </h3>
          <div className="space-y-3">
            {worstCategories.map((s, idx) => (
              <div key={s.category} className="flex items-center gap-3">
                <span className="text-lg font-semibold text-[#a09383] w-8">{idx + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{CATEGORY_LABELS[s.category] || s.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-sand-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sand-400 h-full transition-all duration-500"
                        style={{ width: `${(s.avg_interest / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#7a6b5d] w-12 text-right">
                      {s.avg_interest.toFixed(1)}/5
                    </span>
                  </div>
                  <p className="text-xs text-[#a09383] mt-1">{s.total_votes} votos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-200">
          <h3 className="font-serif text-lg">Desglose completo por categoría</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Categoría</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Votos</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Media</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Nivel 1</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Nivel 2</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Nivel 3</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Nivel 4</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Nivel 5</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#a09383]">
                    Aún no hay respuestas
                  </td>
                </tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.category} className="border-b border-sand-100 hover:bg-sand-50/50">
                    <td className="py-3 px-4 font-medium">
                      {CATEGORY_LABELS[s.category] || s.category}
                    </td>
                    <td className="py-3 px-4 text-center">{s.total_votes}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-terracotta-600">
                        {s.avg_interest.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#a09383]">{s.level_1}</td>
                    <td className="py-3 px-4 text-center text-[#a09383]">{s.level_2}</td>
                    <td className="py-3 px-4 text-center text-[#a09383]">{s.level_3}</td>
                    <td className="py-3 px-4 text-center text-[#a09383]">{s.level_4}</td>
                    <td className="py-3 px-4 text-center text-terracotta-600 font-semibold">
                      {s.level_5}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="w-full px-6 py-4 border-b border-sand-200 flex items-center justify-between hover:bg-sand-50 transition-colors"
          >
            <h3 className="font-serif text-lg">Comentarios de usuarios ({comments.length})</h3>
            <span className="text-2xl">{showComments ? '▲' : '▼'}</span>
          </button>
          {showComments && (
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {comments.map((c, idx) => (
                <div key={idx} className="bg-sand-50 rounded-xl p-4 border border-sand-100">
                  <p className="text-sm text-foreground leading-relaxed mb-2">{c.comment}</p>
                  <div className="flex items-center gap-3 text-xs text-[#a09383]">
                    <span className="font-semibold">
                      {CATEGORY_LABELS[c.category] || c.category}
                    </span>
                    <span>•</span>
                    <span>{new Date(c.created_at).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
