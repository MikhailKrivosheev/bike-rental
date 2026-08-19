import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { BikeStatus } from '@/generated/prisma/enums';

// Каталог зависит от БД — рендерим на каждый запрос, а не на билде.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const bikes = await prisma.bike.findMany({
    where: { status: BikeStatus.AVAILABLE },
    include: { station: true },
    orderBy: { pricePerHour: 'asc' },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Аренда велосипедов</h1>
        <p className="text-muted-foreground">Выберите велосипед и заберите его на ближайшей станции.</p>
      </header>

      {bikes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Каталог пуст</CardTitle>
            <CardDescription>
              Поднимите базу (<code>pnpm db:up</code>), примените миграции (<code>pnpm db:migrate</code>) и
              заполните тестовыми данными (<code>pnpm db:seed</code>).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => (
            <li key={bike.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{bike.model}</CardTitle>
                  <CardDescription>{bike.station?.name ?? 'Без станции'}</CardDescription>
                  <CardAction>
                    <Badge variant="secondary">{bike.type}</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-lg font-medium">{formatPrice(bike.pricePerHour)} / час</span>
                  <Button asChild size="sm">
                    <Link href={`/bikes/${bike.id}`}>Арендовать</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
