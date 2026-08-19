'use client';

import { RiCalendarLine } from '@remixicon/react';
import { enUS, pt } from 'date-fns/locale';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { AnimatedPrice } from '@/components/booking/animated-price';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PICKUP_HOUR, accessories, rentalDurations, rentalPrice } from '@/lib/rental';
import { confirmBooking, createBooking } from '@/server/booking';

const dateFnsLocales = { en: enUS, pt } as const;

type BookingDialogProps = {
  bike: {
    id: string;
    model: string;
    pricePerHour: number;
    stationName: string;
  };
  className?: string;
};

type Step = 'details' | 'email' | 'code' | 'done';

/** `2026-08-20` in the user's own timezone, which is what the server expects. */
function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function BookingDialog({ bike, className }: BookingDialogProps) {
  const t = useTranslations('Booking');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('details');
  const [date, setDate] = useState<Date | undefined>();
  const [hours, setHours] = useState<number>(rentalDurations[0]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => rentalPrice(bike.pricePerHour, hours, selectedAccessories),
    [bike.pricePerHour, hours, selectedAccessories],
  );

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  function reset() {
    setStep('details');
    setDate(undefined);
    setHours(rentalDurations[0]);
    setSelectedAccessories([]);
    setEmail('');
    setCode('');
    setRentalId(null);
    setEndsAt(null);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      // Refresh once a booking went through so the catalogue shows it as taken.
      if (step === 'done') {
        router.refresh();
      }
      reset();
    }
  }

  function toggleAccessory(id: string, checked: boolean) {
    setSelectedAccessories((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  function submitEmail() {
    if (!date) {
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        bikeId: bike.id,
        date: toDateInput(date),
        hours,
        accessories: selectedAccessories,
        email,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRentalId(result.rentalId);
      setStep('code');
    });
  }

  function submitCode(value: string) {
    if (!rentalId) {
      return;
    }

    startTransition(async () => {
      const result = await confirmBooking(rentalId, value);

      if (!result.ok) {
        toast.error(result.error);
        setCode('');
        return;
      }

      setEndsAt(new Date(result.endsAt));
      setStep('done');
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className={className}>
          {t('trigger')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('title', { model: bike.model })}</DialogTitle>
              <DialogDescription>
                {t('pickupNote', { hour: PICKUP_HOUR, station: bike.stationName })}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{t('date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start font-normal">
                      <RiCalendarLine className="size-4" />
                      {date ? format.dateTime(date, { dateStyle: 'long' }) : t('pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={{ before: today }}
                      locale={dateFnsLocales[locale as keyof typeof dateFnsLocales] ?? enUS}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="duration">{t('duration')}</Label>
                <Select value={String(hours)} onValueChange={(value) => setHours(Number(value))}>
                  <SelectTrigger id="duration" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rentalDurations.map((duration) => (
                      <SelectItem key={duration} value={String(duration)}>
                        {t('durationOption', { hours: duration })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">{t('accessories')}</legend>
                {accessories.map((accessory) => (
                  <div key={accessory.id} className="flex items-center gap-3">
                    <Checkbox
                      id={accessory.id}
                      checked={selectedAccessories.includes(accessory.id)}
                      onCheckedChange={(checked) =>
                        toggleAccessory(accessory.id, checked === true)
                      }
                    />
                    <Label htmlFor={accessory.id} className="flex-1 font-normal">
                      {t(`accessory.${accessory.id}`)}
                    </Label>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      +{format.number(accessory.price / 100, { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                ))}
              </fieldset>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('total')}</span>
                <AnimatedPrice cents={total} className="text-xl font-semibold" />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setStep('email')} disabled={!date} className="w-full">
                {t('continue')}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === 'email' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('emailTitle')}</DialogTitle>
              <DialogDescription>{t('emailDescription')}</DialogDescription>
            </DialogHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitEmail();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('total')}</span>
                <AnimatedPrice cents={total} className="text-lg font-semibold" />
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep('details')}>
                  {t('back')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t('sending') : t('sendCode')}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('otpTitle')}</DialogTitle>
              <DialogDescription>{t('otpDescription', { email })}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={submitCode}
                disabled={isPending}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <DialogFooter>
              <Button
                onClick={() => submitCode(code)}
                disabled={isPending || code.length < 6}
                className="w-full"
              >
                {isPending ? t('confirming') : t('confirm')}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === 'done' && endsAt ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('successTitle')}</DialogTitle>
              <DialogDescription>
                {t('successDescription', {
                  model: bike.model,
                  until: format.dateTime(endsAt, { dateStyle: 'long', timeStyle: 'short' }),
                })}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button className="w-full" onClick={() => onOpenChange(false)}>
                {t('close')}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
