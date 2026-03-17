'use client';

import { useState, useEffect } from 'react';
import { Download, Search } from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  events: number;
  totalSpent: number;
  lastEvent: string;
  lastDate: string;
}

export default function AsistentesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/organizer/attendees')
      .then((r) => r.json())
      .then((data) => setAttendees(data.attendees || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? attendees.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      )
    : attendees;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Asistentes</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {loading ? 'Cargando...' : `${attendees.length} asistente${attendees.length !== 1 ? 's' : ''} en total`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09383]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-sand-300 text-sm outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#7a6b5d]">Cargando asistentes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-[#7a6b5d]">{search ? 'No se encontraron resultados' : 'Aún no tienes asistentes'}</p>
        </div>
      ) : (
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Retiros</th>
                <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden lg:table-cell">Último retiro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700 shrink-0">
                        {a.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{a.name}</p>
                        {a.events > 1 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sage-100 text-sage-700">Repetidor</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{a.email}</td>
                  <td className="py-3 px-4 text-center">{a.events}</td>
                  <td className="py-3 px-4 text-right font-semibold">{a.totalSpent.toLocaleString()}€</td>
                  <td className="py-3 px-4 text-[#7a6b5d] text-xs hidden lg:table-cell">{a.lastEvent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
