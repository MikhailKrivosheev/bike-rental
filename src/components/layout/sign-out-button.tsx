'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from 'Components/ui/button';
import { signOut } from '@/server/auth';

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await signOut();
      router.refresh();
    });
  }

  return (
    <Button variant="outline" className="h-9 px-3.5" onClick={onClick} disabled={isPending}>
      {label}
    </Button>
  );
}
