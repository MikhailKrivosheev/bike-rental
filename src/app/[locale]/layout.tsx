import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Footer } from "Components/layout/footer";
import { Header } from "Components/layout/header";
import { ThemeProvider } from "Components/theme-provider";
import { Toaster } from "Components/ui/sonner";
import { routing } from "@/i18n/routing";
import { cn } from "Lib/utils";
import { fontVariables } from "Styles/fonts";

import "Styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const translate = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: translate("title"),
    description: translate("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const htmlClassName = cn("h-full font-sans antialiased", fontVariables);

  return (
    <html lang={locale} suppressHydrationWarning className={htmlClassName}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <NextIntlClientProvider>
            <Header />
            {children}
            <Footer />
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
