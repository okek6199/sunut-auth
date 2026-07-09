# Login + Registration with Email Verification (100% free stack)

This adds accounts to your ornamental plants shop without changing how your
existing static site is hosted. You'll run **two separate things on Railway**:

1. Your current static site (unchanged) — the shop pages.
2. A new small backend service (the code in `server/`) — handles
   register/login/verify and talks to the database.

The two free services connecting the pieces are:

| Piece | Service | Why |
|---|---|---|
| Database | [Neon](https://neon.tech) | Free Postgres forever (0.5GB), no card required |
| Verification emails | Gmail SMTP (your own Gmail + an App Password) | Free, ~500 emails/day, no domain needed |
| Backend hosting | Railway (you already use this) | Same platform as your frontend |

---

## 1. Create the free database (Neon)

1. Go to neon.tech → sign up free → **New Project**.
2. Once created, open **Connection Details** and copy the connection string.
   It looks like `postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require`.
3. Open Neon's **SQL Editor** and paste the contents of `server/schema.sql`,
   then run it. This creates the `users` table.

## 2. Get a free Gmail "App Password" for sending emails

Regular Gmail passwords won't work for sending mail from code — you need an
App Password:

1. Turn on 2-Step Verification on your Google account (Settings → Security).
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password named e.g. "plant shop" → copy the 16-character code.
4. That's your `GMAIL_APP_PASSWORD`. Your normal Gmail address is `GMAIL_USER`.

(If you outgrow Gmail's limits later, swap `server/mailer.js` for
[Resend](https://resend.com) or [Brevo](https://brevo.com) — both have
generous free tiers with a similar `sendMail`-style API.)

## 3. Deploy the backend to Railway

1. Push the `server/` folder to a new GitHub repo (or a subfolder of your
   existing one).
2. In Railway: **New Project → Deploy from GitHub repo** → pick it.
3. In Railway's **Variables** tab for this service, add every key from
   `server/.env.example` with your real values:
   - `DATABASE_URL` → from Neon
   - `JWT_SECRET` → run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` locally to generate one
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD` → from step 2
   - `BACKEND_URL` → Railway will show you this service's public URL after first deploy (e.g. `https://plant-shop-auth-production.up.railway.app`) — paste it back in once you have it
   - `FRONTEND_URL` → your existing static site's Railway URL
4. Railway auto-detects Node from `package.json` and runs `npm start`.

## 4. Wire up the frontend

1. Copy `public/register.html`, `public/login.html`, `public/auth.css`, and
   `public/auth.js` into your existing static site's repo (same folder as
   your `index.html`).
2. In `auth.js`, set `API_BASE_URL` to your backend's Railway URL from step 3.
3. Add "Log in" / "Sign up" links somewhere in your existing `index.html`
   pointing to `login.html` and `register.html`.
4. Push to GitHub — Railway redeploys your static site automatically.

## 5. Test the full flow

1. Visit `register.html` on your live site, sign up with a real email you
   can check.
2. Check your inbox for the verification email (check spam the first time).
3. Click the link → you're redirected to `login.html?verified=1`.
4. Log in. A secure `httpOnly` cookie is set and `/api/me` will confirm the
   session.

---

## How the pieces fit together

```
[register.html] --POST /api/register--> [Railway backend] --INSERT--> [Neon Postgres]
                                              |
                                              +--sends--> [verification email via Gmail]

User clicks email link
[Gmail inbox] --GET /api/verify-email?token=...--> [Railway backend] --UPDATE is_verified--> [Neon]
                                              |
                                              +--redirects to--> [login.html]

[login.html] --POST /api/login--> [Railway backend] --compares bcrypt hash--> [Neon]
                                              |
                                              +--sets httpOnly JWT cookie-->
```

## Security notes (already handled in the code, worth knowing)

- Passwords are never stored in plain text — `bcrypt` hashes them before
  they touch the database.
- Sessions use a signed JWT in an `httpOnly` cookie, so JavaScript on the
  page (and therefore XSS attacks) can't read it.
- Verification tokens expire after 1 hour and are single-use.
- CORS is locked to your specific frontend URL, not `*`.
