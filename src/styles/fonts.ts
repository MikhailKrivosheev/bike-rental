import { Geist, Geist_Mono } from 'next/font/google';

export const fontSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

/** The design sets headings in Geist too, so it maps to the same family. */
export const fontHeading = Geist({
  variable: '--font-heading',
  subsets: ['latin'],
});

export const fontMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** Font CSS variables to put on the <html> element. */
export const fontVariables = [fontSans.variable, fontHeading.variable, fontMono.variable];
