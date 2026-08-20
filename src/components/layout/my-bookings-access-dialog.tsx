'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { CODE_LENGTH, CODE_SLOTS } from 'Components/booking/constants';
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from 'Components/ui/input-otp';
import { Label } from 'Components/ui/label';
import { requestLoginCode, verifyLoginCode } from '@/server/auth';

type Step = 'email' | 'code';

export function MyBookingsAccessDialog({ label }: { label: string }) {
  const translate = useTranslations('Header');
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep('email');
    setEmail('');
    setCode('');
  }

  function submitEmail() {
    startTransition(async () => {
      const result = await requestLoginCode(email, locale);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setStep('code');
    });
  }

  function submitCode(value: string) {
    startTransition(async () => {
      const result = await verifyLoginCode({ email, code: value }, locale);

      if (!result.ok) {
        toast.error(result.error);
        setCode('');
        return;
      }

      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 px-3.5">
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[380px]">
        {step === 'email' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px]">{translate('myBookingsAccessTitle')}</DialogTitle>
              <DialogDescription>{translate('myBookingsAccessDescription')}</DialogDescription>
            </DialogHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitEmail();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="access-email" className="text-[13px]">
                  {translate('emailLabel')}
                </Label>
                <Input
                  id="access-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-[38px]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {translate('cancel')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? translate('sendingCode') : translate('sendCode')}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px]">{translate('myBookingsCodeTitle')}</DialogTitle>
              <DialogDescription>{translate('myBookingsCodeDescription', { email })}</DialogDescription>
            </DialogHeader>

            <div className="flex justify-center py-2">
              <InputOTP
                maxLength={CODE_LENGTH}
                value={code}
                onChange={setCode}
                onComplete={submitCode}
                disabled={isPending}
              >
                <InputOTPGroup>
                  {CODE_SLOTS.map((index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {translate('cancel')}
              </Button>
              <Button onClick={() => submitCode(code)} disabled={isPending || code.length < CODE_LENGTH}>
                {isPending ? translate('verifyingCode') : translate('verifyCode')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
