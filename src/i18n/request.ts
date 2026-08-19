import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";

import { routing } from "./routing";

export default getRequestConfig(async ({ locale: requested }) => {
  // Server Actions can't read root params, so they pass the locale explicitly.
  const candidate = requested ?? (await rootParams.locale());
  const locale = hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;

  return {
    locale,
    // `messages` is the next-intl API field; the JSON files live in /dictionaries.
    messages: (await import(`Dictionaries/${locale}.json`)).default,
  };
});
