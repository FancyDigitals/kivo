import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({
  email,
  fullName,
  token,
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://kivoo.com.ng';

  const verificationUrl =
    `${appUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      'Kivoo <hello@kivoo.com.ng>',
    to: [email],
    subject: 'Verify your Kivoo account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#111827">
        <h1 style="font-size:28px;margin-bottom:12px">
          Verify your Kivoo account
        </h1>

        <p style="font-size:16px;line-height:1.6">
          Hi ${escapeHtml(fullName || 'there')},
        </p>

        <p style="font-size:16px;line-height:1.6">
          Click the button below to verify your email address and activate your Kivoo account.
        </p>

        <p style="margin:32px 0">
          <a
            href="${verificationUrl}"
            style="display:inline-block;background:#08D9FF;color:#031018;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600"
          >
            Verify my email
          </a>
        </p>

        <p style="font-size:13px;color:#6B7280;line-height:1.6">
          This verification link expires in 24 hours.
        </p>

        <p style="font-size:13px;color:#6B7280;line-height:1.6">
          If you did not create a Kivoo account, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[RESEND ERROR]', error);
    throw new Error(error.message || 'Failed to send verification email.');
  }

  return data;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}