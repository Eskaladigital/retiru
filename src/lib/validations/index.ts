// ============================================================================
// RETIRU · Zod validation schemas
// ============================================================================

import { z } from 'zod';

// ─── Auth ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/** Teléfono en registro: obligatorio, al menos 9 dígitos (admite +, espacios, guiones). */
export function signupPhoneHasMinDigits(value: string): boolean {
  return value.replace(/\D/g, '').length >= 9;
}

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nombre demasiado corto').max(100),
  email: z.string().email('Email no válido'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio').refine(signupPhoneHasMinDigits, {
    message: 'Introduce un teléfono válido (al menos 9 dígitos)',
  }),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

/** Misma regla que `registerSchema`, mensajes en inglés para `/en/register`. */
export const registerSchemaEn = z.object({
  full_name: z.string().min(2, 'Name is too short').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().trim().min(1, 'Phone number is required').refine(signupPhoneHasMinDigits, {
    message: 'Enter a valid phone number (at least 9 digits)',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// ─── Organizer Registration ─────────────────────────────────────────────────
export const organizerRegistrationSchema = z.object({
  business_name: z.string().min(2).max(200),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description_es: z.string().min(50, 'Mínimo 50 caracteres').max(2000).optional(),
  description_en: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  tax_id: z.string().min(7, 'NIF/CIF no válido').max(20),
  tax_name: z.string().min(2).max(200),
  tax_address: z.string().min(10).max(500),
});

// ─── Retreat Creation ─────────────────────────────────────────────────────────
export const eventSchema = z.object({
  title_es: z.string().min(10, 'Mínimo 10 caracteres').max(200),
  title_en: z.string().max(200).optional(),
  summary_es: z.string().min(30, 'Mínimo 30 caracteres').max(300),
  summary_en: z.string().max(300).optional(),
  description_es: z.string().min(100, 'Mínimo 100 caracteres').max(10000),
  description_en: z.string().max(10000).optional(),
  destination_id: z.string().uuid().optional(),
  address: z.string().min(5).max(500),
  start_date: z.string().refine((d) => new Date(d) > new Date(), 'La fecha debe ser futura'),
  end_date: z.string(),
  max_attendees: z.number().min(1).max(500),
  min_attendees: z.number().min(1).optional(),
  total_price: z.number().min(50, 'Precio mínimo: 50€'),
  confirmation_type: z.enum(['automatic', 'manual']),
  sla_hours: z.number().min(12).max(168).default(48),
  languages: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
  categories: z.array(z.string().uuid()).min(1, 'Selecciona al menos una categoría'),
  includes_es: z.array(z.string()).optional(),
  includes_en: z.array(z.string()).optional(),
  excludes_es: z.array(z.string()).optional(),
  excludes_en: z.array(z.string()).optional(),
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['end_date'],
});

// ─── Review ─────────────────────────────────────────────────────────────────
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(20, 'Mínimo 20 caracteres').max(5000),
});

// ─── Contact bypass detection ───────────────────────────────────────────────
const contactPatterns = [
  /[\w.-]+@[\w.-]+\.\w{2,}/i,                    // email
  /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/,  // phone
  /whatsapp|telegram|signal|wa\.me/i,              // messaging apps
  /instagram\.com|facebook\.com|fb\.me/i,          // social
];

export function containsContactInfo(text: string): boolean {
  return contactPatterns.some((pattern) => pattern.test(text));
}

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OrganizerRegistrationInput = z.infer<typeof organizerRegistrationSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
