import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

// next-intl still names its factory `createMiddleware`; the file convention is
// what Next.js renamed to `proxy`.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and anything with a file extension.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
