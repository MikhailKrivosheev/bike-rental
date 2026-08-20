'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from 'Components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'Components/ui/dialog';
import { Input } from 'Components/ui/input';
import { Label } from 'Components/ui/label';
import { signIn } from '@/server/auth';

export function SignInDialog({ trigger }: { trigger?: ReactNode } = {}) {
  const translate = useTranslations('Header');
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const result = await signIn({ email, password }, locale);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setOpen(false);
      setPassword('');
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="h-9 px-3.5">{translate('signIn')}</Button>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-[17px]">{translate('signInTitle')}</DialogTitle>
          <DialogDescription>{translate('signInDescription')}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-email" className="text-[13px]">
              {translate('emailLabel')}
            </Label>
            <Input
              id="signin-email"
              type="email"
              required
              autoComplete="email"
              className="h-[38px]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-password" className="text-[13px]">
              {translate('passwordLabel')}
            </Label>
            <Input
              id="signin-password"
              type="password"
              required
              autoComplete="current-password"
              className="h-[38px]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {translate('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? translate('signingIn') : translate('signInButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
