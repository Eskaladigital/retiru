// FAQ contextual por ficha de centro (contenido único + schema FAQPage)
import type { Center } from '@/types';
import type { CenterGoogleOpeningHours } from '@/types';
import { getCenterTypeLabel } from '@/lib/utils';

type Locale = 'es' | 'en';

export function buildCenterFaq(
  center: Center,
  locale: Locale,
  openingHours?: CenterGoogleOpeningHours | null,
): { question: string; answer: string }[] {
  const typeLabel = center.type
    ? getCenterTypeLabel(center.type, locale).toLowerCase()
    : locale === 'es'
      ? 'bienestar'
      : 'wellness';
  const city = center.city || center.province || (locale === 'es' ? 'España' : 'Spain');
  const services = locale === 'es'
    ? (Array.isArray(center.services_es) ? center.services_es : [])
    : (Array.isArray(center.services_en) && center.services_en.length
        ? center.services_en
        : Array.isArray(center.services_es) ? center.services_es : []);
  const schedule =
    openingHours?.weekday_descriptions?.join('; ') ||
    (locale === 'es' ? center.schedule_summary_es : center.schedule_summary_en || center.schedule_summary_es) ||
    '';
  const price =
    (locale === 'es' ? center.price_range_es : center.price_range_en || center.price_range_es) || '';

  const faqs: { question: string; answer: string }[] = [];

  if (locale === 'es') {
    faqs.push({
      question: `¿Qué tipo de centro es ${center.name}?`,
      answer: `${center.name} es un centro de ${typeLabel} en ${city}${center.province && center.city ? `, ${center.province}` : ''}. Forma parte del directorio Retiru de centros de yoga, meditación y ayurveda.`,
    });
    if (services.length) {
      faqs.push({
        question: `¿Qué servicios ofrece ${center.name}?`,
        answer: `Entre sus disciplinas y servicios destacan: ${services.slice(0, 8).join(', ')}.`,
      });
    }
    if (schedule) {
      faqs.push({
        question: `¿Cuál es el horario de ${center.name}?`,
        answer: schedule.length > 280 ? `${schedule.slice(0, 277)}…` : schedule,
      });
    }
    if (price) {
      faqs.push({
        question: `¿Cuánto cuesta practicar en ${center.name}?`,
        answer: `Orientación de precios: ${price}. Confirma tarifas actualizadas contactando al centro o visitando su web.`,
      });
    }
    if ((center.avg_rating ?? 0) > 0 && (center.review_count ?? 0) > 0) {
      faqs.push({
        question: `¿Qué opinan los alumnos de ${center.name}?`,
        answer: `Tiene una valoración media de ${center.avg_rating} sobre 5 a partir de ${center.review_count} reseñas en Google.`,
      });
    }
  } else {
    faqs.push({
      question: `What kind of center is ${center.name}?`,
      answer: `${center.name} is a ${typeLabel} center in ${city}${center.province && center.city ? `, ${center.province}` : ''}. It is listed in Retiru’s directory of yoga, meditation and ayurveda centers.`,
    });
    if (services.length) {
      faqs.push({
        question: `What services does ${center.name} offer?`,
        answer: `Highlighted disciplines and services include: ${services.slice(0, 8).join(', ')}.`,
      });
    }
    if (schedule) {
      faqs.push({
        question: `What are the opening hours of ${center.name}?`,
        answer: schedule.length > 280 ? `${schedule.slice(0, 277)}…` : schedule,
      });
    }
    if (price) {
      faqs.push({
        question: `How much does it cost at ${center.name}?`,
        answer: `Price guidance: ${price}. Confirm current rates with the center or on its website.`,
      });
    }
    if ((center.avg_rating ?? 0) > 0 && (center.review_count ?? 0) > 0) {
      faqs.push({
        question: `What do people say about ${center.name}?`,
        answer: `Average Google rating of ${center.avg_rating} out of 5 from ${center.review_count} reviews.`,
      });
    }
  }

  return faqs.slice(0, 5);
}
