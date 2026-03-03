// /es/mis-eventos/nuevo — Crear nuevo evento
import { createAdminSupabase } from '@/lib/supabase/server';
import { NuevoEventoForm } from './NuevoEventoForm';

export default async function NuevoEventoPage() {
  const admin = createAdminSupabase();

  const { data: categories } = await admin
    .from('categories')
    .select('id, name_es, slug')
    .eq('is_active', true)
    .order('name_es');

  const { data: destinations } = await admin
    .from('destinations')
    .select('id, name_es, slug')
    .eq('is_active', true)
    .order('name_es');

  return (
    <div className="max-w-3xl">
      <a href="/es/mis-eventos" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Mis eventos
      </a>
      <h1 className="font-serif text-3xl text-foreground mb-2">Nuevo evento</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Completa la información para crear tu retiro, taller o escapada.</p>

      <NuevoEventoForm
        categories={(categories || []).map((c: any) => ({ id: c.id, name: c.name_es, slug: c.slug }))}
        destinations={(destinations || []).map((d: any) => ({ id: d.id, name: d.name_es, slug: d.slug }))}
      />
    </div>
  );
}
