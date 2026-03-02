// /administrator/centros — Gestión de centros (admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import type { Center } from '@/types';
import { GenerateDescriptionsButton } from './GenerateDescriptionsButton';

type CenterRow = Pick<Center, 'id' | 'name' | 'slug' | 'city' | 'province' | 'plan' | 'status' | 'description_es'> & {
  price_monthly?: number;
  created_at: string;
};

export default async function AdminCentrosPage() {
  const supabase = createAdminSupabase();
  const { data: centers } = await supabase
    .from('centers')
    .select('id, name, slug, city, province, plan, status, price_monthly, created_at, description_es')
    .order('name');

  const list = (centers || []) as CenterRow[];
  const totalMRR = list.reduce((s: number, c) => s + (c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0), 0);
  const sinDescripcion = list.filter((c) => !c.description_es || c.description_es.trim().length < 80);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Centros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} centros · MRR: {totalMRR}€/mes
            {sinDescripcion.length > 0 && (
              <span className="ml-2 text-amber-600">· {sinDescripcion.length} sin descripción</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GenerateDescriptionsButton />
          <button className="bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors">
            ➕ Añadir centro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">MRR Centros</p>
          <p className="text-2xl font-bold mt-1">{totalMRR}€</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Centros activos</p>
          <p className="text-2xl font-bold mt-1">{list.filter((c) => c.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Sin descripción</p>
          <p className="text-2xl font-bold mt-1">{sinDescripcion.length}</p>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>          <tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Centro</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Ciudad</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Plan</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">MRR</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Descripción</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7a6b5d]">No hay centros en la base de datos.</td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-[#7a6b5d]">{c.city}</td>
                  <td className="py-3 px-4 text-center"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.plan === 'featured' ? 'bg-amber-100 text-amber-700' : 'bg-sand-200 text-[#7a6b5d]'}`}>{c.plan === 'featured' ? '⭐ Destacado' : 'Básico'}</span></td>
                  <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-600'}`}>{c.status === 'active' ? 'Activo' : 'Pago pendiente'}</span></td>
                  <td className="py-3 px-4 text-right font-semibold">{c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0}€</td>
                  <td className="py-3 px-4">{c.description_es?.trim() && c.description_es.trim().length >= 80 ? <span className="text-sage-600 text-xs">✓</span> : <span className="text-amber-600 text-xs">Sin descripción</span>}</td>
                  <td className="py-3 px-4 text-right"><button className="text-xs font-semibold text-terracotta-600 hover:underline">Editar</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
