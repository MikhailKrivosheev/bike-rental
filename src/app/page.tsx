import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BikeStatus } from '@/generated/prisma/enums';
import { bikeTypeLabels } from '@/lib/bikes';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

// The catalogue reads the database, so render it per request instead of at build time.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const bikes = await prisma.bike.findMany({
    where: { status: BikeStatus.AVAILABLE },
    include: { station: true },
    orderBy: { pricePerHour: 'asc' },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Rent a bike</h1>
        <p className="text-muted-foreground">
          Pick a bike and collect it at the nearest station.
        </p>
      </header>

      {bikes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>The catalogue is empty</CardTitle>
            <CardDescription>
              Start the database (<code>pnpm db:up</code>), apply migrations (
              <code>pnpm db:migrate</code>) and load sample data (<code>pnpm db:seed</code>).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul id="bikes" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => (
            <li key={bike.id}>
              <Link
                href={`/bikes/${bike.id}`}
                className="group block h-full rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Card className="h-full gap-4 overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    {bike.imageUrl ? (
                      <Image
                        src={bike.imageUrl}
                        alt={bike.model}
                        fill
                        sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                    <Badge className="absolute top-3 left-3" variant="secondary">
                      {bikeTypeLabels[bike.type]}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{bike.model}</CardTitle>
                    <CardDescription>{bike.station?.name ?? 'No station'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-lg font-medium">
                      {formatPrice(bike.pricePerHour)}
                      <span className="text-sm text-muted-foreground"> / hour</span>
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
