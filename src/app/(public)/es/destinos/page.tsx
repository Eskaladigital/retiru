// /es/destinos — Lista de destinos (Supabase)
import type { Metadata } from 'next';
import Link from 'next/link';
import { destinationsES } from '@/lib/seo/page-metadata';
import { getDestinations } from '@/lib/data';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

export const metadata: Metadata = destinationsES;

const DEST_IMAGES: Record<string, string> = {
  ibiza: 'https://images.unsplash.com/photo-1534766555764-ce878a4e947d?w=600&q=80',
  mallorca: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'costa-brava': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'sierra-gredos': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
  alpujarra: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
  'picos-europa': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'valle-jerte': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  lanzarote: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  pirineos: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  murcia: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80',
  formentera: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  'cabo-de-gata': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
};

export default async function DestinosPage() {
  const destinations = await getDestinations('es');

  return (
    <div className="container-wide py-12">
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Destinos</h1>
      <p className="text-[#7a6b5d] mb-10 max-w-lg">Los rincones más especiales de España para tu próximo retiro</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {destinations.map((d) => {
          const img = d.cover_image_url || DEST_IMAGES[d.slug] || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80';
          const desc = d.description_es || d.description_en || '';
          return (
            <Link key={d.id} href={`/es/destinos/${d.slug}`} className="group rounded-2xl overflow-hidden relative cursor-pointer hover:-translate-y-1 transition-transform duration-300">
              <div className="aspect-[4/3] relative">
                <ImageWithFallback src={img} alt={d.name_es} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"  />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.7)] to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="font-serif text-xl text-white">{d.name_es}</h2>
                  {d.region && <p className="text-[13px] text-white/80 mt-0.5">{d.region}</p>}
                </div>
              </div>
              <div className="bg-white border border-t-0 border-sand-200 rounded-b-2xl p-4">
                <p className="text-sm text-[#7a6b5d] line-clamp-2">{desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
