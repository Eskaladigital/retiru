'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > 400);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={`mobile-float-above-cta fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 border border-sand-200 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-terracotta-50 hover:border-terracotta-300 hover:shadow-xl active:scale-95 ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <ArrowUp size={18} className="text-terracotta-600" />
    </button>
  );
}
