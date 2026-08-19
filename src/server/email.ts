import 'server-only';

type VerificationEmail = {
  to: string;
  code: string;
  bikeModel: string;
};

/**
 * Delivery is not wired up yet — the OTP will be sent with Resend once the
 * account is set up. Until then the code is logged so the flow is testable.
 */
export async function sendVerificationCode({ to, code, bikeModel }: VerificationEmail) {
  console.info(`[booking] verification code for ${to} (${bikeModel}): ${code}`);
}
