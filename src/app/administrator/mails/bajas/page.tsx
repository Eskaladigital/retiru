// /administrator/mails/bajas — Lista de emails dados de baja (email_suppressions)
import Link from 'next/link';
import { createAdminSupabase } from '@/lib/supabase/server';
import { SuppressionsClient, type SuppressionRow } from './SuppressionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminMailsBajasPage() {
  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from('email_suppressions')
    .select('id, email, reason, source, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = (data || []) as SuppressionRow[];

  return (
    <div className="pt-2">
      <div className="mb-6">
        <Link href="/administrator/mails" className="text-sm text-sage-700 hover:underline">
          ← Volver al CRM de campañas
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Bajas de marketing</h1>
          <p className="text-sm text-[#7a6b5d] max-w-2xl">
            Emails que han retirado el consentimiento (formulario público, respuesta automática o alta manual).
            Cualquier email de esta lista queda excluido de todos los envíos, incluso si aparece asociado a un nuevo centro en el futuro.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 px-5 py-4 text-sm mb-6">
          <p className="font-semibold mb-1">No se pudo cargar la lista</p>
          <p className="font-mono text-xs break-all opacity-90">{error.message}</p>
          <p className="mt-2 text-[#7a6b5d]">
            Si la tabla <code className="bg-white/80 px-1 rounded">email_suppressions</code> no existe, aplica la migración 041 en Supabase.
          </p>
        </div>
      )}

      {!error && <SuppressionsClient initialRows={rows} />}
    </div>
  );
}
