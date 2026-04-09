// POST /api/retreats/generate-cover-image — Portada con IA (GPT Image 1.5) a partir del briefing completo del evento
import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import {
  buildDallePromptFromEvent,
  generateDalle3CoverImage,
  type CoverScheduleDay,
  type EventCoverBriefInput,
} from '@/lib/openai/event-cover-image';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
}

function scheduleFromBody(v: unknown): CoverScheduleDay[] | undefined {
  if (!Array.isArray(v) || v.length === 0) return undefined;
  const out: CoverScheduleDay[] = [];
  for (const d of v) {
    if (!d || typeof d !== 'object') continue;
    const o = d as Record<string, unknown>;
    const day = typeof o.day === 'number' ? o.day : undefined;
    const title_es = str(o.title_es);
    const title = str(o.title);
    const rawItems = o.items;
    const items: CoverScheduleDay['items'] = [];
    if (Array.isArray(rawItems)) {
      for (const it of rawItems) {
        if (!it || typeof it !== 'object') continue;
        const io = it as Record<string, unknown>;
        items.push({
          time: str(io.time),
          title_es: str(io.title_es),
          activity: str(io.activity),
        });
      }
    }
    out.push({ day, title_es: title_es || undefined, title: title || undefined, items });
  }
  return out.length ? out : undefined;
}

export async function POST(request: Request) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'La generación de portadas con IA no está activa. Falta OPENAI_API_KEY en el servidor.' },
        { status: 503 },
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Inicia sesión para generar imágenes.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title_es = str(body.title_es);
    const summary_es = str(body.summary_es);
    // Tope defensivo: cuerpos enormes (p. ej. HTML con base64 pegado) devuelven 413 en serverless antes de lógica útil.
    const description_es = str(body.description_es).slice(0, 35000);
    const description_en_raw = str(body.description_en);

    if (!title_es.trim() || !summary_es.trim()) {
      return NextResponse.json(
        { error: 'Hacen falta al menos título y resumen del evento para generar la portada.' },
        { status: 400 },
      );
    }

    const admin = createAdminSupabase();

    let destination_label = str(body.destination_label).trim() || undefined;
    const destination_id = str(body.destination_id).trim() || undefined;
    if (!destination_label && destination_id) {
      const { data: dest } = await admin.from('destinations').select('name_es').eq('id', destination_id).maybeSingle();
      if (dest?.name_es) destination_label = dest.name_es as string;
    }

    let category_labels = strArr(body.category_labels);
    const category_ids = strArr(body.category_ids);
    if (category_labels.length === 0 && category_ids.length > 0) {
      const { data: cats } = await admin.from('categories').select('id, name_es').in('id', category_ids);
      category_labels = (cats || []).map((c: { name_es?: string }) => (c.name_es || '').trim()).filter(Boolean);
    }

    const brief: EventCoverBriefInput = {
      title_es,
      summary_es,
      description_es,
      title_en: str(body.title_en).trim() || undefined,
      summary_en: str(body.summary_en).trim() || undefined,
      description_en: description_en_raw.trim().slice(0, 20000) || undefined,
      destination_label,
      address: str(body.address).trim() || undefined,
      start_date: str(body.start_date).trim() || undefined,
      end_date: str(body.end_date).trim() || undefined,
      category_labels: category_labels.length ? category_labels : undefined,
      includes_es: strArr(body.includes_es),
      excludes_es: strArr(body.excludes_es),
      schedule: scheduleFromBody(body.schedule),
      languages: strArr(body.languages),
    };

    const dallePrompt = await buildDallePromptFromEvent(openaiKey, brief);

    const { buffer, contentType } = await generateDalle3CoverImage(openaiKey, dallePrompt);

    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const path = `retreats/ai-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await admin.storage.from('retreat-images').upload(path, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    });

    if (upErr) {
      console.error('[generate-cover-image] storage', upErr);
      const msg = upErr.message || '';
      const isBucketMissing =
        /Bucket not found|not found|does not exist/i.test(msg) || msg.includes('404');
      return NextResponse.json(
        {
          error: isBucketMissing
            ? 'El bucket «retreat-images» no existe en Supabase. Ejecuta la migración 025_storage_retreat_images_bucket_ensure.sql.'
            : msg || 'No se pudo guardar la imagen.',
        },
        { status: 502 },
      );
    }

    const { data: urlData } = admin.storage.from('retreat-images').getPublicUrl(path);
    return NextResponse.json({ publicUrl: urlData.publicUrl });
  } catch (e) {
    console.error('[generate-cover-image]', e);
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
