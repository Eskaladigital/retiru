// /administrator/mails — Listado del CRM de mails
import Link from 'next/link';
import { createAdminSupabase } from '@/lib/supabase/server';
import { CampaignsTable, type CampaignRow } from './CampaignsTable';

export const dynamic = 'force-dynamic';

export default async function AdminMailsPage() {
  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from('mailing_campaigns_stats')
    .select('*')
    .order('created_at', { ascending: false });

  const campaigns = (data || []) as CampaignRow[];

  return (
    <div className="pt-2">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Mails</h1>
          <p className="text-sm text-[#7a6b5d]">
            CRM de campañas: crea, genera con IA, previsualiza y lanza envíos masivos sin tocar terminal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/administrator/mails/bajas"
            className="rounded-full border border-sand-200 bg-white hover:bg-cream-100 text-sm font-semibold text-[#7a6b5d] hover:text-foreground px-5 py-2.5 transition-colors"
          >
            Bajas de marketing
          </Link>
          <Link
            href="/administrator/mails/nueva"
            className="rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            + Nueva campaña
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 px-5 py-4 text-sm mb-6">
          <p className="font-semibold mb-1">No se pudo cargar el listado</p>
          <p className="font-mono text-xs break-all opacity-90">{error.message}</p>
          <p className="mt-2 text-[#7a6b5d]">
            Si la tabla <code className="bg-white/80 px-1 rounded">mailing_campaigns</code> no existe, aplica las migraciones 038 y 039 en Supabase.
          </p>
        </div>
      )}

      {!error && campaigns.length === 0 && (
        <div className="bg-white border border-sand-200 rounded-2xl p-10 text-center">
          <p className="font-serif text-xl text-foreground mb-2">No hay campañas todavía</p>
          <p className="text-sm text-[#7a6b5d] mb-6">
            Crea la primera y la IA te ayudará a generar el HTML partiendo de un diseño previo.
          </p>
          <Link
            href="/administrator/mails/nueva"
            className="inline-block rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            Crear campaña
          </Link>
        </div>
      )}

      {campaigns.length > 0 && <CampaignsTable campaigns={campaigns} />}
    </div>
  );
}
