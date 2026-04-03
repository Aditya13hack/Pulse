import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Zap, Menu, X, User, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

const navItems = [
  { name: 'Dashboard', path: '/', shortcut: '1' },
  { name: 'Transactions', path: '/transactions', shortcut: '2' },
  { name: 'Insights', path: '/insights', shortcut: '3' },
];

export function Navigation() {
  const { role, setRole, ui, setUI, addToast } = useStore();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('pulse-theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('pulse-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('pulse-theme', 'dark');
    }
  }, [isLightMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileNav = () => setUI({ mobileNavOpen: !ui.mobileNavOpen });

  const handleRoleSwitch = (newRole) => {
    if (role !== newRole) {
      setRole(newRole);
      setDropdownOpen(false);
      addToast(`Switched to ${newRole} mode`, 'info');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const renderDropdown = () => (
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-[48px] bg-[#1E1E22] border border-white/10 rounded-[14px] p-2 min-w-[220px] shadow-2xl z-[100] origin-top-right flex flex-col"
        >
          <div className="px-3 py-2 flex flex-col">
            <span className="text-[14px] font-semibold text-white">Arjun Sharma</span>
            <span className="text-[12px] text-[var(--text-muted)]">arjun@example.com</span>
          </div>
          
          <div className="h-[1px] w-full bg-white/5 my-1" />
          
          <div className="px-3 py-2 flex items-center justify-between gap-4">
            <span className="text-[13px] text-[var(--text-muted)] font-medium">Role</span>
            <div className="flex bg-black/40 rounded-full p-0.5 border border-white/5">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleRoleSwitch('viewer')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors duration-300 ${role === 'viewer' ? 'bg-zinc-700 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
              >
                Viewer
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleRoleSwitch('admin')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors duration-300 ${role === 'admin' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
              >
                Admin
              </motion.button>
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/5 my-1" />

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsLightMode(!isLightMode)}
            className="px-3 py-2 w-full flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors group"
          >
            <span className="text-[13px] text-[var(--text-muted)] font-medium group-hover:text-white transition-colors">Theme</span>
            <div className="relative w-4 h-4">
              <AnimatePresence mode="wait">
                {isLightMode ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute inset-0 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute inset-0 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-[var(--accent-primary)]" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[56px] backdrop-blur-[12px] border-b border-white/[0.06] transition-colors duration-300"
        style={{ backgroundColor: isLightMode ? 'rgba(245,244,240,0.85)' : 'rgba(14,14,16,0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
            <span className="font-bold text-lg tracking-wide" style={{ color: 'var(--text-primary)' }}>Pulse</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 h-full">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={`Press ${item.shortcut} to navigate`}
                  className={`group relative h-full flex items-center text-sm font-medium transition-colors ${
                    isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.name}
                  {/* Keyboard hint pill */}
                  <span className="absolute -top-0.5 -right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[var(--text-muted)] bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono leading-none">
                    {item.shortcut}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavDot"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
                      style={{ boxShadow: '0 0 8px rgba(139,92,246,0.8)' }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-[var(--text-muted)]">{currentDate}</span>
            <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              role === 'admin' 
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' 
                : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/60'
            }`}>
              {role}
            </div>
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full bg-zinc-800/60 flex items-center justify-center border border-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
              </motion.button>
              {renderDropdown()}
            </div>
          </div>

          <button 
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-white"
            onClick={toggleMobileNav}
          >
            {ui.mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {ui.mobileNavOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={toggleMobileNav}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-64 border-r border-white/5 p-6 flex flex-col md:hidden transition-colors"
              style={{ backgroundColor: 'var(--bg-base)' }}
            >
              <div className="flex items-center space-x-2 mb-10">
                <Zap className="w-6 h-6 text-[var(--accent-primary)]" />
                <span className="font-bold text-xl tracking-wide" style={{ color: 'var(--text-primary)' }}>Pulse</span>
              </div>
              
              <div className="flex flex-col space-y-6">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={toggleMobileNav}
                    className={({ isActive }) => `text-lg font-medium transition-colors ${
                      isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Role</span>
                  <div className="flex bg-black/40 rounded-full p-0.5 border border-white/5">
                    <button 
                      onClick={() => handleRoleSwitch('viewer')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors duration-300 ${role === 'viewer' ? 'bg-zinc-700 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                      Viewer
                    </button>
                    <button 
                      onClick={() => handleRoleSwitch('admin')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors duration-300 ${role === 'admin' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Theme</span>
                  <button 
                    onClick={() => setIsLightMode(!isLightMode)}
                    className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    {isLightMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
