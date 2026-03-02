// /es/organizador/[slug] — Perfil público del organizador
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOrganizerBySlug, getOrganizerSlugs } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';

export async function generateStaticParams() {
  const slugs = await getOrganizerSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function OrganizadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const organizer = await getOrganizerBySlug(slug);
  if (!organizer) notFound();

  const supabase = await createServerSupabase();
  const { data: retreats } = await supabase
    .from('retreats')
    .select('id, title_es, slug, total_price, start_date, end_date, duration_days, avg_rating, review_count, retreat_images(url, is_cover)')
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')
    .order('start_date');

  const retreatList = retreats || [];

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="container-wide py-12">
      {/* Header organizador */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
        {organizer.logo_url ? (
          <Image
            src={organizer.logo_url}
            alt={organizer.business_name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <div className="w-24 h-24 bg-sage-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-sage-700 font-serif shrink-0">
            {organizer.business_name[0]}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-3xl text-foreground">{organizer.business_name}</h1>
            {organizer.status === 'verified' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">✓ Verificado</span>}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#7a6b5d] mb-4">
            {organizer.location && <span>📍 {organizer.location}</span>}
            <span>⭐ {organizer.avg_rating?.toFixed(1) ?? '–'} ({organizer.review_count ?? 0} reseñas)</span>
            <span>📅 {organizer.total_retreats ?? retreatList.length} retiros publicados</span>
            {organizer.languages?.length > 0 && <span>🌐 {organizer.languages.join(', ')}</span>}
          </div>
          {organizer.description_es && (
            <p className="text-[15px] text-[#7a6b5d] leading-[1.7] max-w-2xl">{organizer.description_es}</p>
          )}
          {(organizer.website || organizer.instagram) && (
            <div className="flex gap-4 mt-3 text-sm">
              {organizer.website && (
                <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="text-sage-700 hover:underline">
                  🔗 Web
                </a>
              )}
              {organizer.instagram && (
                <a href={`https://instagram.com/${organizer.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sage-700 hover:underline">
                  📸 Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Retiros del organizador */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl mb-6">Retiros de {organizer.business_name}</h2>
        {retreatList.length === 0 ? (
          <p className="text-[#7a6b5d]">Este organizador aún no tiene retiros publicados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {retreatList.map((r: Record<string, unknown>) => {
              const images = r.retreat_images as { url: string; is_cover: boolean }[] | null;
              const cover = images?.find((i) => i.is_cover) ?? images?.[0];
              return (
                <Link key={r.id as string} href={`/es/retiro/${r.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
                  <div className="aspect-[16/10] overflow-hidden bg-sand-100">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={r.title_es as string}
                        width={600}
                        height={375}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#a09383] text-sm">Sin imagen</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg leading-[1.3] mb-2">{r.title_es as string}</h3>
                    <p className="text-sm text-[#7a6b5d] mb-3">
                      📅 {fmt(r.start_date as string)}–{fmt(r.end_date as string)} · {r.duration_days as number} días
                      {(r.avg_rating as number | null) != null && <> · ⭐ {(r.avg_rating as number).toFixed(1)} ({r.review_count as number})</>}
                    </p>
                    <div className="pt-3 border-t border-sand-200">
                      <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span>
                      <span className="ml-2 text-xl font-bold">{r.total_price as number}€</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Reseñas */}
      <section>
        <h2 className="font-serif text-2xl mb-6">Reseñas</h2>
        <div className="bg-white border border-sand-200 rounded-2xl p-8 text-center">
          <p className="text-[#7a6b5d]">Aún no hay reseñas para este organizador.</p>
        </div>
      </section>
    </div>
  );
}
