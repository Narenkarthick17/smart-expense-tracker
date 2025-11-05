import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Calendar, IndianRupee, Wallet, Home, ShoppingBag, Coffee, Zap, Phone, BookOpen, Heart, Bus, Film, Gift } from 'lucide-react';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState('all');

  // Tamil Nadu specific categories with Indian context
  const categories = [
    { name: 'Groceries & Provisions', icon: ShoppingBag, color: 'bg-green-500' },
    { name: 'Rent/Housing', icon: Home, color: 'bg-blue-500' },
    { name: 'Food & Tiffin', icon: Coffee, color: 'bg-orange-500' },
    { name: 'Electricity & Water', icon: Zap, color: 'bg-yellow-500' },
    { name: 'Mobile & Internet', icon: Phone, color: 'bg-purple-500' },
    { name: 'Education & Tuition', icon: BookOpen, color: 'bg-indigo-500' },
    { name: 'Healthcare & Medicine', icon: Heart, color: 'bg-red-500' },
    { name: 'Transport & Petrol', icon: Bus, color: 'bg-cyan-500' },
    { name: 'Entertainment & Movies', icon: Film, color: 'bg-pink-500' },
    { name: 'Festivals & Functions', icon: Gift, color: 'bg-rose-500' },
  ];

  // Load expenses from storage
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const result = await window.storage.get('tn-expenses');
      if (result && result.value) {
        setExpenses(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No previous expenses found');
    }
  };

  const saveExpenses = async (newExpenses) => {
    try {
      await window.storage.set('tn-expenses', JSON.stringify(newExpenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  };

  const addExpense = () => {
    if (!amount || !category) {
      alert('Please fill amount and category!');
      return;
    }

    const newExpense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category,
      description: description || 'No description',
      date,
      timestamp: new Date().toISOString()
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const deleteExpense = (id) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all expenses? This cannot be undone!')) {
      try {
        await window.storage.delete('tn-expenses');
        setExpenses([]);
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  };

  // Calculate totals
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpense = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Category-wise breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  // Filter expenses
  const filteredExpenses = filter === 'all' 
    ? expenses 
    : expenses.filter(exp => exp.category === filter);

  // Get category color
  const getCategoryColor = (categoryName) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat ? cat.color : 'bg-gray-500';
  };

  // Get category icon
  const getCategoryIcon = (categoryName) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat ? cat.icon : Wallet;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <IndianRupee className="text-orange-600" size={40} />
             Expense Tracker
          </h1>
          <p className="text-gray-600">Track your expenses the smart way! 💰</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 mb-1">Total Expenses</p>
                <p className="text-3xl font-bold flex items-center gap-1">
                  ₹{totalExpense.toLocaleString('en-IN')}
                </p>
              </div>
              <TrendingUp size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">This Month</p>
                <p className="text-3xl font-bold flex items-center gap-1">
                  ₹{monthlyExpense.toLocaleString('en-IN')}
                </p>
              </div>
              <Calendar size={48} className="opacity-80" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PlusCircle className="text-orange-600" />
                Add Expense
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Monthly groceries from Nilgiris"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={addExpense}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
                >
                  Add Expense
                </button>

                <button
                  onClick={clearAllData}
                  className="w-full bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-all text-sm"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          {/* Expenses List and Category Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Breakdown */}
            {Object.keys(categoryTotals).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Category Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, total]) => {
                      const Icon = getCategoryIcon(cat);
                      const colorClass = getCategoryColor(cat);
                      return (
                        <div key={cat} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className={`${colorClass} w-10 h-10 rounded-full flex items-center justify-center mb-2`}>
                            <Icon className="text-white" size={20} />
                          </div>
                          <p className="text-xs text-gray-600 mb-1 truncate">{cat}</p>
                          <p className="text-lg font-bold text-gray-800">₹{total.toLocaleString('en-IN')}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Expenses</h2>
              
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wallet size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No expenses yet!</p>
                  <p className="text-sm">Start adding your daily expenses above</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredExpenses.map((expense) => {
                    const Icon = getCategoryIcon(expense.category);
                    const colorClass = getCategoryColor(expense.category);
                    
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`${colorClass} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Icon className="text-white" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{expense.description}</p>
                            <p className="text-sm text-gray-600">{expense.category}</p>
                            <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-gray-800 whitespace-nowrap">
                            ₹{expense.amount.toLocaleString('en-IN')}
                          </p>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>Made with ❤️ | All expenses saved locally</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;