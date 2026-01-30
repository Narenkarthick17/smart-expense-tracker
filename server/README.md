# Expense Tracker API

## Setup

1) Install deps

```bash
cd server
npm install
```

2) Create `.env`

Copy `.env.example` to `.env` and set `JWT_SECRET`.

3) Migrate + seed

```bash
npm run migrate
npm run seed
```

4) Run

```bash
npm run dev
```

Health check: `GET http://localhost:5174/api/health`
