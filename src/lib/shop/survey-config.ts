/** Categorías permitidas en la encuesta de la tienda (ES/EN + API). */

export const SHOP_SURVEY_CATEGORIES = [
  { id: 'esterillas-yoga', emoji: '🧘', labelEs: 'Esterillas de yoga', labelEn: 'Yoga mats' },
  { id: 'cojines-meditacion', emoji: '🪷', labelEs: 'Cojines de meditación', labelEn: 'Meditation cushions' },
  { id: 'bloques-yoga', emoji: '🧱', labelEs: 'Bloques y props de yoga', labelEn: 'Yoga blocks & props' },
  { id: 'ropa-deportiva', emoji: '👕', labelEs: 'Ropa deportiva y yoga', labelEn: 'Activewear & yoga clothing' },
  { id: 'termos-botellas', emoji: '🫗', labelEs: 'Termos y botellas', labelEn: 'Thermos & bottles' },
  { id: 'incienso-velas', emoji: '🕯️', labelEs: 'Incienso y velas', labelEn: 'Incense & candles' },
  { id: 'aceites-esenciales', emoji: '🌿', labelEs: 'Aceites esenciales', labelEn: 'Essential oils' },
  { id: 'libros-mindfulness', emoji: '📚', labelEs: 'Libros de mindfulness y bienestar', labelEn: 'Mindfulness & wellbeing books' },
  { id: 'mantas-bolsters', emoji: '🛏️', labelEs: 'Mantas y bolsters', labelEn: 'Blankets & bolsters' },
  { id: 'joyeria-espiritual', emoji: '📿', labelEs: 'Joyería y accesorios espirituales', labelEn: 'Spiritual jewelry & accessories' },
] as const;

export type ShopSurveyCategoryId = (typeof SHOP_SURVEY_CATEGORIES)[number]['id'];

const ALLOWED = new Set<string>(SHOP_SURVEY_CATEGORIES.map((c) => c.id));

export function isAllowedShopSurveyCategory(id: string): id is ShopSurveyCategoryId {
  return ALLOWED.has(id);
}
