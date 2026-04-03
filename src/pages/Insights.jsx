import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Flame, BarChart2, Activity, Store, TrendingUp, TrendingDown, Target,
  Download, AlertTriangle, Settings2, Check, Lightbulb, Sparkles, Medal, Zap
} from 'lucide-react';
import { Card } from '../components/Card';
import { useStore } from '../store';
import {
  getMonthlyTotals, getCategoryBreakdown, getSavingsRate, getWeeklySpend
} from '../utils/derive';
import { useInView } from '../hooks/useInView';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Line, ReferenceArea, Legend
} from 'recharts';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const CAT_COLORS = {
  food: '#F97316', Food: '#F97316', transport: '#3B82F6', Transport: '#3B82F6',
  entertainment: '#EC4899', Entertainment: '#EC4899', utilities: '#06B6D4', Utilities: '#06B6D4',
  health: '#14B8A6', Health: '#14B8A6', shopping: '#A855F7', Shopping: '#A855F7',
  emi: '#EF4444', 'EMI/Loans': '#EF4444', transfer: '#64748B', Transfer: '#64748B',
  salary: '#10B981', Salary: '#10B981', freelance: '#84CC16', Freelance: '#84CC16',
};
const CAT_EMOJI = {
  food: '🍜', Food: '🍜', transport: '🚗', Transport: '🚗',
  entertainment: '🎬', Entertainment: '🎬', utilities: '⚡', Utilities: '⚡',
  health: '💊', Health: '💊', shopping: '🛍️', Shopping: '🛍️',
  emi: '🏦', 'EMI/Loans': '🏦', transfer: '💸', Transfer: '💸',
  salary: '💼', Salary: '💼', freelance: '🖥️', Freelance: '🖥️',
};

const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.08, ease: [0.4, 0, 1, 1] } },
};
const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl border" style={{ backgroundColor: '#18181B', borderColor: 'rgba(139,92,246,0.2)' }}>
      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{payload[0]?.payload?.name || payload[0]?.payload?.month}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-[12px]">
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span className="mono font-bold" style={{ color: '#fff' }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── InViewCard — scroll-triggered reveal ─── */
function InViewCard({ children, className = '' }) {
  const [ref, inView] = useInView(0.12);
  return (
    <motion.div ref={ref} variants={cardReveal} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── AI Insight Banner ─── */
function InsightBanner({ icon: Icon, text, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-2xl px-5 py-4 border relative overflow-hidden"
      style={{ backgroundColor: `${accent}08`, borderColor: `${accent}25` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at left center, ${accent}08 0%, transparent 50%)` }} />
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10" style={{ backgroundColor: `${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-[13px] leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </motion.div>
  );
}

/* ─── Progress Ring ─── */
function SavingsRing({ pct, saved, target }) {
  const size = 160, stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  const color = pct >= 100 ? '#10B981' : pct >= 70 ? '#F59E0B' : 'var(--accent-primary)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
          style={{ filter: `drop-shadow(0 0 10px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-[32px] font-bold" style={{ color: 'var(--text-primary)' }}>{pct.toFixed(0)}%</span>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>of 30% goal</span>
      </div>
    </div>
  );
}

/* ─── Budget Bar ─── */
function BudgetBar({ spent, budget, inView }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 120) : 0;
  const display = Math.min(pct, 100);
  const color = pct >= 100 ? '#F43F5E' : pct >= 70 ? '#F59E0B' : 'var(--accent-primary)';
  return (
    <div className="h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: inView ? `${display}%` : '0%' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ backgroundColor: color, boxShadow: pct >= 100 ? `0 0 8px ${color}60` : 'none' }}
      />
    </div>
  );
}

/* ─── Merchant Rank Card ─── */
function MerchantRank({ merchants }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="flex flex-col">
      {merchants.map((m, i) => {
        const maxAmt = merchants[0]?.amount || 1;
        const pct = (m.amount / maxAmt) * 100;
        return (
          <motion.div
            key={m.merchant}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-3 py-3 border-b last:border-0 group"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <span className="text-[20px] w-8 text-center flex-shrink-0">{medals[i] || `#${i + 1}`}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.merchant}</span>
                <span className="mono text-[13px] font-bold flex-shrink-0 ml-2" style={{ color: 'var(--text-primary)' }}>{fmt(m.amount)}</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: 0.4 + i * 0.08 }}
                  style={{ backgroundColor: i === 0 ? 'var(--accent-primary)' : 'rgba(139,92,246,0.35)' }}
                />
              </div>
              <span className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.count} transaction{m.count !== 1 ? 's' : ''}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Budgets Card ─── */
function BudgetsCard({ transactions, currentMonthIdx }) {
  const { role, budgets, setBudget } = useStore();
  const [editMode, setEditMode] = useState(false);
  const [localBudgets, setLocalBudgets] = useState({ ...budgets });
  const [ref, inView] = useInView(0.12);

  const catSpend = useMemo(() => {
    const m = {};
    transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonthIdx)
      .forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return m;
  }, [transactions, currentMonthIdx]);

  const cats = Object.keys(budgets).filter(c => budgets[c] > 0 || catSpend[c] > 0);

  return (
    <motion.div ref={ref} variants={cardReveal} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="md:col-span-2">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-[13px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>Monthly Budgets</span>
          </div>
          {role === 'admin' && (
            editMode ? (
              <motion.button whileTap={{ scale: 0.93 }} onClick={() => setEditMode(false)}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
                <Check className="w-3.5 h-3.5" /> Done
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.93 }} onClick={() => setEditMode(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <Settings2 className="w-4 h-4" />
              </motion.button>
            )
          )}
        </div>
        <div className="flex flex-col gap-4">
          {cats.map(cat => {
            const spent = catSpend[cat] || 0;
            const budget = budgets[cat] || 0;
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const over = budget > 0 && spent > budget;
            const color = pct >= 100 ? '#F43F5E' : pct >= 70 ? '#F59E0B' : 'var(--accent-primary)';
            return (
              <div key={cat} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{CAT_EMOJI[cat] || '•'}</span>
                    <span className="text-[13px] capitalize" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                    {over && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(244,63,94,0.12)', color: '#F43F5E' }}>OVER</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{fmt(spent)}</span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>of</span>
                    {editMode && role === 'admin' ? (
                      <input type="number" value={localBudgets[cat] ?? budget}
                        onChange={e => setLocalBudgets(p => ({ ...p, [cat]: e.target.value }))}
                        onBlur={() => setBudget(cat, parseFloat(localBudgets[cat]) || 0)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); setBudget(cat, parseFloat(localBudgets[cat]) || 0); } }}
                        className="mono text-[12px] outline-none text-right rounded-lg"
                        style={{ width: 90, padding: '2px 8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                      />
                    ) : (
                      <span className="mono text-[12px]" style={{ color: 'var(--text-muted)' }}>{fmt(budget)}</span>
                    )}
                    <span className="mono text-[11px] font-bold w-10 text-right" style={{ color }}>{budget > 0 ? `${pct.toFixed(0)}%` : '—'}</span>
                  </div>
                </div>
                <BudgetBar spent={spent} budget={budget} inView={inView} />
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Insights() {
  const transactions = useStore(s => s.transactions);
  const role = useStore(s => s.role);
  const addToast = useStore(s => s.addToast);
  const budgets = useStore(s => s.budgets);
  const location = useLocation();

  const now = new Date();
  const curMonth = now.getMonth();

  const catBreak = useMemo(() => getCategoryBreakdown(transactions, curMonth), [transactions, curMonth]);
  const biggest = catBreak.length > 0 ? catBreak[0] : null;
  const totals = useMemo(() => getMonthlyTotals(transactions), [transactions]);
  const cur = totals.length > 0 ? totals[totals.length - 1] : { income: 0, expense: 0 };
  const prev = totals.length > 1 ? totals[totals.length - 2] : { income: 0, expense: 0 };
  const expDelta = cur.expense - prev.expense;
  const savingsRate = useMemo(() => getSavingsRate(transactions, curMonth), [transactions, curMonth]);
  const weekly = useMemo(() => getWeeklySpend(transactions, curMonth), [transactions, curMonth]);
  const maxWeek = Math.max(...weekly.map(w => w.amount), 1);
  const peakWeekIdx = weekly.findIndex(w => w.amount === maxWeek);
  const targetSavings = cur.income * 0.30;
  const actualSaved = cur.income - cur.expense;
  const savingsPct = cur.income > 0 ? (actualSaved / targetSavings) * 100 : 0;

  const topMerchBigCat = useMemo(() => {
    if (!biggest) return [];
    const m = {};
    transactions.filter(t => t.category === biggest.category && new Date(t.date).getMonth() === curMonth)
      .forEach(t => { m[t.merchant] = (m[t.merchant] || 0) + t.amount; });
    return Object.entries(m).map(([merchant, amount]) => ({ merchant, amount })).sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [biggest, transactions, curMonth]);

  const topMerchants = useMemo(() => {
    const m = {};
    transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === curMonth)
      .forEach(t => { if (!m[t.merchant]) m[t.merchant] = { amount: 0, count: 0 }; m[t.merchant].amount += t.amount; m[t.merchant].count += 1; });
    return Object.entries(m).map(([merchant, { amount, count }]) => ({ merchant, amount, count })).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [transactions, curMonth]);

  const overBudget = useMemo(() => {
    const sp = {};
    transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === curMonth)
      .forEach(t => { sp[t.category] = (sp[t.category] || 0) + t.amount; });
    return Object.keys(budgets).filter(c => budgets[c] > 0 && (sp[c] || 0) > budgets[c]);
  }, [budgets, transactions, curMonth]);

  // AI-style insights (generated from data)
  const insights = useMemo(() => {
    const arr = [];
    if (biggest) {
      const pctOfTotal = cur.expense > 0 ? ((biggest.amount / cur.expense) * 100).toFixed(0) : 0;
      arr.push({ icon: Flame, text: `Your largest spend category is ${biggest.category} at ${fmt(biggest.amount)}, making up ${pctOfTotal}% of this month's expenses.`, accent: '#F97316' });
    }
    if (expDelta > 0) {
      arr.push({ icon: TrendingUp, text: `You're spending ${fmt(Math.abs(expDelta))} more this month compared to last. Consider reviewing subscriptions and recurring expenses.`, accent: '#F43F5E' });
    } else if (expDelta < 0) {
      arr.push({ icon: TrendingDown, text: `Great job — you've reduced spending by ${fmt(Math.abs(expDelta))} compared to last month. Keep the momentum going!`, accent: '#10B981' });
    }
    if (savingsRate >= 30) {
      arr.push({ icon: Sparkles, text: `You're saving ${savingsRate.toFixed(1)}% of your income — you've hit the 30% savings goal. Outstanding discipline.`, accent: '#10B981' });
    } else if (savingsRate > 0) {
      const gap = fmt((0.30 * cur.income) - actualSaved);
      arr.push({ icon: Target, text: `Your savings rate is ${savingsRate.toFixed(1)}%. You need ${gap} more to hit the 30% target.`, accent: '#F59E0B' });
    }
    return arr;
  }, [biggest, expDelta, savingsRate, cur, actualSaved]);

  const handleExportCSV = useCallback(() => {
    const h = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Note'];
    const rows = transactions.map(t => [t.date, `"${t.merchant}"`, t.category, t.type, t.type === 'income' ? t.amount : -t.amount, t.note ? `"${t.note}"` : '']);
    const csv = [h, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `pulse_transactions_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${transactions.length} transactions`, 'success');
  }, [transactions, addToast]);

  return (
    <motion.div key={location.key} variants={pageFade} initial="initial" animate="animate" exit="exit" className="pt-20 md:pt-8 px-4 max-w-7xl mx-auto pb-20 overflow-hidden w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>Insights</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Your money, decoded.</p>
        </div>
        {role === 'admin' && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }} onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--accent-secondary)' }}>
            <Download className="w-4 h-4" /> Export CSV
          </motion.button>
        )}
      </div>

      {/* AI Insight Banners */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {insights.map((ins, i) => <InsightBanner key={i} {...ins} />)}
        </div>
      )}

      {/* Over-budget Alert */}
      <AnimatePresence>
        {overBudget.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mb-6 rounded-2xl px-5 py-3 border"
            style={{ backgroundColor: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.2)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#F43F5E' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              You've exceeded your budget in <span className="font-bold" style={{ color: '#F43F5E' }}>{overBudget.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' and ')}</span> this month.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card 1 — Biggest Spend */}
        <InViewCard>
          <Card className="h-full flex flex-col relative overflow-hidden" style={{ minHeight: 320 }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, ${biggest ? CAT_COLORS[biggest.category] : '#8B5CF6'}08 0%, transparent 50%)` }} />
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-[12px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>Biggest Spend</span>
            </div>
            <div className="mb-6 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[22px]">{biggest ? CAT_EMOJI[biggest.category] || '' : ''}</span>
                <h3 className="text-[24px] font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{biggest?.category || 'N/A'}</h3>
              </div>
              <p className="mono text-[20px] font-bold text-amber-500">{biggest ? fmt(biggest.amount) : '₹0'}</p>
            </div>
            <div className="flex flex-col gap-3 flex-grow justify-end relative z-10">
              {topMerchBigCat.map(m => {
                const pct = biggest ? (m.amount / biggest.amount) * 100 : 0;
                const color = biggest ? CAT_COLORS[biggest.category] || 'var(--accent-primary)' : 'var(--accent-primary)';
                return (
                  <div key={m.merchant} className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{m.merchant}</span>
                      <span className="mono text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(m.amount)}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7 }} style={{ backgroundColor: color, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </InViewCard>

        {/* Card 2 — Month Comparison */}
        <InViewCard>
          <Card className="h-full flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[12px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>Month vs Last Month</span>
            </div>
            <div className="flex-grow w-full" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Last Month', income: prev.income, expense: prev.expense },
                  { name: 'This Month', income: cur.income, expense: cur.expense },
                ]} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<ChartTooltip />} />
                  <Bar dataKey="income" fill="var(--color-income)" barSize={20} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" barSize={20} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-[13px] border-t pt-4 flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
              {expDelta > 0
                ? <><TrendingUp className="w-3.5 h-3.5" style={{ color: '#F43F5E' }} /> You spent <span className="font-bold" style={{ color: '#F43F5E' }}>{fmt(Math.abs(expDelta))} more</span></>
                : <><TrendingDown className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> You spent <span className="font-bold" style={{ color: '#10B981' }}>{fmt(Math.abs(expDelta))} less</span></>}
              {' '}than last month.
            </div>
          </Card>
        </InViewCard>

        {/* Card 3 — Weekly Spend */}
        <InViewCard>
          <Card className="h-full flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[12px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>Spending by Week</span>
            </div>
            <div className="flex-grow flex items-end justify-between gap-3 pb-4">
              {weekly.map((w, i) => {
                const pct = Math.max((w.amount / maxWeek) * 100, 8);
                const isActive = w.amount === maxWeek;
                return (
                  <div key={w.week} className="flex flex-col items-center justify-end h-full flex-1 gap-2">
                    <span className="mono text-[11px]" style={{ color: 'var(--text-primary)' }}>{fmt(w.amount)}</span>
                    <motion.div
                      className="w-full rounded-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                      style={{
                        maxHeight: 100, minHeight: 6,
                        backgroundColor: isActive ? 'var(--accent-primary)' : 'rgba(139,92,246,0.2)',
                        boxShadow: isActive ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
                      }}
                    />
                    <span className="text-[11px]" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[13px] border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
              Peak spending is in <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Week {peakWeekIdx + 1}</span>.
            </div>
          </Card>
        </InViewCard>

        {/* Card 4 — Top Merchants */}
        <InViewCard>
          <Card className="h-full flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[12px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>Where Your Money Goes</span>
            </div>
            <MerchantRank merchants={topMerchants} />
          </Card>
        </InViewCard>

        {/* Card 5 — 6-Month Overview */}
        <InViewCard>
          <Card className="h-full flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[12px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>6-Month Overview</span>
            </div>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={totals} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  {totals.map((t, i) => {
                    if (i === 0) return null;
                    const p = totals[i - 1];
                    if (t.income > t.expense && p.income > p.expense) return <ReferenceArea key={i} x1={p.month} x2={t.month} fill="rgba(16,185,129,0.05)" />;
                    if (t.expense > t.income && p.expense > p.income) return <ReferenceArea key={i} x1={p.month} x2={t.month} fill="rgba(244,63,94,0.05)" />;
                    return null;
                  })}
                  <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2.5} dot={false} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </InViewCard>

        {/* Card 6 — Savings Goal Ring */}
        <InViewCard>
          <Card className="h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: 320 }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 60%)' }} />
            <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
              <Target className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[12px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>Savings Goal</span>
            </div>
            <SavingsRing pct={savingsPct} saved={actualSaved} target={targetSavings} />
            <div className="mt-5 text-[13px] text-center max-w-[80%] relative z-10" style={{ color: 'var(--text-secondary)' }}>
              Saved <span className="mono font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(actualSaved)}</span> of <span className="mono" style={{ color: 'var(--text-primary)' }}>{fmt(targetSavings)}</span> target
            </div>
          </Card>
        </InViewCard>

        {/* Card 7 — Budgets */}
        <BudgetsCard transactions={transactions} currentMonthIdx={curMonth} />
      </div>
    </motion.div>
  );
}
