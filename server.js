require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('./db');
const { sendVerificationEmail } = require('./mailer');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
    res.send("Backend is running");
});
// Allow requests from your static frontend on Railway.
// Add both your Railway URL and localhost while testing.
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true,
}));

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error('Database test failed:', err);
    res.status(500).json({
      error: err.message
    });
  }
});
// ---------- REGISTER ----------
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Valid email and a password of 8+ characters are required.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await pool.query(
      `INSERT INTO users (email, password_hash, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4)`,
      [email.toLowerCase(), passwordHash, verificationToken, expires]
    );

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Account created. Check your email to verify your address.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ---------- VERIFY EMAIL ----------
// User clicks the link in their inbox -> browser hits this endpoint directly.
app.get('/api/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing verification token.');

    const result = await pool.query(
      'SELECT id, verification_token_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send('Invalid or already-used verification link.');
    }

    const user = result.rows[0];
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).send('This verification link has expired. Please register again or request a new link.');
    }

    await pool.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Send the user back to your static site's login page.
    res.redirect(`${process.env.FRONTEND_URL}/login.html?verified=1`);
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).send('Something went wrong verifying your email.');
  }
});

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,      // requires HTTPS (Railway gives you this by default)
      sameSite: 'none',  // needed because frontend and backend are different domains
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Logged in successfully.', email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ---------- LOGOUT ----------
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
});

// ---------- WHO AM I (used to protect pages / show account state) ----------
app.get('/api/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not logged in.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email: payload.email });
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));
