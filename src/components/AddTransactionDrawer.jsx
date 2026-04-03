import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { useStore } from '../store';

const CATEGORIES = [
  "food", "transport", "entertainment", "utilities",
  "health", "shopping", "emi", "transfer", "salary", "freelance"
];

export function AddTransactionDrawer() {
  const { ui, setUI, addTransaction, addToast } = useStore();
  const isOpen = ui.addTransactionOpen;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [category, setCategory] = useState('food');

  const closeDrawer = () => setUI({ addTransactionOpen: false });

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setMerchant('');
    setDate(new Date().toISOString().slice(0, 10));
    setCategory('food');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!merchant.trim()) {
      addToast('Please enter a merchant or description.', 'error');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      addToast('Please enter a valid amount greater than 0.', 'error');
      return;
    }

    const finalAmount = type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    addTransaction({
      merchant: merchant.trim(),
      amount: finalAmount,
      date: new Date(date).toISOString(),
      category: category,
      type: type
    });

    addToast('Transaction added successfully!', 'success');
    resetForm();
    closeDrawer();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[110] w-full max-w-[420px] bg-[var(--bg-base)] border-l border-white/5 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h2 className="text-xl font-semibold text-text-primary tracking-tight">New Transaction</h2>
              <button 
                onClick={closeDrawer}
                className="p-2 -mr-2 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Type Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                    type === 'expense' 
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)]' 
                      : 'bg-[var(--bg-card)] border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-5 h-5" />
                  <span className="font-semibold text-sm">Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                    type === 'income' 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-[var(--bg-card)] border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="font-semibold text-sm">Income</span>
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Amount</label>
                <div className="relative flex items-center bg-[var(--bg-card)] border border-white/5 focus-within:border-[var(--accent-primary)] focus-within:ring-1 focus-within:ring-[var(--accent-primary)] rounded-xl transition-all">
                  <span className="pl-4 text-text-muted font-mono text-xl">₹</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-white text-2xl font-mono py-3 px-3 placeholder:text-text-muted/50 transition-all"
                  />
                </div>
              </div>

              {/* Merchant / Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Merchant or Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Amazon, Uber, Grocery Store"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-white/5 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] rounded-xl px-4 py-3 text-white placeholder:text-text-muted/50 outline-none transition-all"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-white/5 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] rounded-xl px-4 py-3 text-white outline-none transition-all color-scheme-dark"
                  style={{ colorScheme: 'dark' }} // Force dark calendar picker
                />
              </div>

              {/* Category */}
              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-text-muted" />
                  <label className="text-sm font-medium text-text-secondary">Category</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = category === cat;
                    const catColorVar = `var(--color-cat-${cat})`;
                    
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-[8px] text-xs font-bold uppercase tracking-wider transition-all border ${
                          isSelected 
                            ? 'shadow-sm' 
                            : 'bg-[var(--bg-card)] border-white/5 text-text-muted hover:border-white/10 hover:text-white'
                        }`}
                        style={isSelected ? {
                          backgroundColor: `${catColorVar}15`,
                          borderColor: `${catColorVar}50`,
                          color: catColorVar
                        } : {}}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="mt-auto pt-4">
                <button 
                  type="submit"
                  className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  Add Transaction
                </button>
              </div>

            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
