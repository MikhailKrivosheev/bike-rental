import { Geist_Mono, Noto_Serif, Roboto } from 'next/font/google';

export const fontSans = Roboto({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const fontHeading = Noto_Serif({
  variable: '--font-heading',
  subsets: ['latin'],
});

export const fontMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** Font CSS variables to put on the <html> element. */
export const fontVariables = [fontSans.variable, fontHeading.variable, fontMono.variable];
