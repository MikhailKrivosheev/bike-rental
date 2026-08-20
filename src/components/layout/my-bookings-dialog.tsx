'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import type { MyBooking } from '@/server/booking';
import { Button } from 'Components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'Components/ui/dialog';

export function MyBookingsDialog({ bookings, label }: { bookings: MyBooking[]; label: string }) {
  const translate = useTranslations('MyBookings');
  const format = useFormatter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 px-3.5">
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[17px]">{translate('title')}</DialogTitle>
          <DialogDescription>{translate('description')}</DialogDescription>
        </DialogHeader>

        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{translate('empty')}</p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-1.5 rounded-[10px] bg-muted px-3.5 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{booking.bikeModel}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {translate(`status.${booking.status}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-muted-foreground">
                  <span>{format.dateTime(new Date(booking.startsAt), { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span className="font-medium text-foreground">
                    {format.number(booking.totalPrice / 100, { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
