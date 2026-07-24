'use client';

import { useState } from 'react';
import Image from 'next/image';

type Props = {
  name: string;
  images: string[];
  /** Etiqueta accesible del botón miniatura (ES/EN). */
  thumbLabel?: (index: number) => string;
};

export function CenterPhotoGallery({ name, images, thumbLabel }: Props) {
  const urls = images.filter((u, i, arr) => !!u && arr.indexOf(u) === i);
  const [active, setActive] = useState(0);

  if (!urls.length) return null;

  const hero = urls[Math.min(active, urls.length - 1)];
  const label = thumbLabel ?? ((i: number) => `Ver foto ${i + 1}`);

  return (
    <div className="mb-4 space-y-3">
      <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden relative bg-sand-100">
        <Image
          key={hero}
          src={hero}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover animate-in fade-in duration-300"
        />
      </div>
      {urls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1" role="list">
          {urls.map((img, i) => {
            const selected = i === active;
            return (
              <button
                key={img}
                type="button"
                role="listitem"
                onClick={() => setActive(i)}
                aria-label={label(i)}
                aria-pressed={selected}
                className={`relative w-32 h-24 rounded-xl overflow-hidden shrink-0 bg-sand-100 transition ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 ${
                  selected ? 'ring-2 ring-terracotta-500 opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`${name} — ${i + 1}`}
                  fill
                  sizes="128px"
                  loading="lazy"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
