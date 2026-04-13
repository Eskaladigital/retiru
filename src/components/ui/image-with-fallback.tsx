'use client';

import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSize?: 'sm' | 'md' | 'lg';
  sizes?: string;
}

const SIZE_ICON: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackSize = 'lg',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const iconClass = SIZE_ICON[fallbackSize];

  return (
    <>
      {!error ? (
        <Image
          src={src}
          alt={alt}
          className={className}
          fill
          sizes={sizes}
          onError={() => setError(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-sage-100 flex items-center justify-center text-sage-400 ${className || ''}`} aria-hidden>
          <ImageIcon className={iconClass} strokeWidth={1.25} />
        </div>
      )}
    </>
  );
}
