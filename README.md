# Expense Tracker - Full Stack Application

A modern, full-stack expense tracking application with authentication, built with React, Node.js, Express, Prisma, and SQLite.

## 🚀 Tech Stack

### Frontend
- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 3** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** with **Express 4** - REST API
- **Prisma 6** - ORM
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Validation

## 🎯 Running the Application

### Run both servers together
```bash
npm run start:all
```

### Or run servers separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm start
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5174

## 🔐 Features

### Authentication
- User registration with email and password
- Secure login with JWT tokens
- Password hashing with bcryptjs
- Protected routes

### Expense Management
- Add expenses with amount, category, description, and date
- View all expenses in a beautiful UI
- Delete individual expenses
- Filter expenses by category
- Category breakdown visualization
- Monthly and total expense summaries

### Anomaly Detection
- Intelligent detection of unusual spending patterns
- Customizable sensitivity and time window
- Actionable suggestions for flagged expenses

## 📝 Usage

1. **Sign Up**: Create a new account with your email and password (min 8 characters)
2. **Login**: Use your credentials to login
3. **Add Expenses**: Fill in the amount, select a category, add description, and date
4. **View & Manage**: See all your expenses, filter by category, and delete as needed
5. **Track Insights**: Monitor anomaly alerts for unusual spending patterns

---

Made with ❤️ using modern web technologies
