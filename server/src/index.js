import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import expensesRoutes from './routes/expenses.js';
import adminRoutes from './routes/admin.js';

const app = express();

const port = Number(process.env.PORT || 5174);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
