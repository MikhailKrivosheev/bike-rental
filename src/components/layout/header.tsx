import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { AuthButtons } from "Components/layout/auth-buttons";
import { LocaleSwitcher } from "Components/locale-switcher";
import { Container } from "@/components/shared/container";
import { ThemeToggle } from "Components/theme-toggle";
import { Link } from "@/i18n/navigation";

export async function Header() {
  const translate = await getTranslations("Header");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/Images/logo.webp"
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-lg object-cover"
          />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            {translate("brand")}
          </span>
        </Link>

        <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          <Link
            href="/#catalogue"
            className="transition-colors hover:text-foreground"
          >
            {translate("catalogue")}
          </Link>
          <a href="#" className="transition-colors hover:text-foreground">
            {translate("howItWorks")}
          </a>
          <Link
            href="/pickup-points"
            className="transition-colors hover:text-foreground"
          >
            {translate("pickupPoints")}
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <AuthButtons />
        </div>
      </Container>
    </header>
  );
}
