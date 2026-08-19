import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // `messages` is the next-intl API field; the JSON files live in /dictionaries.
    messages: (await import(`Dictionaries/${locale}.json`)).default,
  };
});
