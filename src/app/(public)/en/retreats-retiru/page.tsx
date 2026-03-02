// /en/retreats-retiru — Retreats & getaways: search engine
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { categoriesEN } from '@/lib/seo/page-metadata';
import { getPublishedRetreats, getCategories, getDestinations } from '@/lib/data';

export const metadata: Metadata = categoriesEN;

import EventsClientEN from './EventsClient';

export default async function CategoriesPageEN() {
  const [{ retreats }, categories, destinations] = await Promise.all([
    getPublishedRetreats({ limit: 50 }),
    getCategories('en'),
    getDestinations('en'),
  ]);

  return (
    <>
      <section className="relative min-h-[70vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80"
            alt="Yoga and meditation retreat"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] md:via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-12 md:py-16">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-700 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-sage-400 rounded-full" />
              +{retreats.length} retreats in Spain
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,56px)] leading-[1.2] tracking-[-0.01em] text-foreground mb-5">
              Retreats &amp; getaways
            </h1>
            <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[480px]">
              Discover yoga, meditation, nature, gastronomy retreats and much more across Spain.
            </p>
          </div>
        </div>
      </section>

      <Suspense>
        <EventsClientEN retreats={retreats} categories={categories} destinations={destinations} />
      </Suspense>
    </>
  );
}
