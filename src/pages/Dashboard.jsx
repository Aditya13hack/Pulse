import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, PiggyBank,
  Wallet, CreditCard, Zap, ArrowRight, Calendar, Eye
} from 'lucide-react';
import { useStore } from '../store';
import { Card } from '../components/Card';
import {
  getMonthlyTotals, getSavingsRate, getRunningBalance, getCategoryBreakdown
} from '../utils/derive';
import { useCountUp } from '../hooks/useCountUp';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { useInView } from '../hooks/useInView';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, Sector
} from 'recharts';

/* ─── Color Maps ─── */
const CAT_COLORS = {
  food: '#F97316', Food: '#F97316',
  transport: '#3B82F6', Transport: '#3B82F6',
  entertainment: '#EC4899', Entertainment: '#EC4899',
  utilities: '#06B6D4', Utilities: '#06B6D4',
  health: '#14B8A6', Health: '#14B8A6',
  shopping: '#A855F7', Shopping: '#A855F7',
  emi: '#EF4444', 'EMI/Loans': '#EF4444',
  transfer: '#64748B', Transfer: '#64748B',
  salary: '#10B981', Salary: '#10B981',
  freelance: '#84CC16', Freelance: '#84CC16',
};

const CAT_EMOJI = {
  food: '🍜', Food: '🍜', transport: '🚗', Transport: '🚗',
  entertainment: '🎬', Entertainment: '🎬', utilities: '⚡', Utilities: '⚡',
  health: '💊', Health: '💊', shopping: '🛍️', Shopping: '🛍️',
  emi: '🏦', 'EMI/Loans': '🏦', transfer: '💸', Transfer: '💸',
  salary: '💼', Salary: '💼', freelance: '🖥️', Freelance: '🖥️',
};

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

/* ─── Animation ─── */
const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.08, ease: [0.4, 0, 1, 1] } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

/* ─── SVG Sparkline ─── */
function Sparkline({ data, color, glow }) {
  if (!data || data.length < 2) return <div className="h-[48px]" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 48, p = 4;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - p * 2) + p;
    const y = h - p - ((v - min) / range) * (h - p * 2);
    return `${x},${y}`;
  }).join(' L ');
  const areaPath = `M ${pts} L ${w - p},${h} L ${p},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[48px] overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={glow ? { filter: `drop-shadow(0 0 6px ${color}80)` } : {}}
      />
      {/* Endpoint dot */}
      {(() => {
        const last = pts.split(' L ').pop().split(',');
        return <circle cx={last[0]} cy={last[1]} r="3" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
      })()}
    </svg>
  );
}

/* ─── Progress Ring (for Savings) ─── */
function ProgressRing({ pct, size = 120, stroke = 8, color, label, sub }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</span>
      </div>
    </div>
  );
}

/* ─── Donut Active Shape ─── */
const activeShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 10}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
        style={{ filter: `drop-shadow(0 0 12px ${fill}80)` }}
      />
    </g>
  );
};

/* ─── Chart Tooltip ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl border" style={{
      backgroundColor: '#18181B', borderColor: 'rgba(139,92,246,0.2)',
    }}>
      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{payload[0]?.payload?.date || label}</p>
      <p className="mono font-bold text-[14px]" style={{ color: '#fff' }}>{fmt(payload[0]?.value)}</p>
    </div>
  );
};

/* ─── Financial Health Score ─── */
function HealthScore({ score }) {
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#F43F5E';
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';
  return (
    <div className="flex items-center gap-3">
      <ProgressRing pct={score} size={64} stroke={5} color={color} label={score} sub="" />
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold" style={{ color }}>{label}</span>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Financial Health</span>
      </div>
    </div>
  );
}

/* ─── Greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Dashboard() {
  const transactions = useStore((s) => s.transactions);
  const location = useLocation();
  const [balanceFilter, setBalanceFilter] = useState('6M');
  const [activeDonutIdx, setActiveDonutIdx] = useState(null);

  const now = new Date();
  const curMonth = now.getMonth();

  const totals = useMemo(() => getMonthlyTotals(transactions), [transactions]);
  const cur = totals.length > 0 ? totals[totals.length - 1] : { income: 0, expense: 0 };
  const prev = totals.length > 1 ? totals[totals.length - 2] : { income: 0, expense: 0 };
  const net = cur.income - cur.expense;
  const delta = net - (prev.income - prev.expense);
  const deltaPct = (prev.income - prev.expense) !== 0
    ? ((delta / Math.abs(prev.income - prev.expense)) * 100).toFixed(1) : 0;

  const savingsRate = useMemo(() => getSavingsRate(transactions, curMonth), [transactions, curMonth]);
  const catBreak = useMemo(() => getCategoryBreakdown(transactions, curMonth), [transactions, curMonth]);

  const incomeSpark = useMemo(() => {
    const d = transactions.filter(t => t.type === 'income').slice(0, 7).map(t => t.amount).reverse();
    while (d.length < 7) d.unshift(d[0] || 0);
    return d;
  }, [transactions]);

  const expenseSpark = useMemo(() => {
    const d = transactions.filter(t => t.type === 'expense').slice(0, 7).map(t => t.amount).reverse();
    while (d.length < 7) d.unshift(d[0] || 0);
    return d;
  }, [transactions]);

  const runBal = useMemo(() => getRunningBalance(transactions), [transactions]);
  const filtBal = useMemo(() => runBal.filter(b => {
    const d = new Date(b.date);
    if (balanceFilter === '3M') return d >= new Date(now.getFullYear(), now.getMonth() - 2, 1);
    if (balanceFilter === '6M') return d >= new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return true;
  }), [runBal, balanceFilter, now]);

  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  // Financial health (composite score)
  const healthScore = useMemo(() => {
    let score = 50;
    if (savingsRate >= 30) score += 30; else if (savingsRate >= 15) score += 15;
    if (delta > 0) score += 10;
    if (cur.expense < cur.income) score += 10;
    return Math.min(score, 100);
  }, [savingsRate, delta, cur]);

  // Animated values
  const animNet = useCountUp(net, 1200);
  const animIncome = useAnimatedValue(cur.income, 900);
  const animExpense = useAnimatedValue(cur.expense, 900);

  const activeCat = activeDonutIdx !== null ? catBreak[activeDonutIdx] : null;

  // Transaction count by day-of-week for mini activity chart
  const dayActivity = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    transactions.forEach(t => { days[new Date(t.date).getDay()] += 1; });
    return days;
  }, [transactions]);

  return (
    <motion.div
      key={location.key}
      variants={pageFade}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pt-20 md:pt-8 px-4 max-w-7xl mx-auto pb-20 overflow-hidden"
    >
      <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col gap-5">

        {/* ═══ HERO ═══ */}
        <motion.div variants={fadeUp} className="relative w-full pt-4 pb-8">
          {/* Ambient glow */}
          <div className="absolute right-[-60px] top-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none glow-pulse"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)' }}
          />
          <div className="relative z-10">
            <p className="text-[14px] mb-1" style={{ color: 'var(--text-muted)' }}>
              {getGreeting()}, <span style={{ color: 'var(--text-secondary)' }}>User</span>
            </p>
            <span className="text-[13px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Net Balance
            </span>
            <div className="flex items-end gap-4 flex-wrap mt-1">
              <span className="mono font-bold leading-none" style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(48px, 7vw, 78px)',
                textShadow: '0 0 40px rgba(139,92,246,0.15)',
              }}>
                {fmt(animNet)}
              </span>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3"
                style={{
                  backgroundColor: delta >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  border: `1px solid ${delta >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                }}
              >
                {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-income)' }} /> : <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--color-expense)' }} />}
                <span className="mono text-[13px] font-medium" style={{ color: delta >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                  {delta >= 0 ? '+' : ''}{fmt(Math.abs(delta))} ({delta >= 0 ? '+' : ''}{deltaPct}%)
                </span>
              </motion.div>
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-6 mt-3 flex-wrap">
              <HealthScore score={healthScore} />
              <div className="h-10 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Savings Rate</span>
                <span className="mono text-[20px] font-bold" style={{ color: 'var(--accent-secondary)' }}>{savingsRate.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Transactions</span>
                <span className="mono text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>{transactions.length}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ SUMMARY CARDS ═══ */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Income */}
          <Card introDelay={0.04} className="relative overflow-hidden group" style={{ borderTop: '2px solid var(--color-income)' }}>
            <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle at top left, rgba(16,185,129,0.06) 0%, transparent 60%)' }}
            />
            <div className="flex justify-between items-center mb-1 relative z-10">
              <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Income This Month</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--color-income)' }} />
              </div>
            </div>
            <div className="mono text-[28px] font-bold mb-3 relative z-10" style={{ color: 'var(--text-primary)' }}>{fmt(animIncome)}</div>
            <Sparkline data={incomeSpark} color="#10B981" glow />
          </Card>

          {/* Expense */}
          <Card introDelay={0.09} className="relative overflow-hidden group" style={{ borderTop: '2px solid var(--color-expense)' }}>
            <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle at top left, rgba(244,63,94,0.06) 0%, transparent 60%)' }}
            />
            <div className="flex justify-between items-center mb-1 relative z-10">
              <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Expenses This Month</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(244,63,94,0.1)' }}>
                <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-expense)' }} />
              </div>
            </div>
            <div className="mono text-[28px] font-bold mb-3 relative z-10" style={{ color: 'var(--text-primary)' }}>{fmt(animExpense)}</div>
            <Sparkline data={expenseSpark} color="#F43F5E" glow />
          </Card>

          {/* Savings Ring */}
          <Card introDelay={0.14} className="relative overflow-hidden group flex items-center gap-5" style={{ borderTop: '2px solid var(--accent-secondary)' }}>
            <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle at top left, rgba(245,158,11,0.06) 0%, transparent 60%)' }}
            />
            <ProgressRing pct={savingsRate} size={100} stroke={7} color="var(--accent-secondary)" label={`${savingsRate.toFixed(0)}%`} sub="saved" />
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Savings Rate</span>
              <span className="mono text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(cur.income - cur.expense)}</span>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>of {fmt(cur.income)} earned</span>
            </div>
          </Card>
        </motion.div>

        {/* ═══ BALANCE CHART ═══ */}
        <motion.div variants={fadeUp}>
          <Card introDelay={0.18} className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-[16px] font-semibold">Balance Over Time</h2>
              </div>
              <div className="flex items-center gap-0.5 p-1 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['3M', '6M', 'All'].map(pill => (
                  <motion.button
                    key={pill}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setBalanceFilter(pill)}
                    className="px-3 py-1 rounded-lg text-[12px] font-semibold transition-all"
                    style={{
                      backgroundColor: balanceFilter === pill ? 'var(--accent-primary)' : 'transparent',
                      color: balanceFilter === pill ? '#fff' : 'var(--text-muted)',
                      boxShadow: balanceFilter === pill ? '0 0 12px rgba(139,92,246,0.3)' : 'none',
                    }}
                  >
                    {pill}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filtBal} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(139,92,246,0.3)" />
                      <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date"
                    tickFormatter={v => { const d = new Date(v); return d.getDate() === 1 ? d.toLocaleString('en-US', { month: 'short' }) : ''; }}
                    axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} minTickGap={30}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="balance" stroke="#8B5CF6" strokeWidth={2.5}
                    fillOpacity={1} fill="url(#balGrad)"
                    activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#0E0E10', strokeWidth: 2.5, style: { filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.6))' } }}
                    dot={false} isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* ═══ BOTTOM GRID ═══ */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Spending Breakdown */}
          <Card introDelay={0.22} className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-[16px] font-semibold">Spending Breakdown</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-[200px] h-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catBreak} cx="50%" cy="50%" innerRadius="58%" outerRadius="82%"
                      dataKey="amount" stroke="none"
                      activeIndex={activeDonutIdx !== null ? activeDonutIdx : -1}
                      activeShape={activeShape}
                      onMouseEnter={(_, i) => setActiveDonutIdx(i)}
                      onMouseLeave={() => setActiveDonutIdx(null)}
                      isAnimationActive
                    >
                      {catBreak.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.category] || '#555'} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {activeCat ? activeCat.category : 'Total Spent'}
                  </span>
                  <span className="mono text-[20px] font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {fmt(activeCat ? activeCat.amount : cur.expense)}
                  </span>
                </div>
              </div>

              {/* Category legend with percentage bars */}
              <div className="flex flex-col gap-3 w-full max-h-[220px] overflow-y-auto hide-scrollbar pr-1">
                {catBreak.map(cat => {
                  const pct = cur.expense > 0 ? (cat.amount / cur.expense * 100) : 0;
                  const color = CAT_COLORS[cat.category] || '#555';
                  return (
                    <div key={cat.category} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">{CAT_EMOJI[cat.category] || '•'}</span>
                          <span className="text-[13px] capitalize" style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="mono text-[12px]" style={{ color: 'var(--text-primary)' }}>{fmt(cat.amount)}</span>
                          <span className="mono text-[11px] font-semibold w-10 text-right" style={{ color }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card introDelay={0.27} className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-[16px] font-semibold">Recent Activity</h2>
              </div>
              <Link to="/transactions" className="text-[12px] font-medium flex items-center gap-1 group" style={{ color: 'var(--accent-primary)' }}>
                View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="flex flex-col relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-[1px]"
                style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.2), transparent)' }}
              />
              {recent.map((tx, i) => {
                const color = CAT_COLORS[tx.category] || '#555';
                const isIncome = tx.type === 'income';
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center gap-3.5 py-2.5 pl-1 relative group"
                  >
                    {/* Timeline dot */}
                    <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 relative z-10 border-2"
                      style={{ borderColor: color, backgroundColor: `${color}30` }}
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
                          style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}
                        >
                          {CAT_EMOJI[tx.category] || '•'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium truncate" style={{ maxWidth: 140, color: 'var(--text-primary)' }}>{tx.merchant}</span>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <span className="mono text-[14px] font-semibold" style={{ color: isIncome ? 'var(--color-income)' : 'var(--text-primary)' }}>
                        {isIncome ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* ═══ ACTIVITY PULSE — Day-of-Week ═══ */}
        <motion.div variants={fadeUp}>
          <Card introDelay={0.31} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-[16px] font-semibold">Activity by Day</h2>
              <span className="text-[11px] ml-auto" style={{ color: 'var(--text-muted)' }}>All time</span>
            </div>
            <div className="flex items-end justify-between gap-3 h-[80px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                const max = Math.max(...dayActivity, 1);
                const h = (dayActivity[i] / max) * 60;
                const isMax = dayActivity[i] === max;
                return (
                  <div key={d} className="flex flex-col items-center gap-1 flex-1">
                    <motion.div
                      className="w-full max-w-[32px] rounded-lg"
                      initial={{ height: 0 }}
                      animate={{ height: Math.max(h, 4) }}
                      transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                      style={{
                        backgroundColor: isMax ? 'var(--accent-primary)' : 'rgba(139,92,246,0.2)',
                        boxShadow: isMax ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
                      }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: isMax ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{d}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
