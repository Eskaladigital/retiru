// /es/panel/resenas — Reseñas del organizador
const REVIEWS = [
  { name: 'Laura M.', event: 'Retiro Yoga Ibiza', date: 'May 2025', rating: 5, text: 'Una experiencia increíble. Los instructores son maravillosos.', replied: true },
  { name: 'Javier P.', event: 'Retiro Yoga Ibiza', date: 'Abr 2025', rating: 5, text: 'Superó todas mis expectativas. Volveré seguro.', replied: false },
  { name: 'Sarah K.', event: 'Retiro de meditación', date: 'Mar 2025', rating: 4, text: 'Great retreat! Only wish it was a bit longer.', replied: false },
];
export default function ResenasPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Reseñas</h1>
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-1"><svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span className="text-xl font-bold">4.8</span></div>
        <span className="text-sm text-[#7a6b5d]">{REVIEWS.length} reseñas</span>
        <span className="text-sm text-[#a09383]">·</span>
        <span className="text-sm text-amber-600">{REVIEWS.filter(r => !r.replied).length} sin responder</span>
      </div>
      <div className="space-y-4">
        {REVIEWS.map((r, i) => (
          <div key={i} className="bg-white border border-sand-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">{r.name[0]}</div>
                <div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-[#a09383]">{r.event} · {r.date}</p></div>
              </div>
              <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <svg key={j} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
            </div>
            <p className="text-sm text-[#7a6b5d] leading-relaxed mb-3">{r.text}</p>
            {r.replied ? <p className="text-xs text-sage-600 font-medium">✓ Respondida</p> :
            <button className="text-sm font-medium text-terracotta-600 hover:underline">Responder públicamente</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
