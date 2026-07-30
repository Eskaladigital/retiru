/**
 * Cobro online (Stripe). Mientras no haya claves reales, la plataforma opera
 * en modo lanzamiento: inscripción sin cobro (`reserved_no_payment`).
 *
 * Override explícito:
 * - ONLINE_PAYMENTS_ENABLED=0|false → forzar sin cobro
 * - ONLINE_PAYMENTS_ENABLED=1|true  → forzar cobro (requiere Stripe válido)
 * Sin override: se deduce de STRIPE_SECRET_KEY (sk_test_… / sk_live_…).
 */

function parseBoolEnv(raw: string | undefined): boolean | null {
  if (raw == null || raw.trim() === '') return null;
  const v = raw.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') return false;
  if (v === '1' || v === 'true' || v === 'on' || v === 'yes') return true;
  return null;
}

/** Clave secreta Stripe con forma real (no placeholder tipo your_stripe_sk). */
export function looksLikeStripeSecretKey(key: string | undefined): boolean {
  if (!key) return false;
  return /^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(key.trim());
}

/** Clave pública Stripe con forma real. */
export function looksLikeStripePublishableKey(key: string | undefined): boolean {
  if (!key) return false;
  return /^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(key.trim());
}

/** true = checkout Stripe activo; false = modo inscripción sin cobro (lanzamiento). */
export function isOnlinePaymentEnabled(): boolean {
  const forced = parseBoolEnv(process.env.ONLINE_PAYMENTS_ENABLED);
  if (forced === false) return false;
  if (forced === true) return looksLikeStripeSecretKey(process.env.STRIPE_SECRET_KEY);

  const pubForced = parseBoolEnv(process.env.NEXT_PUBLIC_ONLINE_PAYMENTS);
  if (pubForced === false) return false;

  return looksLikeStripeSecretKey(process.env.STRIPE_SECRET_KEY);
}

/**
 * Señal para UI (SSR/ISR). Prefiere NEXT_PUBLIC_ONLINE_PAYMENTS; si no,
 * mira la publishable key (la secret no debe ir al cliente).
 */
export function isOnlinePaymentEnabledForUi(): boolean {
  const pubForced = parseBoolEnv(process.env.NEXT_PUBLIC_ONLINE_PAYMENTS);
  if (pubForced !== null) return pubForced;
  const serverForced = parseBoolEnv(process.env.ONLINE_PAYMENTS_ENABLED);
  if (serverForced !== null) {
    if (serverForced === false) return false;
    return looksLikeStripePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return looksLikeStripePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
