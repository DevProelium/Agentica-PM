import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import crypto  from 'crypto';
import { query, withTransaction } from '../config/database.js';
import { env } from '../config/env.js';

function signAccess(user) {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function signRefresh(user) {
  return jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1,$2,$3) RETURNING id, username, email, coins, gems, created_at`,
      [username, email, hash]
    );
    const user = rows[0];

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);
    const refreshHash  = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
      [user.id, refreshHash, expiresAt]
    );

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);
    const refreshHash  = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
      [user.id, refreshHash, expiresAt]
    );

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    let payload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { rows } = await query(
      `SELECT * FROM refresh_tokens
       WHERE user_id=$1 AND token_hash=$2 AND expires_at > NOW()`,
      [payload.id, hash]
    );
    if (!rows[0]) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    const { rows: users } = await query('SELECT * FROM users WHERE id=$1', [payload.id]);
    if (!users[0]) return res.status(401).json({ error: 'User not found' });

    const accessToken = signAccess(users[0]);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hash]);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
