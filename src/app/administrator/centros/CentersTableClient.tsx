'use client';

import Link from 'next/link';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export type CenterRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  plan: string;
  status: string;
  price_monthly?: number;
  description_es?: string | null;
  cover_url?: string | null;
  images?: string[];
};

function getMainImage(c: CenterRow): string {
  return c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
}

function exportCSV(list: CenterRow[]) {
  const headers = ['Imagen', 'Centro', 'Slug', 'Ciudad', 'Provincia', 'Plan', 'Estado', 'MRR', 'Descripción'];
  const rows = list.map((c) => [
    getMainImage(c) || '',
    c.name,
    c.slug,
    c.city || '',
    c.province || '',
    c.plan === 'featured' ? 'Destacado' : 'Básico',
    c.status === 'active' ? 'Activo' : 'Pago pendiente',
    c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0,
    c.description_es?.trim() && c.description_es.trim().length >= 80 ? 'Sí' : 'No',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `centros-retiru-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(list: CenterRow[]) {
  const data = list.map((c) => ({
    Imagen: getMainImage(c) || '',
    Centro: c.name,
    Slug: c.slug,
    Ciudad: c.city || '',
    Provincia: c.province || '',
    Plan: c.plan === 'featured' ? 'Destacado' : 'Básico',
    Estado: c.status === 'active' ? 'Activo' : 'Pago pendiente',
    MRR: c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0,
    'Tiene descripción': c.description_es?.trim() && c.description_es.trim().length >= 80 ? 'Sí' : 'No',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Centros');
  XLSX.writeFile(wb, `centros-retiru-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function CentersTableClient({ list }: { list: CenterRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => exportCSV(list)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-sand-200 text-sm font-medium text-[#7a6b5d] hover:bg-sand-50 transition-colors"
        >
          <Download size={16} />
          Exportar CSV
        </button>
        <button
          onClick={() => exportExcel(list)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-sand-200 text-sm font-medium text-[#7a6b5d] hover:bg-sand-50 transition-colors"
        >
          <FileSpreadsheet size={16} />
          Exportar Excel
        </button>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50">
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] w-16">Imagen</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Centro</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Ciudad</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Plan</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">MRR</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Descripción</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#7a6b5d]">
                  No hay centros en la base de datos.
                </td>
              </tr>
            ) : (
              list.map((c) => {
                const imgSrc = getMainImage(c);
                return (
                  <tr key={c.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                    <td className="py-2 px-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-sand-100 shrink-0">
                        {imgSrc ? (
                          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#a09383]">Sin img</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-[#7a6b5d]">{c.city}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          c.plan === 'featured' ? 'bg-amber-100 text-amber-700' : 'bg-sand-200 text-[#7a6b5d]'
                        }`}
                      >
                        {c.plan === 'featured' ? '⭐ Destacado' : 'Básico'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          c.status === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {c.status === 'active' ? 'Activo' : 'Pago pendiente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0}€
                    </td>
                    <td className="py-3 px-4">
                      {c.description_es?.trim() && c.description_es.trim().length >= 80 ? (
                        <span className="text-sage-600 text-xs">✓</span>
                      ) : (
                        <span className="text-amber-600 text-xs">Sin descripción</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/administrator/centros/${c.id}`} className="text-xs font-semibold text-terracotta-600 hover:underline">Editar</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
