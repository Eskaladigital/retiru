// ============================================================================
// RETIRU · Mailing · Construcción de la lista de destinatarios de una campaña
//
// Port TypeScript de cmdCreate() de scripts/mailing.mjs (líneas 167–235 + 242–281).
// Filtra centros según la audiencia seleccionada, calcula el snapshot de
// fin_membresia (created_at + 6 meses) y hace insertos deduplicados en
// mailing_recipients respetando el índice parcial (campaign_id, center_id).
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { finMembresiaFromCenterCreatedAt } from './render';

export type AudienceType = 'all' | 'claimed' | 'not_claimed';

export type PopulateAudienceFilter = {
  audience?: AudienceType;
  test_emails?: string | null;
};

export type PopulateResult = {
  candidates: number;
  skippedOptOut: number;
  skippedAudience: number;
  skippedDuplicates: number;
  inserted: number;
  total: number; // total de pending reales en BD tras la operación
};

type CenterRow = {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
  marketing_opt_out_at: string | null;
};

export async function populateRecipients(
  sb: SupabaseClient,
  campaignId: string,
  filter: PopulateAudienceFilter,
): Promise<PopulateResult> {
  const audience: AudienceType = filter.audience || 'all';
  const testEmails = filter.test_emails || null;

  const result: PopulateResult = {
    candidates: 0,
    skippedOptOut: 0,
    skippedAudience: 0,
    skippedDuplicates: 0,
    inserted: 0,
    total: 0,
  };

  // ─── Construir candidatos ───────────────────────────────────────────────
  type CandidateRow = {
    campaign_id: string;
    center_id: string | null;
    email: string;
    nombre_centro: string | null;
    location: string | null;
    fin_membresia: string | null;
    status: 'pending';
  };

  const recipients: CandidateRow[] = [];

  if (testEmails) {
    for (const rawEmail of testEmails.split(',')) {
      const email = rawEmail.trim();
      if (!email) continue;
      recipients.push({
        campaign_id: campaignId,
        center_id: null,
        email,
        nombre_centro: 'Test',
        location: '',
        fin_membresia: null,
        status: 'pending',
      });
    }
  } else {
    const { data: centers, error } = await sb
      .from('centers')
      .select('id, name, email, city, province, created_at, marketing_opt_out_at')
      .eq('status', 'active')
      .not('email', 'is', null)
      .neq('email', '');
    if (error) throw new Error(`Error cargando centros: ${error.message}`);

    let claimedIds: Set<string> | null = null;
    if (audience === 'claimed' || audience === 'not_claimed') {
      const { data: claims } = await sb
        .from('center_claims')
        .select('center_id')
        .eq('status', 'approved');
      claimedIds = new Set((claims || []).map((c: { center_id: string }) => c.center_id));
    }

    result.candidates = (centers || []).length;
    for (const c of (centers || []) as CenterRow[]) {
      if (c.marketing_opt_out_at) { result.skippedOptOut++; continue; }
      if (audience === 'claimed' && !claimedIds!.has(c.id)) { result.skippedAudience++; continue; }
      if (audience === 'not_claimed' && claimedIds!.has(c.id)) { result.skippedAudience++; continue; }
      if (!c.email) continue;

      recipients.push({
        campaign_id: campaignId,
        center_id: c.id,
        email: c.email,
        nombre_centro: c.name,
        location: [c.city, c.province].filter(Boolean).join(', ') || null,
        fin_membresia: finMembresiaFromCenterCreatedAt(c.created_at),
        status: 'pending',
      });
    }
  }

  if (recipients.length === 0) {
    const { count } = await sb
      .from('mailing_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    result.total = count || 0;
    return result;
  }

  // ─── Deduplicado manual (el índice único es parcial y no sirve para ON CONFLICT) ───
  const { data: existingRows } = await sb
    .from('mailing_recipients')
    .select('center_id, email')
    .eq('campaign_id', campaignId);

  const existingByCenter = new Set(
    (existingRows || []).filter((r: { center_id: string | null }) => r.center_id).map((r: { center_id: string }) => r.center_id),
  );
  const existingByEmail = new Set(
    (existingRows || []).filter((r: { center_id: string | null }) => !r.center_id).map((r: { email: string }) => r.email),
  );

  // Si estamos re-cargando solo test-emails, limpiamos los previos sin center_id.
  const withoutCenter = recipients.filter((r) => !r.center_id);
  if (withoutCenter.length > 0) {
    await sb.from('mailing_recipients').delete().eq('campaign_id', campaignId).is('center_id', null);
    existingByEmail.clear();
  }

  const fresh = recipients.filter((r) => {
    if (r.center_id) return !existingByCenter.has(r.center_id);
    return !existingByEmail.has(r.email);
  });
  result.skippedDuplicates = recipients.length - fresh.length;

  const CHUNK = 500;
  for (let i = 0; i < fresh.length; i += CHUNK) {
    const chunk = fresh.slice(i, i + CHUNK);
    const { error } = await sb.from('mailing_recipients').insert(chunk);
    if (error) throw new Error(`Error insertando lote ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
    result.inserted += chunk.length;
  }

  const { count } = await sb
    .from('mailing_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');
  result.total = count || 0;

  await sb
    .from('mailing_campaigns')
    .update({ total_recipients: result.total, audience_filter: { audience, test_emails: testEmails } })
    .eq('id', campaignId);

  return result;
}
