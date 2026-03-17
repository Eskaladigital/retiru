'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

export default function PaymentSuccessBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-2xl bg-sage-50 border border-sage-200 p-5 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-600 text-white">
        <Check size={18} />
      </div>
      <div>
        <p className="font-semibold text-sage-800">¡Pago realizado con éxito!</p>
        <p className="text-sm text-sage-600 mt-0.5">
          Tu plaza ha sido reservada. Recibirás un email de confirmación en breve.
        </p>
      </div>
    </div>
  );
}
