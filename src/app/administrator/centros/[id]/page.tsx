// /administrator/centros/[id] — Editar centro (admin puede editar cualquier centro)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminSupabase } from '@/lib/supabase/server';
import { EditarCentroForm } from '@/app/(public)/es/(dashboard)/mis-centros/[id]/EditarCentroForm';

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditarCentroPage({ params }: Props) {
  const { id } = await params;

  const admin = createAdminSupabase();

  const { data: center } = await admin
    .from('centers')
    .select(`
      id, name, slug, description_es, description_en, type,
      cover_url, images, logo_url,
      website, email, phone, instagram, facebook,
      address, city, province, postal_code,
      services_es, services_en,
      schedule_summary_es, schedule_summary_en,
      price_range_es, price_range_en,
      google_place_id, google_types, google_maps_url, google_status,
      region, country, web_valid_ia, quality_ia, search_terms, price_level,
      claimed_by, status
    `)
    .eq('id', id)
    .single();

  if (!center) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/administrator/centros" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Centros
      </Link>
      <h1 className="font-serif text-3xl text-foreground mb-2">Editar centro</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        Como administrador puedes editar cualquier centro, lo haya reclamado un usuario o no.
      </p>

      <EditarCentroForm center={center} />
    </div>
  );
}
