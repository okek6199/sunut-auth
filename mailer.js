// Sends email via Brevo's HTTPS API (not SMTP — same reasoning as before,
// Railway was silently blocking outbound SMTP ports).
//
// We switched from Resend to Brevo specifically because Brevo lets you
// verify a single sender EMAIL ADDRESS you own (like a personal Gmail),
// with no domain purchase required. Resend requires a verified domain
// to send to recipients other than the account owner; Brevo doesn't.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Must exactly match the address you verified in Brevo's Senders tab.
const FROM_NAME = process.env.BREVO_FROM_NAME || 'sunut';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL; // e.g. sunutmail@gmail.com

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${process.env.BACKEND_URL}/api/verify-email?token=${token}`;

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: toEmail }],
      subject: 'Verify your email',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color:#3f6b3f;">Welcome to the Plant Shop 🌿</h2>
          <p>Thanks for signing up. Please confirm your email address to activate your account.</p>
          <p>
            <a href="${verifyUrl}"
               style="display:inline-block;padding:10px 20px;background:#3f6b3f;color:#fff;
                      text-decoration:none;border-radius:6px;">
              Verify my email
            </a>
          </p>
          <p>Or paste this link into your browser:<br>${verifyUrl}</p>
          <p style="color:#888;font-size:12px;">This link expires in 1 hour.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errorBody}`);
  }
}

module.exports = { sendVerificationEmail };
