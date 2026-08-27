import { getRequestConfig } from "next-intl/server";

export const locales = ["es", "en"] as const;
export const defaultLocale = "es";
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const validLocale: Locale =
    locale && locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
