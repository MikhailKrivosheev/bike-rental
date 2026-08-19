import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          Bike Rental
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Bikes</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/#bikes">Rent now</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
