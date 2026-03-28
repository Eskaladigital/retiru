'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddCenterFromMapsModal } from '@/components/centers/AddCenterFromMapsModal';

export function MisCentrosActions() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 border-2 border-terracotta-600 text-terracotta-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-50 transition-colors"
        >
          Proponer nuevo centro
        </button>
        <Link
          href="/es/centros-retiru"
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
        >
          Buscar para reclamar
        </Link>
      </div>
      <AddCenterFromMapsModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => router.refresh()}
        variant="user"
      />
    </>
  );
}
