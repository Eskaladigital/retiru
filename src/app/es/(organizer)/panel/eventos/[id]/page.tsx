// /es/panel/eventos/[id] — Editar retiro
import Link from 'next/link';
export default function EditarEventoPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-3xl">
      <Link href="/es/panel/eventos" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium mb-6">← Mis retiros</Link>
      <h1 className="font-serif text-3xl text-foreground mb-2">Editar retiro</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">ID: {params.id} — Modifica la información y guarda los cambios. Si el retiro ya está publicado, los cambios se aplican inmediatamente.</p>
      <div className="bg-white border border-sand-200 rounded-2xl p-8 text-center text-sm text-[#7a6b5d]">
        <p>El formulario de edición carga los datos del retiro desde Supabase.</p>
        <p className="mt-2">Misma estructura que el wizard de creación, pero con campos prerrellenados.</p>
        <div className="flex gap-3 justify-center mt-6">
          <Link href={`/es/panel/eventos/${params.id}/reservas`} className="text-sm font-medium text-terracotta-600 hover:underline">Ver reservas</Link>
          <Link href={`/es/panel/eventos/${params.id}/checkin`} className="text-sm font-medium text-terracotta-600 hover:underline">Check-in</Link>
        </div>
      </div>
    </div>
  );
}
