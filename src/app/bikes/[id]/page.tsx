import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { bikeTypeLabels } from '@/lib/bikes';
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link href="/">&larr; Back to catalogue</Link>
      </Button>

      <Card className="overflow-hidden pt-0">
        {bike.imageUrl ? (
          <div className="relative aspect-16/9 w-full bg-muted">
            <Image
              src={bike.imageUrl}
              alt={bike.model}
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <CardHeader>
          <CardTitle className="font-heading text-2xl">{bike.model}</CardTitle>
          <CardDescription>{bike.description ?? 'No description yet.'}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{bikeTypeLabels[bike.type]}</Badge>
            <Badge>{bike.status}</Badge>
          </div>
          <Separator />
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Station</dt>
              <dd>{bike.station?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Address</dt>
              <dd>{bike.station?.address ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium">{formatPrice(bike.pricePerHour)} / hour</dd>
            </div>
          </dl>
          <Button className="w-full">Rent this bike</Button>
        </CardContent>
      </Card>
    </main>
  );
}
