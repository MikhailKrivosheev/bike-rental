import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Panel } from "Components/booking/panel";
import { Container } from "@/components/shared/container";
import { Button } from "Components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "Lib/format";
import { getCurrentUser } from "@/server/auth";
import { getBike, getCatalogueBikes } from "@/server/catalogue";

// Prerendered and refreshed in the background; the `bikes` tag flushes it as
// soon as this bike is booked.
export const revalidate = 300;

// Prerenders the current fleet; a bike added later still renders on demand and
// is cached from then on (`dynamicParams` defaults to true).
export async function generateStaticParams() {
  const bikes = await getCatalogueBikes();

  return bikes.map((bike) => ({ id: bike.id }));
}

export default async function BikePage({
  params,
}: PageProps<"/[locale]/bikes/[id]">) {
  const { id } = await params;

  const [
    locale,
    format,
    translateDetail,
    translateCatalogue,
    translateSpecs,
    translateDescription,
  ] = await Promise.all([
    getLocale(),
    getFormatter(),
    getTranslations("BikeDetail"),
    getTranslations("Catalogue"),
    getTranslations("BikeSpecTable"),
    getTranslations("BikeDescriptions"),
  ]);

  const [bike, user] = await Promise.all([getBike(id), getCurrentUser()]);

  if (!bike) {
    notFound();
  }

  const isAvailable = bike.isAvailable;
  const freesUpAt = bike.freesUpAt ? new Date(bike.freesUpAt) : undefined;

  // Descriptions and spec sheets live in the message catalogue so they can be
  // translated; anything missing falls back to the database value.
  const description = translateDescription.has(bike.id)
    ? translateDescription(bike.id)
    : (bike.description ?? translateDetail("noDescription"));

  const specs = translateSpecs.has(bike.id)
    ? Object.entries(translateSpecs.raw(bike.id) as Record<string, string>)
    : [];

  return (
    <Container as="main" className="flex-1 pt-8 pb-20">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mb-6 h-8 text-[13px]"
      >
        <Link href="/">{translateDetail("back")}</Link>
      </Button>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-16/10 overflow-hidden rounded-[14px] border bg-muted">
            {bike.imageUrl ? (
              <Image
                src={bike.imageUrl}
                alt={bike.model}
                fill
                sizes="(min-width: 1180px) 720px, 100vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>

          <div className="pt-3">
            <h1 className="mb-2.5 text-[32px] font-semibold tracking-[-0.025em]">
              {bike.model}
            </h1>
            <p className="mb-6 max-w-[60ch] text-base leading-[1.65] text-pretty text-muted-foreground">
              {description}
            </p>

            {specs.length > 0 ? (
              <>
                <h2 className="mb-3 text-[15px] font-semibold">
                  {translateDetail("specs")}
                </h2>
                <dl className="overflow-hidden rounded-xl border">
                  {specs.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-6 border-b px-4 py-3 text-sm last:border-b-0"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
          </div>
        </div>

        {isAvailable ? (
          <Panel
            bike={{
              id: bike.id,
              model: bike.model,
              pricePerHour: bike.pricePerHour,
              pricePerDay: bike.pricePerDay,
              stationName: bike.stationName ?? "—",
            }}
            isSignedIn={Boolean(user)}
          />
        ) : (
          <aside className="flex flex-col gap-4 rounded-2xl border p-[22px] lg:sticky lg:top-24">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-semibold tracking-[-0.02em]">
                  {formatPrice(bike.pricePerHour, locale)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {translateDetail("perHour")}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatPrice(bike.pricePerDay, locale)}{" "}
                {translateDetail("perDay")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {freesUpAt
                ? translateCatalogue("bookedUntil", {
                    time: format.dateTime(freesUpAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })
                : translateCatalogue("booked")}
            </p>
          </aside>
        )}
      </div>
    </Container>
  );
}
