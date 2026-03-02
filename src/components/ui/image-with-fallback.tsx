'use client';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackEmoji?: string;
  fallbackSize?: 'sm' | 'md' | 'lg';
}

export function ImageWithFallback({ src, alt, className, fallbackEmoji = '🖼️', fallbackSize = 'lg' }: ImageWithFallbackProps) {
  const sizeClass = fallbackSize === 'sm' ? 'text-5xl' : fallbackSize === 'md' ? 'text-6xl' : 'text-7xl';
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
      <div className="hidden absolute inset-0 bg-sage-100 flex items-center justify-center">
        <span className={sizeClass}>{fallbackEmoji}</span>
      </div>
    </>
  );
}
