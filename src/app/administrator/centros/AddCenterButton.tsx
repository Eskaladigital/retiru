'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddCenterFromMapsModal } from '@/components/centers/AddCenterFromMapsModal';

export function AddCenterButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
      >
        + Añadir centro
      </button>
      <AddCenterFromMapsModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => router.refresh()}
        variant="admin"
      />
    </>
  );
}
