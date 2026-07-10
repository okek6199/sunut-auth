// Sends email via Resend's HTTPS API instead of SMTP.
// We switched away from Gmail SMTP because Railway's network was
// silently blocking outbound SMTP connections (ports 465/587) —
// confirmed via repeated "Connection timeout" errors. Resend sends
// over plain HTTPS (port 443), same as any normal API call, so it
// isn't affected by that block.

const RESEND_API_URL = 'https://api.resend.com/emails';

// "onboarding@resend.dev" works immediately with no setup, for testing.
// Once you verify your own domain in the Resend dashboard, switch this
// to something like "accounts@yourdomain.com" for a more trustworthy
// "from" address.
const FROM_ADDRESS = process.env.RESEND_FROM || 'Ornamental Plants Shop <onboarding@resend.dev>';

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${process.env.BACKEND_URL}/api/verify-email?token=${token}`;

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: 'Verify your email',
      html: `
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
    throw new Error(`Resend API error (${res.status}): ${errorBody}`);
  }
}

module.exports = { sendVerificationEmail };
