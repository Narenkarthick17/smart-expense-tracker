import React, { useMemo, useState, useEffect } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Calendar, IndianRupee, Wallet, Home, ShoppingBag, Coffee, Zap, Phone, BookOpen, Heart, Bus, Film, Gift, AlertTriangle, Sparkles, SlidersHorizontal, Info } from 'lucide-react';

const EXPENSES_STORAGE_KEY = 'tn-expenses';

const getStorage = () => {
  if (typeof window !== 'undefined' && window.storage) {
    return window.storage;
  }

  return {
    async get(key) {
      return { value: window.localStorage.getItem(key) };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
    },
    async delete(key) {
      window.localStorage.removeItem(key);
    },
  };
};

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const median = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const medianAbsoluteDeviation = (values, med) => {
  if (!values || values.length === 0) return 0;
  const deviations = values.map((v) => Math.abs(v - med));
  return median(deviations);
};

const daysAgo = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};

const safeDate = (dateLike) => {
  const d = new Date(dateLike);
  return Number.isNaN(d.getTime()) ? null : d;
};

const buildSuggestions = ({ expense, categoryMedian, zScore }) => {
  const suggestions = [];
  const desc = String(expense.description || '').toLowerCase();
  const cat = String(expense.category || '').toLowerCase();

  if (zScore >= 6) {
    suggestions.push('Double-check the amount (extra zero / decimal) and confirm the date.');
  } else {
    suggestions.push('If this is correct, consider setting a soft limit for this category.');
  }

  if (categoryMedian > 0 && expense.amount >= categoryMedian * 2) {
    suggestions.push('If this includes multiple items, split it into separate entries for better tracking.');
  }

  if (cat.includes('food') || cat.includes('tiffin') || desc.includes('swiggy') || desc.includes('zomato')) {
    suggestions.push('Try a weekly food cap or batch-cooking on weekdays to reduce spikes.');
  }

  if (cat.includes('transport') || desc.includes('uber') || desc.includes('ola') || desc.includes('petrol')) {
    suggestions.push('Compare routes/vendors and track “commute vs. non-commute” rides separately.');
  }

  if (cat.includes('mobile') || cat.includes('internet') || desc.includes('recharge')) {
    suggestions.push('Review your plan/add-ons; one-time packs can inflate the month.');
  }

  if (cat.includes('electricity') || cat.includes('water') || desc.includes('eb') || desc.includes('tneb')) {
    suggestions.push('If this is a bill jump, check meter/bill period and note it in the description.');
  }

  if (cat.includes('festivals') || cat.includes('functions') || desc.includes('wedding') || desc.includes('function')) {
    suggestions.push('Consider a separate “events” sinking fund so these don’t surprise you.');
  }

  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra')) {
    suggestions.push('Add a quick tag like “need/want” to spot impulse vs. essentials later.');
  }

  return Array.from(new Set(suggestions)).slice(0, 4);
};

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState('all');

  const [insightsWindowDays, setInsightsWindowDays] = useState(45);
  const [insightsSensitivity, setInsightsSensitivity] = useState(3.5);
  const [insightsMinHistory, setInsightsMinHistory] = useState(5);

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
      const storage = getStorage();
      const result = await storage.get(EXPENSES_STORAGE_KEY);
      if (result && result.value) {
        setExpenses(JSON.parse(result.value));
      }
    } catch {
      console.log('No previous expenses found');
    }
  };

  const saveExpenses = async (newExpenses) => {
    try {
      const storage = getStorage();
      await storage.set(EXPENSES_STORAGE_KEY, JSON.stringify(newExpenses));
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
        const storage = getStorage();
        await storage.delete(EXPENSES_STORAGE_KEY);
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

  const anomalyInsights = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const cutoff = daysAgo(insightsWindowDays);
    const recentExpenses = expenses
      .map((e) => ({ ...e, _dateObj: safeDate(e.date) }))
      .filter((e) => e._dateObj && e._dateObj >= cutoff);

    const byCategory = new Map();
    for (const exp of recentExpenses) {
      const key = exp.category || 'Uncategorized';
      const list = byCategory.get(key) || [];
      list.push(exp);
      byCategory.set(key, list);
    }

    const insights = [];

    for (const exp of recentExpenses) {
      const history = (byCategory.get(exp.category) || []).filter((e) => e.id !== exp.id);
      if (history.length < insightsMinHistory) continue;

      const amounts = history.map((h) => Number(h.amount || 0)).filter((n) => Number.isFinite(n) && n > 0);
      if (amounts.length < insightsMinHistory) continue;

      const med = median(amounts);
      const mad = medianAbsoluteDeviation(amounts, med);
      const robustSigma = 1.4826 * mad;

      const amountValue = Number(exp.amount || 0);
      if (!Number.isFinite(amountValue) || amountValue <= 0) continue;

      let zScore = null;
      if (robustSigma > 0) {
        zScore = (amountValue - med) / robustSigma;
      }

      const ratio = med > 0 ? amountValue / med : null;
      const isAnomaly =
        (zScore !== null && zScore >= insightsSensitivity && amountValue >= med * 1.25) ||
        (zScore === null && ratio !== null && ratio >= 2.75);

      if (!isAnomaly) continue;

      insights.push({
        expense: exp,
        categoryMedian: med,
        categoryCount: amounts.length,
        zScore: zScore === null ? null : Number(zScore.toFixed(2)),
        ratio: ratio === null ? null : Number(ratio.toFixed(2)),
        suggestions: buildSuggestions({ expense: exp, categoryMedian: med, zScore: zScore ?? 0 }),
      });
    }

    insights.sort((a, b) => {
      const az = a.zScore ?? 0;
      const bz = b.zScore ?? 0;
      if (bz !== az) return bz - az;
      return (b.expense.amount || 0) - (a.expense.amount || 0);
    });

    return insights.slice(0, 8);
  }, [expenses, insightsMinHistory, insightsSensitivity, insightsWindowDays]);

  const anomalyById = useMemo(() => {
    const m = new Map();
    for (const a of anomalyInsights) m.set(a.expense.id, a);
    return m;
  }, [anomalyInsights]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <IndianRupee className="text-orange-600" size={40} />
             Expense Tracker
          </h1>
          <p className="text-gray-600">Track your expenses the smart way!</p>
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
            {/* Anomaly Insights */}
            {expenses.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="text-amber-600" />
                      Anomaly Insights
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <Info size={16} className="text-gray-400" />
                      Flags unusually high expenses compared to your recent pattern.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Sparkles className="text-orange-500" size={18} />
                    <span className="text-sm font-medium">Top {anomalyInsights.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" /> Window
                      </p>
                      <span className="text-sm text-gray-600">{insightsWindowDays} days</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="120"
                      step="1"
                      value={insightsWindowDays}
                      onChange={(e) => setInsightsWindowDays(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-gray-500" /> Sensitivity
                      </p>
                      <span className="text-sm text-gray-600">{insightsSensitivity.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="2.5"
                      max="6"
                      step="0.1"
                      value={insightsSensitivity}
                      onChange={(e) => setInsightsSensitivity(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher = fewer alerts</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Wallet size={16} className="text-gray-500" /> History
                      </p>
                      <span className="text-sm text-gray-600">min {insightsMinHistory}</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="1"
                      value={insightsMinHistory}
                      onChange={(e) => setInsightsMinHistory(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Needs enough past entries per category</p>
                  </div>
                </div>

                {anomalyInsights.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-emerald-800 flex items-center gap-3">
                    <TrendingDown className="text-emerald-600" />
                    <div>
                      <p className="font-semibold">No anomalies detected</p>
                      <p className="text-sm text-emerald-700">Add more data or lower sensitivity to see alerts.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalyInsights.map(({ expense, categoryMedian, categoryCount, zScore, ratio, suggestions }) => (
                      <div key={expense.id} className="border border-amber-200 bg-amber-50/40 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{expense.description}</p>
                            <p className="text-sm text-gray-700">{expense.category} • {new Date(expense.date).toLocaleDateString('en-IN')}</p>
                            <p className="text-sm text-gray-700 mt-1">
                              Typical: <span className="font-semibold">{formatINR(categoryMedian)}</span> (n={categoryCount}) • This: <span className="font-semibold">{formatINR(expense.amount)}</span>
                              {zScore !== null ? (
                                <span className="text-gray-600"> • z={zScore}</span>
                              ) : ratio !== null ? (
                                <span className="text-gray-600"> • ×{ratio}</span>
                              ) : null}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-gray-900">{formatINR(expense.amount)}</p>
                            <p className="text-xs text-amber-800 font-semibold">Unusual spend</p>
                          </div>
                        </div>

                        <div className="mt-3 bg-white/70 rounded-lg p-3">
                          <p className="text-sm font-semibold text-gray-800 mb-2">Suggestions</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {suggestions.map((s) => (
                              <div key={s} className="text-sm text-gray-700 bg-white rounded-md border border-gray-100 p-2">
                                {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                    const anomaly = anomalyById.get(expense.id);
                    
                    return (
                      <div
                        key={expense.id}
                        className={
                          anomaly
                            ? 'flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100/60 transition-colors'
                            : 'flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                        }
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`${colorClass} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Icon className="text-white" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate flex items-center gap-2">
                              {anomaly && <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />}
                              <span className="truncate">{expense.description}</span>
                            </p>
                            <p className="text-sm text-gray-600">{expense.category}</p>
                            <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString('en-IN')}</p>
                            {anomaly && (
                              <p className="text-xs text-amber-800 mt-1">
                                Typical {formatINR(anomaly.categoryMedian)} • {anomaly.zScore !== null ? `z=${anomaly.zScore}` : anomaly.ratio !== null ? `×${anomaly.ratio}` : 'Unusual'}
                              </p>
                            )}
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