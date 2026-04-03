import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { AddTransactionDrawer } from './components/AddTransactionDrawer';
import { useStore } from './store';

const loadDashboardPage = () => import('./pages/Dashboard');
const loadTransactionsPage = () => import('./pages/Transactions');
const loadInsightsPage = () => import('./pages/Insights');

const dashboardModulePromise = loadDashboardPage();

const Dashboard = lazy(() => dashboardModulePromise);
const Transactions = lazy(loadTransactionsPage);
const Insights = lazy(loadInsightsPage);

/* ─── Animated Background Mesh ─── */
function BackgroundMesh() {
  return (
    <div className="bg-mesh" aria-hidden="true">
      <div className="bg-orb bg-orb--violet" />
      <div className="bg-orb bg-orb--amber" />
      <div className="bg-orb bg-orb--teal" />
      <div className="bg-noise" />
      <div className="bg-3d-grid" />
    </div>
  );
}

/* ─── Page Skeleton (Suspense fallback) ─── */
function PageSkeleton() {
  return (
    <div className="pt-8 md:pt-12 px-4 max-w-7xl mx-auto flex flex-col gap-6 w-full">
      <div className="h-[120px] w-full rounded-2xl shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-[140px] rounded-2xl shimmer" />
        <div className="h-[140px] rounded-2xl shimmer" />
        <div className="h-[140px] rounded-2xl shimmer" />
      </div>
      <div className="h-[300px] w-full rounded-2xl shimmer" />
    </div>
  );
}

const routeTransitionVariants = {
  initial: ({ reducedMotion }) => (
    reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.992, filter: 'blur(1.6px) saturate(86%)' }
  ),
  animate: ({ reducedMotion }) => (
    reducedMotion
      ? { opacity: 1, transition: { duration: 0.1, ease: 'easeOut' } }
      : {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px) saturate(100%)',
          transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
        }
  ),
  exit: ({ reducedMotion }) => (
    reducedMotion
      ? { opacity: 0, transition: { duration: 0.08, ease: 'easeIn' } }
      : {
          opacity: 0,
          scale: 1.004,
          filter: 'blur(1px) saturate(108%)',
          transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
        }
  ),
};

function RouteTransitionFrame({ reducedMotion, children }) {
  return (
    <motion.div
      custom={{ reducedMotion }}
      variants={routeTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="route-transition-frame"
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated Routes ─── */
function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { role, ui, setUI, setFilters, filters } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;

      if (e.key === 'Escape') {
        if (ui.addTransactionOpen) { setUI({ addTransactionOpen: false }); return; }
        if (filters.search) { setFilters({ search: '' }); return; }
      }

      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        if (location.pathname !== '/transactions') navigate('/transactions');
        setUI({ focusSearch: true });
        return;
      }

      if (e.key === 'n' && role === 'admin') { setUI({ addTransactionOpen: true }); return; }
      if (e.key === '1') navigate('/');
      if (e.key === '2') navigate('/transactions');
      if (e.key === '3') navigate('/insights');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, role, ui, filters.search, navigate, setUI, setFilters]);

  useEffect(() => {
    const titles = { '/': 'Dashboard', '/transactions': 'Transactions', '/insights': 'Insights' };
    document.title = `${titles[location.pathname] || 'Pulse'} · Pulse`;
  }, [location.pathname]);

  return (
    <AnimatePresence mode="sync" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <RouteTransitionFrame reducedMotion={reducedMotion}>
              <Suspense fallback={<PageSkeleton />}>
                <Dashboard />
              </Suspense>
            </RouteTransitionFrame>
          }
        />
        <Route
          path="/transactions"
          element={
            <RouteTransitionFrame reducedMotion={reducedMotion}>
              <Suspense fallback={<PageSkeleton />}>
                <Transactions />
              </Suspense>
            </RouteTransitionFrame>
          }
        />
        <Route
          path="/insights"
          element={
            <RouteTransitionFrame reducedMotion={reducedMotion}>
              <Suspense fallback={<PageSkeleton />}>
                <Insights />
              </Suspense>
            </RouteTransitionFrame>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

/* ─── App Shell ─── */
function AppShell() {
  const { ui } = useStore();
  const sidebarOpen = ui.sidebarOpen ?? true;

  useEffect(() => {
    const warmRoutes = () => {
      loadTransactionsPage();
      loadInsightsPage();
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmRoutes, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(warmRoutes, 350);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-300 relative flex">
      <BackgroundMesh />
      <Sidebar />
      <main className={`relative z-10 flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? 'md:ml-[240px]' : 'md:ml-[80px]'}`}>
        <AnimatedRoutes />
      </main>
      <AddTransactionDrawer />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
