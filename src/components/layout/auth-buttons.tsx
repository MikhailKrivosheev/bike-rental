import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/server/auth";
import { getMyBookings } from "@/server/booking";
import { MyBookingsAccessDialog } from "./my-bookings-access-dialog";
import { MyBookingsDialog } from "./my-bookings-dialog";
import { SignOutButton } from "./sign-out-button";
import { SignInDialog } from "./sign-in-dialog";

export async function AuthButtons() {
  const translate = await getTranslations("Header");
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="hidden items-center gap-2.5 sm:flex">
        <MyBookingsAccessDialog label={translate("myBookings")} />
        <SignInDialog />
      </div>
    );
  }

  const bookings = await getMyBookings(user.id);

  return (
    <div className="hidden items-center gap-2.5 sm:flex">
      <span className="max-w-[180px] truncate text-sm text-muted-foreground" title={user.email}>
        {user.email}
      </span>
      <MyBookingsDialog bookings={bookings} label={translate("myBookings")} />
      <SignOutButton label={translate("signOut")} />
    </div>
  );
}
