import type { Metadata } from "next";
import { Geist_Mono, Noto_Serif, Roboto } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const notoSerif = Noto_Serif({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Bike Rental",
  description: "Аренда велосипедов",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={cn(
        "h-full font-sans antialiased",
        roboto.variable,
        notoSerif.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
