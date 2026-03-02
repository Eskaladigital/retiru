import { getRequestConfig } from "next-intl/server";

export const locales = ["es", "en"] as const;
export const defaultLocale = "es";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../i18n/messages/${locale}.json`)).default,
}));
