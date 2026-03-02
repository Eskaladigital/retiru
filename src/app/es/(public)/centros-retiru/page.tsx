// /es/centros-retiru — Directorio de centros con motor de búsqueda
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { centersES } from '@/lib/seo/page-metadata';
import { getActiveCenters } from '@/lib/data';
export const metadata: Metadata = centersES;

import CentrosClient from './CentrosClient';
import CentrosSearch from '@/components/home/CentrosSearch';

export default async function CentrosPage() {
  const { centers } = await getActiveCenters({ limit: 50 });

  return (
    <>
      {/* Hero tipo home con buscador de centros */}
      <section className="relative min-h-[70vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=1920&q=80"
            alt="Centro de yoga y bienestar"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] md:via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-12 md:py-16">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-700 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-sage-400 rounded-full" />
              Centros verificados en toda España
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,56px)] leading-[1.2] tracking-[-0.01em] text-foreground mb-5">
              Directorio de centros
            </h1>
            <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[480px]">
              Encuentra los mejores centros de yoga, meditación, wellness y spa en toda España.
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <Suspense>
        <CentrosClient centers={centers} />
      </Suspense>
    </>
  );
}
