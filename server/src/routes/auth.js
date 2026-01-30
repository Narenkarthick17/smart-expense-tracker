import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

const loginSchema = registerSchema;

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { email: user.email, role: user.role },
    secret,
    { subject: user.id, expiresIn }
  );
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'USER' },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const token = signToken(user);
  return res.status(201).json({ token, user });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const safeUser = { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
  const token = signToken(safeUser);

  return res.json({ token, user: safeUser });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return res.json({ user });
});

export default router;
