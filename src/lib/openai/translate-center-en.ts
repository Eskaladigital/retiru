/**
 * Traduce campos de ficha de centro ES → EN (markdown + arrays + textos cortos).
 * Mantener alineado con scripts/lib/translate-center-fields-en.mjs (mismo contrato JSON).
 */

export type TranslateCenterFieldsInput = {
  descriptionEs: string;
  servicesEs: string[];
  scheduleSummaryEs: string | null;
  priceRangeEs: string | null;
};

export type TranslateCenterFieldsResult = {
  description_en: string;
  services_en: string[];
  schedule_summary_en: string | null;
  price_range_en: string | null;
};

const SYSTEM_PROMPT = `You translate wellness center profile content from Spanish to natural English (US) for Retiru, a Spain-focused retreats and wellness directory.

Rules:
- Preserve Markdown: headings (##, ###), **bold**, lists, paragraph breaks. Do not add sections or facts that are not implied by the source.
- Keep numbers exact: ratings, review counts, prices, phone numbers, street addresses, URLs.
- Keep proper names (people, businesses) recognizable; translate generic Spanish words around them.
- services_en must have the SAME number of items as services_es, same order — each item is a short English label (2–6 words).
- If schedule_summary_es or price_range_es is null, empty, or only whitespace, return null for the matching EN field.
- Output ONLY a JSON object with exactly these keys: description_en (string), services_en (array of strings), schedule_summary_en (string or null), price_range_en (string or null). No markdown fences.`;

export async function translateCenterFieldsToEn(
  input: TranslateCenterFieldsInput,
  apiKey: string
): Promise<TranslateCenterFieldsResult> {
  const payload = {
    description_es: input.descriptionEs,
    services_es: input.servicesEs,
    schedule_summary_es: input.scheduleSummaryEs,
    price_range_es: input.priceRangeEs,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate the following JSON values from Spanish to English:\n\n${JSON.stringify(payload)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || res.statusText);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('OpenAI returned empty JSON');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('OpenAI returned invalid JSON');
  }

  const description_en =
    typeof parsed.description_en === 'string' ? parsed.description_en.trim() : '';
  if (!description_en) throw new Error('Missing description_en in translation');

  let services_en: string[] = [];
  if (Array.isArray(parsed.services_en)) {
    services_en = parsed.services_en.map((s) => String(s).trim()).filter(Boolean);
  }
  if (services_en.length !== input.servicesEs.length && input.servicesEs.length > 0) {
    const padOrTrim = input.servicesEs.map((_, i) => services_en[i] || input.servicesEs[i]);
    services_en = padOrTrim;
  }

  const schedule_summary_en =
    parsed.schedule_summary_en === null || parsed.schedule_summary_en === undefined
      ? null
      : String(parsed.schedule_summary_en).trim() || null;

  const price_range_en =
    parsed.price_range_en === null || parsed.price_range_en === undefined
      ? null
      : String(parsed.price_range_en).trim() || null;

  return {
    description_en,
    services_en,
    schedule_summary_en,
    price_range_en,
  };
}
