import { getTranslations } from "next-intl/server";

import { Container } from "@/components/shared/container";
import { List } from "Components/pickup-points/list";
import { prisma } from "Lib/prisma";

export default async function PickupPointsPage({
  searchParams,
}: PageProps<"/[locale]/pickup-points">) {
  const [translate, stations, { station: requestedStationId }] = await Promise.all([
    getTranslations("PickupPoints"),
    prisma.station.findMany({ orderBy: { name: "asc" } }),
    searchParams,
  ]);

  return (
    <Container as="main" className="flex-1 pt-8 pb-20">
      <h1 className="mb-2.5 text-[32px] font-semibold tracking-[-0.025em]">
        {translate("title")}
      </h1>
      <p className="mb-8 max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground">
        {translate("subtitle")}
      </p>

      {stations.length === 0 ? (
        <div className="rounded-[14px] border p-6">
          <p className="text-sm text-muted-foreground">{translate("empty")}</p>
        </div>
      ) : (
        <List
          stations={stations.map((station) => ({
            id: station.id,
            name: station.name,
            address: station.address,
            latitude: station.latitude,
            longitude: station.longitude,
          }))}
          addressLabel={translate("addressLabel")}
          initialStationId={
            typeof requestedStationId === "string" ? requestedStationId : undefined
          }
        />
      )}
    </Container>
  );
}
