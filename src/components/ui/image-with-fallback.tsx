'use client';

import { ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSize?: 'sm' | 'md' | 'lg';
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
}: ImageWithFallbackProps) {
  const iconClass = SIZE_ICON[fallbackSize];
  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden absolute inset-0 bg-sage-100 flex items-center justify-center text-sage-400" aria-hidden>
        <ImageIcon className={iconClass} strokeWidth={1.25} />
      </div>
    </>
  );
}
