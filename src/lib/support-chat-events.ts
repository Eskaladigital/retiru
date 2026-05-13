/**
 * Desde Contacto u otras CTAs: mismo panel que SupportChatWidget (burbuja inferior).
 */
export const OPEN_RETIRU_SUPPORT_CHAT = 'retiru:open-support-chat';

/** Dispara apertura del widget de soporte (listener en SupportChatWidget). */
export function requestOpenSupportChat(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_RETIRU_SUPPORT_CHAT));
}
