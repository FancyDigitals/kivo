import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail({
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

  const resetUrl =
    `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const safeName = escapeHtml(fullName || 'there');

  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      'Kivoo <hello@kivoo.com.ng>',

    to: [email],

    subject: 'Reset your Kivoo password',

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your Kivoo password</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#050914;
    font-family:Arial,Helvetica,sans-serif;
    color:#ffffff;
  "
>
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#050914;"
  >
    <tr>
      <td align="center" style="padding:48px 20px;">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width:620px;"
        >

          <!-- BRAND -->
          <tr>
            <td style="padding:0 0 28px 4px;">
              <img
                src="https://kivoo.com.ng/logos/white-logo.png"
                alt="Kivoo"
                width="140"
                style="
                  display:block;
                  width:140px;
                  height:auto;
                  border:0;
                  outline:none;
                  text-decoration:none;
                "
              />
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td
              style="
                background:#0A111E;
                border:1px solid rgba(255,255,255,0.09);
                border-radius:24px;
                padding:44px 42px;
              "
            >

              <!-- ACCENT -->
              <div
                style="
                  width:42px;
                  height:4px;
                  background:#08D9FF;
                  border-radius:10px;
                  margin-bottom:30px;
                "
              ></div>

              <!-- HEADING -->
              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:34px;
                  line-height:1.08;
                  letter-spacing:-1.5px;
                  font-weight:700;
                "
              >
                Reset your password.
              </h1>

              <p
                style="
                  margin:14px 0 0;
                  color:#94A3B8;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Hi ${safeName}, we received a request to reset
                your Kivoo account password.
              </p>

              <!-- MESSAGE -->
              <p
                style="
                  margin:30px 0 0;
                  color:#CBD5E1;
                  font-size:15px;
                  line-height:1.75;
                "
              >
                Click the button below to create a new password
                for your Kivoo workspace.
              </p>

              <!-- BUTTON -->
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin-top:32px;"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#08D9FF"
                    style="border-radius:12px;"
                  >
                    <a
                      href="${resetUrl}"
                      style="
                        display:inline-block;
                        padding:15px 25px;
                        color:#031018;
                        background:#08D9FF;
                        border-radius:12px;
                        font-size:14px;
                        font-weight:700;
                        text-decoration:none;
                      "
                    >
                      Reset my password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- EXPIRY -->
              <p
                style="
                  margin:30px 0 0;
                  padding-top:24px;
                  border-top:1px solid rgba(255,255,255,0.07);
                  color:#64748B;
                  font-size:12px;
                  line-height:1.7;
                "
              >
                This password reset link expires in 30 minutes.
              </p>

              <!-- FALLBACK URL -->
              <p
                style="
                  margin:20px 0 0;
                  color:#64748B;
                  font-size:11px;
                  line-height:1.7;
                  word-break:break-all;
                "
              >
                If the button doesn't work, copy and paste this
                link into your browser:
                <br />
                <span style="color:#08BFE0;">
                  ${escapeHtml(resetUrl)}
                </span>
              </p>

              <!-- SECURITY -->
              <p
                style="
                  margin:24px 0 0;
                  color:#475569;
                  font-size:11px;
                  line-height:1.7;
                "
              >
                If you did not request a password reset, you can
                safely ignore this email. Your password will remain
                unchanged.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              style="padding:26px 10px 0;"
            >
              <p
                style="
                  margin:0;
                  color:#475569;
                  font-size:11px;
                  line-height:1.7;
                "
              >
                You're receiving this because a password reset
                was requested for this email address.
              </p>

              <p
                style="
                  margin:8px 0 0;
                  color:#334155;
                  font-size:11px;
                "
              >
                © ${new Date().getFullYear()} Kivoo
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('[RESEND PASSWORD RESET ERROR]', error);

    throw new Error(
      error.message ||
        'Failed to send password reset email.'
    );
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
