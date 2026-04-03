import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { transactions as initialTransactions } from '../data/transactions';

const DEFAULT_BUDGETS = {
  food: 5000,
  transport: 2000,
  entertainment: 3000,
  utilities: 2500,
  health: 2000,
  shopping: 4000,
  emi: 10000,
  transfer: 5000,
  salary: 0,
  freelance: 0,
};

export const useStore = create(
  persist(
    (set) => ({
      // Transactions Slice
      transactions: initialTransactions,
      addTransaction: (tx) => {
        const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        set((state) => ({ transactions: [{ ...tx, id }, ...state.transactions] }));
      },
      editTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),

      // Filters Slice
      filters: { search: '', categories: [], type: 'all', month: null, sortBy: 'newest' },
      setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      resetFilters: () =>
        set(() => ({
          filters: { search: '', categories: [], type: 'all', month: null, sortBy: 'newest' },
        })),

      // Role Slice
      role: 'viewer',
      setRole: (role) => set({ role }),

      // Budgets Slice
      budgets: DEFAULT_BUDGETS,
      setBudget: (category, amount) =>
        set((state) => ({ budgets: { ...state.budgets, [category]: Number(amount) } })),

      // UI Slice
      ui: { mobileNavOpen: false, addTransactionOpen: false, focusSearch: false },
      setUI: (uiState) =>
        set((state) => ({ ui: { ...state.ui, ...uiState } })),

      // Toasts Slice
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        // Auto-remove after 3.2s
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, 3200);
      },
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'pulse-finance-storage',
      partialize: (state) => ({
        transactions: state.transactions,
        role: state.role,
        budgets: state.budgets,
        filters: state.filters,
      }),
    }
  )
);
