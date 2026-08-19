import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BikePage({ params }: PageProps<'/bikes/[id]'>) {
  const { id } = await params;

  const bike = await prisma.bike.findUnique({
    where: { id },
    include: { station: true },
  });

  if (!bike) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link href="/">← К каталогу</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{bike.model}</CardTitle>
          <CardDescription>{bike.description ?? 'Описание пока не заполнено.'}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{bike.type}</Badge>
            <Badge>{bike.status}</Badge>
          </div>
          <Separator />
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Станция</dt>
              <dd>{bike.station?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Адрес</dt>
              <dd>{bike.station?.address ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Цена</dt>
              <dd className="font-medium">{formatPrice(bike.pricePerHour)} / час</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
