import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from 'Lib/prisma';
import { BikeStatus, BikeType } from '@/generated/prisma/enums';

const querySchema = z.object({
  type: z.enum(BikeType).optional(),
  status: z.enum(BikeStatus).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: searchParams.get('type') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const bikes = await prisma.bike.findMany({
    where: {
      type: parsed.data.type,
      status: parsed.data.status ?? BikeStatus.AVAILABLE,
    },
    include: { station: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(bikes);
}
