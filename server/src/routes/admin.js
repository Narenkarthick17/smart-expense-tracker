import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, role: true, createdAt: true, _count: { select: { expenses: true } } },
  });

  return res.json({ users });
});

const roleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

router.patch('/users/:id/role', async (req, res) => {
  const id = String(req.params.id);
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return res.json({ user });
});

router.delete('/users/:id', async (req, res) => {
  const id = String(req.params.id);

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Admins cannot delete themselves' });
  }

  await prisma.user.delete({ where: { id } });
  return res.status(204).send();
});

router.get('/expenses', async (req, res) => {
  const expenses = await prisma.expense.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { user: { select: { id: true, email: true } } },
  });

  return res.json({ expenses });
});

export default router;
