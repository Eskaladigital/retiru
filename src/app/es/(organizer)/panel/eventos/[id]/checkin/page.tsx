// /es/panel/eventos/[id]/checkin — Check-in con QR
import Link from 'next/link';
const ATTENDEES = [
  { id: '1', name: 'María García', checkedIn: true, time: '09:15' },
  { id: '2', name: 'Carlos López', checkedIn: true, time: '09:22' },
  { id: '3', name: 'Anna Schmidt', checkedIn: false, time: null },
];
export default function CheckinPage({ params }: { params: { id: string } }) {
  const checkedCount = ATTENDEES.filter(a => a.checkedIn).length;
  return (
    <div>
      <Link href={`/es/panel/eventos/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium mb-6">← Volver al retiro</Link>
      <h1 className="font-serif text-2xl text-foreground mb-2">Check-in</h1>
      <p className="text-sm text-[#7a6b5d] mb-6">{checkedCount} de {ATTENDEES.length} asistentes han hecho check-in</p>

      {/* Progress */}
      <div className="h-3 bg-sand-200 rounded-full overflow-hidden mb-8"><div className="h-full bg-sage-500 rounded-full" style={{ width: `${(checkedCount / ATTENDEES.length) * 100}%` }} /></div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6 text-center">
        <p className="text-sm text-[#7a6b5d] mb-3">Escanea el QR del asistente o márcalo manualmente</p>
        <button className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">📷 Escanear QR</button>
      </div>

      <div className="space-y-2">
        {ATTENDEES.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-white border border-sand-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${a.checkedIn ? 'bg-sage-100 text-sage-700' : 'bg-sand-200 text-[#a09383]'}`}>{a.checkedIn ? '✓' : '—'}</span>
              <span className="text-sm font-medium">{a.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {a.time && <span className="text-xs text-[#a09383]">{a.time}</span>}
              {!a.checkedIn && <button className="text-xs font-semibold text-terracotta-600 hover:underline">Marcar</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
