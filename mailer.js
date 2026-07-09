const nodemailer = require('nodemailer');

// Free option: a Gmail account + an "App Password" (not your normal password).
// See README for the 2-minute setup. Swap this out for Resend/Brevo later
// if you outgrow Gmail's sending limits (~500/day).
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${process.env.BACKEND_URL}/api/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Ornamental Plants Shop" <${process.env.GMAIL_USER}>`,
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
  });
}

module.exports = { sendVerificationEmail };
