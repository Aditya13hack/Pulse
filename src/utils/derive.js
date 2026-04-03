// utils/derive.js

/**
 * Returns income and expense totals for the last 6 months.
 * Array ordered chronologically (oldest to newest).
 */
export const getMonthlyTotals = (transactions) => {
  const result = {};
  const now = new Date();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    result[key] = { month: key, income: 0, expense: 0, sortKey: d.getTime() };
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (result[key]) {
      if (tx.type === 'income') {
        result[key].income += tx.amount;
      } else if (tx.type === 'expense') {
        result[key].expense += tx.amount;
      }
    }
  });

  return Object.values(result).sort((a, b) => a.sortKey - b.sortKey).map(({ month, income, expense }) => ({ month, income, expense }));
};

/**
 * Returns total spend per category for a given month index (0-11) or all-time (if month is null).
 */
export const getCategoryBreakdown = (transactions, month = null) => {
  const result = {};
  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (month !== null && d.getMonth() !== month) return;

    result[tx.category] = (result[tx.category] || 0) + tx.amount;
  });

  return Object.entries(result)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
};

/**
 * Returns daily running balance, assuming starting balance was 0 
 * before the earliest transaction in the set.
 * Sorted chronologically.
 */
export const getRunningBalance = (transactions) => {
  // Sort chronologically (oldest to newest)
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let balance = 0;
  const dailyBalances = [];
  
  let currentDayStr = null;
  let currentDayBalance = 0;

  sorted.forEach((tx) => {
    const d = new Date(tx.date);
    const dayStr = d.toLocaleDateString('en-US');
    
    balance += (tx.type === 'income' ? tx.amount : -tx.amount);
    
    if (dayStr !== currentDayStr) {
      if (currentDayStr !== null) {
        dailyBalances.push({ date: currentDayStr, balance: currentDayBalance });
      }
      currentDayStr = dayStr;
    }
    currentDayBalance = balance;
  });

  if (currentDayStr !== null) {
    dailyBalances.push({ date: currentDayStr, balance: currentDayBalance });
  }

  return dailyBalances;
};

/**
 * Returns top N merchants by total spend (expenses only).
 */
export const getTopMerchants = (transactions, n = 5) => {
  const result = {};
  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return;
    result[tx.merchant] = (result[tx.merchant] || 0) + tx.amount;
  });

  return Object.entries(result)
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
};

/**
 * Returns spend separated into 4 weeks of a given month.
 */
export const getWeeklySpend = (transactions, month = new Date().getMonth()) => {
  const weeks = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4+': 0 };

  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() === month) {
      const day = d.getDate();
      if (day <= 7) weeks['Week 1'] += tx.amount;
      else if (day <= 14) weeks['Week 2'] += tx.amount;
      else if (day <= 21) weeks['Week 3'] += tx.amount;
      else weeks['Week 4+'] += tx.amount;
    }
  });

  return Object.entries(weeks).map(([week, amount]) => ({ week, amount }));
};

/**
 * Returns savings rate (income - expense) / income * 100 for a given month.
 * Returns 0 if income is 0.
 */
export const getSavingsRate = (transactions, month = new Date().getMonth()) => {
  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    if (d.getMonth() === month) {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    }
  });

  if (income === 0) return 0;
  const saved = income - expense;
  return Number(((saved / income) * 100).toFixed(2));
};
