import { getTranslations } from "next-intl/server";

import { Container } from "@/components/shared/container";
import { Link } from "@/i18n/navigation";
import { prisma } from "Lib/prisma";

export async function Footer() {
  const [translate, header, stations] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Header"),
    prisma.station.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Placeholder link targets are intentionally omitted: these pages don't exist yet.
  const columns = [
    {
      id: "how-it-works",
      title: translate("service"),
      items: translate.raw("serviceItems") as string[],
    },
    {
      id: "support",
      title: translate("support"),
      items: translate.raw("supportItems") as string[],
    },
  ];

  return (
    <footer className="border-t bg-muted/40">
      <Container className="grid gap-8 py-11 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-[7px] bg-primary text-xs font-semibold text-primary-foreground">
              {header("brandInitial")}
            </span>
            <span className="text-sm font-semibold">{header("brand")}</span>
          </div>
          <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted-foreground">
            {translate("about")}
          </p>
        </div>

        <div id="pickup-points" className="flex flex-col gap-2.5 scroll-mt-24">
          <Link
            href="/pickup-points"
            className="text-[13px] font-semibold transition-colors hover:text-foreground"
          >
            {translate("pickupPoints")}
          </Link>
          {stations.map((station) => (
            <Link
              key={station.id}
              href={`/pickup-points?station=${station.id}`}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {station.name}
            </Link>
          ))}
        </div>

        {columns.map((column) => (
          <div
            key={column.id}
            id={column.id}
            className="flex flex-col gap-2.5 scroll-mt-24"
          >
            <span className="text-[13px] font-semibold">{column.title}</span>
            {column.items.map((item) => (
              <span key={item} className="text-[13px] text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        ))}
      </Container>

      <div className="border-t">
        <Container className="flex flex-col justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>
            {translate("copyright", { year: new Date().getFullYear() })}
          </span>
          <span>{translate("legal")}</span>
        </Container>
      </div>
    </footer>
  );
}
