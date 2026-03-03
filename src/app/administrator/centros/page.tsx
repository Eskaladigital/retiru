// /administrator/centros — Gestión de centros (admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import { GenerateDescriptionsButton } from './GenerateDescriptionsButton';
import { CentersTableClient, type CenterRow } from './CentersTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminCentrosPage() {
  const supabase = createAdminSupabase();
  const { data: centers } = await supabase
    .from('centers')
    .select('id, name, slug, city, province, plan, status, price_monthly, created_at, description_es, cover_url, images')
    .order('name')
    .limit(5000);

  const list = (centers || []) as CenterRow[];
  const totalMRR = list.reduce((s: number, c) => s + (c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0), 0);
  const sinDescripcion = list.filter((c) => !c.description_es || c.description_es.trim().length < 80);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
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

      <CentersTableClient list={list} />
    </div>
  );
}
