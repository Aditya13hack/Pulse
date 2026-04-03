import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';
import {
  Plus, Search, ChevronDown, Check, X,
  Trash2, Edit2, TrendingUp, TrendingDown,
  Tag, Calendar, Zap, ArrowRight, Flame
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────── */
const CATEGORIES = [
  'food', 'transport', 'entertainment', 'utilities',
  'health', 'shopping', 'emi', 'transfer', 'salary', 'freelance',
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CAT_COLORS = {
  food: '#F97316', transport: '#3B82F6', entertainment: '#EC4899',
  utilities: '#06B6D4', health: '#14B8A6', shopping: '#A855F7',
  emi: '#EF4444', transfer: '#64748B', salary: '#10B981', freelance: '#84CC16',
};
const CAT_EMOJI = {
  food: '🍜', transport: '🚗', entertainment: '🎬',
  utilities: '⚡', health: '💊', shopping: '🛍️',
  emi: '🏦', transfer: '💸', salary: '💼', freelance: '🖥️',
};
const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

/* ─── Page transition ────────────────────────────────────── */
const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.08, ease: [0.4, 0, 1, 1] } },
};

const cardIntroEase = [0.22, 1, 0.36, 1];

/* ─── Animated counter (SSR safe) ────────────────────────── */
function AnimatedNum({ value, prefix = '₹', duration = 0.8 }) {
  const spring = useSpring(0, { stiffness: 120, damping: 18 });
  const display = useTransform(spring, (v) =>
    `${prefix}${Math.round(v).toLocaleString('en-IN')}`
  );
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
}

/* ─── Micro sparkbar (5-day spend trend) ─────────────────── */
function SparkBar({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-[18px]">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-sm w-[3px] flex-shrink-0 transition-all duration-500"
          style={{
            height: `${Math.max(4, (v / max) * 18)}px`,
            backgroundColor: v === max ? 'var(--accent-primary)' : 'rgba(139,92,246,0.3)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Category pill ──────────────────────────────────────── */
function CatPill({ cat, tiny }) {
  const color = CAT_COLORS[cat] || '#888';
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider leading-none rounded-full border ${tiny ? 'text-[9px] px-[6px] py-[3px]' : 'text-[10px] px-2 py-0.5'}`}
      style={{ color, backgroundColor: `${color}12`, borderColor: `${color}25` }}
    >
      {!tiny && <span>{CAT_EMOJI[cat] || '•'}</span>}
      {cat}
    </span>
  );
}

/* ─── Heatmap strip (last 28 days) ──────────────────────── */
function SpendHeatmap({ transactions }) {
  const days = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      map[k] = { date: d, amount: 0 };
    }
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const k = t.date.slice(0, 10);
      if (map[k]) map[k].amount += t.amount;
    });
    return Object.values(map);
  }, [transactions]);

  const max = Math.max(...days.map(d => d.amount), 1);

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Spend Intensity · Last 28 Days
        </span>
        {hovered && (
          <span className="text-[10px] mono" style={{ color: 'var(--text-secondary)' }}>
            {new Date(hovered.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {fmt(hovered.amount)}
          </span>
        )}
      </div>
      <div className="flex gap-[2px] sm:gap-[3px]">
        {days.map((day, i) => {
          const pct = day.amount / max;
          const isToday = day.date.toDateString() === new Date().toDateString();
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.4 }}
              onMouseEnter={() => setHovered(day)}
              onMouseLeave={() => setHovered(null)}
              className="rounded-[2px] sm:rounded-[3px] cursor-default transition-colors relative w-[8.5px] h-[8.5px] sm:w-[14px] sm:h-[14px] flex-shrink-0"
              title={`${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${fmt(day.amount)}`}
              style={{
                backgroundColor: day.amount === 0
                  ? 'rgba(139,92,246,0.06)'
                  : `rgba(139,92,246,${0.15 + pct * 0.85})`,
                boxShadow: isToday ? '0 0 0 1.5px var(--accent-primary)' : 'none',
              }}
            />
          );
        })}
      </div>
      {/* Day-of-week labels under */}
      <div className="flex gap-[2px] sm:gap-[3px] mt-0.5">
        {days.map((day, i) => (
          <div key={i} className="w-[8.5px] sm:w-[14px] flex-shrink-0 text-center" style={{ fontSize: 7, color: 'rgba(139,92,246,0.3)', opacity: i % 7 === 0 ? 1 : 0 }}>
            {dayNames[new Date(day.date).getDay()]}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── KPI stat card ──────────────────────────────────────── */
function StatCard({ label, value, sub, accent, trend, trendUp, introIndex = 0 }) {
  const delay = 0.04 + introIndex * 0.06;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: cardIntroEase, delay }}
      className="flex flex-col justify-between rounded-2xl p-4 border relative overflow-hidden min-w-[140px] flex-1"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: `${accent}25` }}
    >
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at top left, ${accent}10 0%, transparent 60%)` }} />
      <span className="text-[11px] uppercase font-semibold tracking-widest mb-3 relative z-10" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="relative z-10">
        <div className="mono text-[22px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        {sub && (
          <div className="flex items-center gap-1 mt-1.5">
            {trendUp !== undefined && (trendUp
              ? <TrendingUp className="w-3 h-3" style={{ color: '#10B981' }} />
              : <TrendingDown className="w-3 h-3" style={{ color: '#F43F5E' }} />
            )}
            <span className="text-[11px]" style={{ color: trendUp ? '#10B981' : trendUp === false ? '#F43F5E' : 'var(--text-muted)' }}>
              {sub}
            </span>
          </div>
        )}
      </div>
      {trend && <div className="mt-2"><SparkBar data={trend} /></div>}
    </motion.div>
  );
}

/* ─── Custom Select Dropdown ─── */
function CustomSelect({ value, options, onChange, icon: Icon, placeholder, matchStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value) || options[0] || {};
  const isLightMode = document.documentElement.classList.contains('light');

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] border transition-colors whitespace-nowrap"
        style={{
          backgroundColor: matchStyle ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
          borderColor: matchStyle ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)',
          color: matchStyle ? 'var(--accent-primary)' : 'var(--text-secondary)'
        }}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {selected.label || placeholder}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>
      <AnimatePresence>
        {open && (
           <motion.div
             initial={{ opacity: 0, scale: 0.95, y: -4 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: -4 }}
             transition={{ duration: 0.15 }}
             className="absolute top-10 left-0 z-50 min-w-[140px] rounded-2xl border shadow-2xl p-1 overflow-hidden"
             style={{ backgroundColor: isLightMode ? '#ffffff' : '#18181B', borderColor: isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
           >
             <div className="max-h-[240px] overflow-y-auto hide-scrollbar">
               {options.map(opt => {
                  const on = value === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      className="w-full text-left flex items-center px-3 py-2 rounded-xl text-[12px] transition-colors"
                      style={{
                        backgroundColor: on ? 'rgba(139,92,246,0.1)' : 'transparent',
                        color: on ? 'var(--accent-primary)' : 'var(--text-muted)'
                      }}
                    >
                      {opt.label}
                    </motion.button>
                  );
               })}
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function Transactions() {
  const { transactions, filters, setFilters, resetFilters, role, setUI, ui } = useStore();
  const location = useLocation();
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'list'
  const searchRef = useRef(null);

  // Keyboard shortcut focus
  useEffect(() => {
    if (ui.focusSearch && searchRef.current) {
      searchRef.current.focus();
      setUI({ focusSearch: false });
    }
  }, [ui.focusSearch, setUI]);

  /* ── Filtering & Sorting ─── */
  const filteredAndSorted = useMemo(() => {
    let result = transactions.filter(t => {
      if (filters.search && !t.merchant.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.categories?.length > 0 && !filters.categories.includes(t.category)) return false;
      if (filters.type && filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.month !== null && new Date(t.date).getMonth() !== filters.month) return false;
      return true;
    });
    const s = filters.sortBy || 'newest';
    result.sort((a, b) =>
      s === 'newest' ? new Date(b.date) - new Date(a.date) :
      s === 'oldest' ? new Date(a.date) - new Date(b.date) :
      s === 'highest' ? Math.abs(b.amount) - Math.abs(a.amount) :
      Math.abs(a.amount) - Math.abs(b.amount)
    );
    return result;
  }, [transactions, filters]);

  /* ── Derived KPIs ─── */
  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = filteredAndSorted.filter(t => new Date(t.date).getMonth() === now.getMonth());
    const totalExpense = filteredAndSorted.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = filteredAndSorted.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const avgExpense = filteredAndSorted.filter(t => t.type === 'expense').length
      ? totalExpense / filteredAndSorted.filter(t => t.type === 'expense').length : 0;

    // Daily spend last 7 days for sparkbar
    const spark = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return transactions.filter(t => t.type === 'expense' && t.date.slice(0, 10) === key).reduce((s, t) => s + t.amount, 0);
    });

    // Burn rate: daily avg this month
    const dayOfMonth = now.getDate();
    const monthExpense = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth()).reduce((s, t) => s + t.amount, 0);
    const burnRate = monthExpense / Math.max(dayOfMonth, 1);

    return { totalExpense, totalIncome, avgExpense, spark, burnRate, count: filteredAndSorted.length };
  }, [filteredAndSorted, transactions]);

  /* ── Group by date (for timeline) ─── */
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredAndSorted.forEach(t => {
      const d = new Date(t.date);
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      let label;
      if (d.toDateString() === today.toDateString()) label = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
      else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return groups;
  }, [filteredAndSorted]);

  /* ── Filter chips ─── */
  const activeChips = [];
  if (filters.search) activeChips.push({ type: 'search', label: `"${filters.search}"`, val: filters.search });
  if (filters.type && filters.type !== 'all') activeChips.push({ type: 'type', label: filters.type, val: filters.type });
  if (filters.month !== null) activeChips.push({ type: 'month', label: MONTHS[filters.month], val: filters.month });
  filters.categories?.forEach(c => activeChips.push({ type: 'category', label: c, val: c }));

  /* ── Category distribution strip ─── */
  const catDist = useMemo(() => {
    const map = {};
    filteredAndSorted.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ cat, amount, pct: (amount / total) * 100 }));
  }, [filteredAndSorted]);

  const handleSearch = useCallback(e => setFilters({ search: e.target.value }), [setFilters]);
  const toggleCategory = useCallback(cat => {
    const cur = filters.categories || [];
    setFilters({ categories: cur.includes(cat) ? cur.filter(c => c !== cat) : [...cur, cat] });
  }, [filters.categories, setFilters]);

  return (
    <motion.div
      key={location.key}
      variants={pageFade}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pt-20 md:pt-8 pb-32 max-w-7xl mx-auto px-4 w-full"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            Transactions
          </h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
            <span className="mono font-medium" style={{ color: 'var(--text-secondary)' }}>{kpis.count}</span> transactions ·{' '}
            <span className="mono font-medium" style={{ color: '#F43F5E' }}>{fmt(kpis.totalExpense)}</span> spent ·{' '}
            <span className="mono font-medium" style={{ color: '#10B981' }}>{fmt(kpis.totalIncome)}</span> earned
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 rounded-lg border border-white/5 gap-0.5" style={{ backgroundColor: 'var(--bg-card)' }}>
            {[['timeline', '≡'], ['list', '⊟']].map(([mode, icon]) => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode(mode)}
                className="w-8 h-7 rounded-md text-[13px] font-bold transition-colors"
                style={{
                  backgroundColor: viewMode === mode ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'var(--text-muted)',
                }}
              >
                {icon}
              </motion.button>
            ))}
          </div>
          {role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setUI({ addTransactionOpen: true })}
              className="fab-pulse relative group flex items-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-sm transition-all"
              style={{
                backgroundColor: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10B981',
              }}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              Add
            </motion.button>
          )}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 hide-scrollbar">
        <StatCard
          introIndex={0}
          label="Daily Burn Rate"
          value={fmt(kpis.burnRate)}
          sub="/day this month"
          accent="#F43F5E"
          trend={kpis.spark}
        />
        <StatCard
          introIndex={1}
          label="Total Spent"
          value={fmt(kpis.totalExpense)}
          sub="in this view"
          accent="#F59E0B"
          trendUp={kpis.totalIncome > kpis.totalExpense}
        />
        <StatCard
          introIndex={2}
          label="Avg. Per Txn"
          value={fmt(kpis.avgExpense)}
          sub="expense average"
          accent="#8B5CF6"
        />
        <StatCard
          introIndex={3}
          label="Total Earned"
          value={fmt(kpis.totalIncome)}
          sub="in this view"
          accent="#10B981"
          trendUp={true}
        />
      </div>

      {/* ── Spend Heatmap ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: cardIntroEase, delay: 0.22 }}
        className="rounded-2xl p-5 mb-5 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <SpendHeatmap transactions={transactions} />
      </motion.div>

      {/* ── Category distribution bar ── */}
      {catDist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: cardIntroEase, delay: 0.27 }}
          className="rounded-2xl p-4 mb-5 border flex flex-col gap-2"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Category Breakdown
          </span>
          <div className="flex h-2 rounded-full overflow-hidden gap-[1px]">
            {catDist.map(({ cat, pct }) => (
              <motion.div
                key={cat}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                title={`${cat}: ${fmt(catDist.find(c => c.cat === cat)?.amount || 0)}`}
                style={{ backgroundColor: CAT_COLORS[cat] || '#888', minWidth: pct > 1 ? 2 : 0 }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {catDist.slice(0, 6).map(({ cat, pct, amount }) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[cat] }} />
                <span className="text-[11px] capitalize" style={{ color: 'var(--text-muted)' }}>
                  {cat} <span className="mono" style={{ color: 'var(--text-secondary)' }}>{pct.toFixed(0)}%</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: cardIntroEase, delay: 0.32 }}
        className="relative z-20 rounded-2xl border mb-4 px-4 py-3 flex flex-wrap gap-2 items-center filter-bar-glass"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search… (/ to focus)"
            value={filters.search}
            onChange={handleSearch}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-[13px] outline-none transition-all border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Categories multi-select */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] border transition-colors"
            style={{
              backgroundColor: filters.categories?.length ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
              borderColor: filters.categories?.length ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)',
              color: filters.categories?.length ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <Tag className="w-3.5 h-3.5" />
            Category {filters.categories?.length ? `(${filters.categories.length})` : ''}
            <ChevronDown className={`w-3 h-3 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>
          <AnimatePresence>
            {catDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCatDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-10 left-0 z-50 w-60 rounded-2xl border shadow-2xl p-2 overflow-hidden"
                  style={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map(cat => {
                      const on = filters.categories?.includes(cat);
                      return (
                        <motion.button
                          key={cat}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => toggleCategory(cat)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12px] capitalize font-medium transition-colors border"
                          style={{
                            backgroundColor: on ? `${CAT_COLORS[cat]}15` : 'transparent',
                            borderColor: on ? `${CAT_COLORS[cat]}35` : 'transparent',
                            color: on ? CAT_COLORS[cat] : 'var(--text-muted)',
                          }}
                        >
                          <span className="text-[14px]">{CAT_EMOJI[cat]}</span>
                          <span className="truncate">{cat}</span>
                          {on && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Type */}
        <CustomSelect
          value={filters.type || 'all'}
          onChange={val => setFilters({ type: val })}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' }
          ]}
          matchStyle={filters.type && filters.type !== 'all'}
        />

        {/* Month */}
        <CustomSelect
          value={filters.month === null ? 'all' : filters.month}
          onChange={val => setFilters({ month: val === 'all' ? null : parseInt(val) })}
          options={[
            { value: 'all', label: 'All Months' },
            ...MONTHS.map((m, i) => ({ value: i, label: m }))
          ]}
          matchStyle={filters.month !== null}
        />

        {/* Sort */}
        <div className="ml-auto">
          <CustomSelect
            value={filters.sortBy || 'newest'}
            onChange={val => setFilters({ sortBy: val })}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'highest', label: 'Highest' },
              { value: 'lowest', label: 'Lowest' }
            ]}
          />
        </div>
      </motion.div>

      {/* ── Active Filter Chips ── */}
      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mb-5 overflow-hidden"
          >
            {activeChips.map(chip => (
              <motion.span
                key={`${chip.type}-${chip.val}`}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium border capitalize"
                style={{
                  backgroundColor: 'rgba(139,92,246,0.08)',
                  borderColor: 'rgba(139,92,246,0.2)',
                  color: 'var(--accent-primary)',
                }}
              >
                {chip.label}
                <button
                  onClick={() => {
                    if (chip.type === 'search') setFilters({ search: '' });
                    if (chip.type === 'type') setFilters({ type: 'all' });
                    if (chip.type === 'month') setFilters({ month: null });
                    if (chip.type === 'category') setFilters({ categories: filters.categories.filter(c => c !== chip.val) });
                  }}
                  className="p-0.5 rounded-full hover:bg-[var(--accent-primary)]/20 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </motion.span>
            ))}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={resetFilters}
              className="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
            >
              Clear all
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Transaction Content ── */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState hasFilters={activeChips.length > 0} onClear={resetFilters} />
      ) : viewMode === 'timeline' ? (
        <TimelineView groups={groupedByDate} role={role} />
      ) : (
        <ListView transactions={filteredAndSorted} role={role} />
      )}
    </motion.div>
  );
}

/* ─── Timeline View (date-grouped) ──────────────────────── */
function TimelineView({ groups, role }) {
  return (
    <div className="flex flex-col gap-8">
      {Object.entries(groups).map(([dateLabel, txs], gi) => {
        const dayTotal = txs.reduce((s, t) => t.type === 'expense' ? s - t.amount : s + t.amount, 0);
        return (
          <motion.div
            key={dateLabel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Date header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {dateLabel}
                </span>
              </div>
              <span
                className="text-[12px] mono font-semibold"
                style={{ color: dayTotal >= 0 ? '#10B981' : '#F43F5E' }}
              >
                {dayTotal >= 0 ? '+' : ''}{fmt(dayTotal)}
              </span>
            </div>

            {/* Timeline connector + rows */}
            <div className="relative pl-4">
              {/* vertical line */}
              <div
                className="absolute left-[5px] top-0 bottom-0 w-[1px]"
                style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.3), transparent)' }}
              />
              <div className="flex flex-col gap-1.5">
                <AnimatePresence mode="popLayout">
                  {txs.map((tx, i) => (
                    <TransactionCard key={tx.id} tx={tx} role={role} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── List View (flat) ───────────────────────────────────── */
function ListView({ transactions, role }) {
  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence mode="popLayout">
        {transactions.map((tx, i) => (
          <TransactionCard key={tx.id} tx={tx} role={role} index={i} flat />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Transaction Card ───────────────────────────────────── */
const TransactionCard = React.memo(function TransactionCard({ tx, role, index, flat }) {
  const { editTransaction, deleteTransaction, addToast } = useStore();
  const [mode, setMode] = useState('view');
  const [editData, setEditData] = useState({
    merchant: tx.merchant, amount: Math.abs(tx.amount),
    category: tx.category, type: tx.type,
  });
  const [expanded, setExpanded] = useState(false);

  const isIncome = tx.type === 'income';
  const color = CAT_COLORS[tx.category] || '#888';
  const initials = tx.merchant.slice(0, 2).toUpperCase();

  const dateStr = new Date(tx.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  const handleSave = useCallback(() => {
    if (!editData.merchant.trim() || !editData.amount) {
      addToast('Fields required.', 'error'); return;
    }
    const finalAmt = editData.type === 'expense' ? -Math.abs(editData.amount) : Math.abs(editData.amount);
    editTransaction(tx.id, { ...editData, amount: finalAmt });
    setMode('view');
    addToast('Transaction updated ✓', 'success');
  }, [editData, editTransaction, tx.id, addToast]);

  if (mode === 'delete') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="flex items-center justify-between px-4 py-3 rounded-2xl border"
        style={{ backgroundColor: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-rose-500">Delete "{tx.merchant}"?</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Cannot be undone</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('view')} className="text-[12px] px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={() => { deleteTransaction(tx.id); addToast('Transaction deleted', 'success'); }} className="text-[12px] font-bold text-white px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 transition-colors">
            Delete
          </button>
        </div>
      </motion.div>
    );
  }

  if (mode === 'edit') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-subtle)' }}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setMode('view'); }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              type="text"
              value={editData.merchant}
              onChange={e => setEditData({ ...editData, merchant: e.target.value })}
              className="rounded-lg px-3 py-1.5 text-[13px] outline-none border w-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
              placeholder="Merchant"
            />
            <div className="flex gap-2">
              <select value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })} className="rounded-lg px-2 py-1 text-[11px] outline-none border appearance-none" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} className="rounded-lg px-2 py-1 text-[11px] outline-none border appearance-none capitalize" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
            <input
              type="number"
              value={editData.amount}
              onChange={e => setEditData({ ...editData, amount: parseFloat(e.target.value) || '' })}
              className="rounded-lg px-2 py-1.5 text-[13px] mono outline-none border w-[100px] text-right"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMode('view')} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
              <Check className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
      transition={{ delay: index * 0.018, type: 'spring', stiffness: 280, damping: 24 }}
      className="group"
    >
      <motion.div
        whileHover={{ scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-default overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'rgba(255,255,255,0.04)',
          borderLeftWidth: 3,
          borderLeftColor: color,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at left center, ${color}08 0%, transparent 60%)` }}
        />

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[13px] flex-shrink-0 relative z-10"
          style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}25` }}
        >
          {CAT_EMOJI[tx.category] || initials}
        </div>

        {/* Name + category */}
        <div className="flex flex-col flex-1 min-w-0 relative z-10">
          <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }} title={tx.merchant}>
            {tx.merchant}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CatPill cat={tx.category} tiny />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {dateStr}
            </span>
            {tx.note && (
              <span className="text-[11px] italic truncate" style={{ color: 'var(--text-muted)', maxWidth: 120 }}>
                · {tx.note}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <span
            className="mono text-[15px] font-bold"
            style={{ color: isIncome ? '#10B981' : 'var(--text-primary)' }}
          >
            {isIncome ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
          </span>
          {/* Admin actions — fade in on hover */}
          {role === 'admin' && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={e => { e.stopPropagation(); setMode('edit'); setExpanded(false); }}
                className="p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={e => { e.stopPropagation(); setMode('delete'); }}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )}
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            className="opacity-0 group-hover:opacity-40 transition-opacity"
          >
            <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="mx-2 px-4 py-3 rounded-b-2xl border border-t-0 flex flex-wrap gap-x-8 gap-y-2"
              style={{ backgroundColor: `${color}06`, borderColor: `${color}18` }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
                <span className="mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{tx.id}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Full Date</span>
                <span className="mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Type</span>
                <span className="text-[11px] capitalize" style={{ color: isIncome ? '#10B981' : '#F43F5E' }}>{tx.type}</span>
              </div>
              {tx.note && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Note</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{tx.note}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/* ─── Empty State ────────────────────────────────────────── */
function EmptyState({ hasFilters, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-28 rounded-3xl border border-dashed relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(139,92,246,0.15)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />
      <div className="relative z-10 text-[52px] mb-6 select-none" style={{ filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.3))' }}>
        {hasFilters ? '🔍' : '📭'}
      </div>
      <h3 className="text-[18px] font-semibold mb-2 relative z-10" style={{ color: 'var(--text-primary)' }}>
        {hasFilters ? 'No matches found' : 'No transactions yet'}
      </h3>
      <p className="text-[13px] text-center max-w-xs relative z-10" style={{ color: 'var(--text-muted)' }}>
        {hasFilters
          ? 'Try adjusting or clearing your filters to see results.'
          : 'Add your first transaction to start tracking your money.'}
      </p>
      {hasFilters && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="mt-6 text-[13px] font-medium px-4 py-2 rounded-xl border transition-colors relative z-10"
          style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
        >
          Clear all filters
        </motion.button>
      )}
    </motion.div>
  );
}
