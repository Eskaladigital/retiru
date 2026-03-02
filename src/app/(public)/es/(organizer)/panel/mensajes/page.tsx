// /es/panel/mensajes — Mensajería organizador
const CHATS = [
  { id: '1', name: 'María García', event: 'Retiro Yoga Ibiza', lastMsg: '¿Puedo traer mi propia esterilla?', time: 'Hace 30min', unread: true },
  { id: '2', name: 'Carlos López', event: 'Retiro Yoga Ibiza', lastMsg: 'Perfecto, llego el día 14 por la tarde.', time: 'Hace 2h', unread: false },
  { id: '3', name: 'Anna Schmidt', event: 'Wellness Retreat', lastMsg: 'Do you have a vegan menu option?', time: 'Ayer', unread: true },
];
export default function MensajesOrgPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Mensajes</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{CHATS.filter(c => c.unread).length} mensajes sin leer</p>
      <div className="space-y-2">
        {CHATS.map((c) => (
          <div key={c.id} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-soft ${c.unread ? 'bg-terracotta-50/50 border-terracotta-200' : 'bg-white border-sand-200'}`}>
            <div className="w-11 h-11 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700 shrink-0">{c.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between"><h3 className={`text-sm ${c.unread ? 'font-bold' : 'font-semibold'}`}>{c.name}</h3><span className="text-xs text-[#a09383]">{c.time}</span></div>
              <p className="text-xs text-[#a09383] mb-0.5">{c.event}</p>
              <p className="text-sm text-[#7a6b5d] truncate">{c.lastMsg}</p>
            </div>
            {c.unread && <span className="w-2.5 h-2.5 bg-terracotta-500 rounded-full shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
