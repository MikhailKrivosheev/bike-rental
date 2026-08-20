import 'server-only';
import { Resend } from 'resend';

type VerificationEmail = {
  to: string;
  code: string;
  bikeModel: string;
};

type LoginEmail = {
  to: string;
  code: string;
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

/** Falls back to logging the code when RESEND_API_KEY isn't set, so local dev keeps working. */
async function send(to: string, subject: string, code: string) {
  if (!resend) {
    console.info(`[email] (RESEND_API_KEY unset) ${subject} for ${to}: ${code}`);
    return;
  }
  await resend.emails.send({
    from,
    to,
    subject,
    text: `Your code is ${code}. It expires in a few minutes.`,
  });
}

export async function sendVerificationCode({ to, code, bikeModel }: VerificationEmail) {
  await send(to, `Verification code for your ${bikeModel} booking`, code);
}

/** Same delivery path as sendVerificationCode, for the "My bookings" access code. */
export async function sendLoginCode({ to, code }: LoginEmail) {
  await send(to, 'Your login code', code);
}
