import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const expenseCreateSchema = z.object({
  amount: z.number().finite().positive(),
  category: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  date: z.string().min(1),
});

const expenseUpdateSchema = expenseCreateSchema.partial();

router.get('/', async (req, res) => {
  const userId = req.user.role === 'ADMIN' && req.query.userId ? String(req.query.userId) : req.user.id;

  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return res.json({ expenses });
});

router.post('/', async (req, res) => {
  const parsed = expenseCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { amount, category, description, date } = parsed.data;
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return res.status(400).json({ error: 'Invalid date' });

  const expense = await prisma.expense.create({
    data: {
      userId: req.user.id,
      amount,
      category,
      description: description || null,
      date: dateObj,
    },
  });

  return res.status(201).json({ expense });
});

router.put('/:id', async (req, res) => {
  const id = String(req.params.id);
  const parsed = expenseUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Expense not found' });

  if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const data = { ...parsed.data };
  if (data.date) {
    const d = new Date(data.date);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid date' });
    data.date = d;
  }

  const expense = await prisma.expense.update({ where: { id }, data });
  return res.json({ expense });
});

router.delete('/:id', async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Expense not found' });

  if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.expense.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
