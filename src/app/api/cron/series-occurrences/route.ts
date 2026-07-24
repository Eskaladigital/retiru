// GET|POST /api/cron/series-occurrences
// Mantiene los eventos periódicos: para cada serie activa genera las
// ocurrencias que falten hasta su horizonte (occurrences_ahead) y recoloca
// is_series_next cuando una fecha pasa. Coste bajo: solo series activas.
//
// Programación (vercel.json): diario a las 05:00 UTC.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { ensureSeriesOccurrences, reassignSeriesNext } from '@/lib/series';

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const admin = createAdminSupabase();
  let seriesProcessed = 0;
  let occurrencesCreated = 0;

  try {
    const { data: activeSeries } = await admin
      .from('retreat_series')
      .select('id')
      .eq('is_active', true);

    for (const s of activeSeries || []) {
      const { created } = await ensureSeriesOccurrences(admin, s.id);
      seriesProcessed++;
      occurrencesCreated += created;
    }

    // Series detenidas: solo recolocar la marca de «próxima fecha»
    const { data: inactiveSeries } = await admin
      .from('retreat_series')
      .select('id')
      .eq('is_active', false);

    for (const s of inactiveSeries || []) {
      await reassignSeriesNext(admin, s.id);
    }

    return NextResponse.json({
      seriesProcessed,
      occurrencesCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/series-occurrences] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) { return handle(request); }
export async function POST(request: NextRequest) { return handle(request); }
