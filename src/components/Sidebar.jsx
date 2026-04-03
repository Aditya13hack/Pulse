import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Zap, Menu, X, Sun, Moon, PanelLeftClose, LayoutDashboard, ListOrdered, LineChart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ListOrdered },
  { name: 'Insights', path: '/insights', icon: LineChart },
];

export function Sidebar() {
  const { role, setRole, ui, setUI, addToast } = useStore();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sidebarOpen = ui.sidebarOpen ?? true;
  const toggleSidebar = () => setUI({ sidebarOpen: !sidebarOpen });

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

  const renderDropdown = () => (
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, x: -10 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.95, opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute left-full ml-4 bottom-0 bg-[#1E1E22] border border-white/10 rounded-[14px] p-2 min-w-[220px] shadow-2xl z-[100] origin-bottom-left flex flex-col"
        >
          <div className="px-3 py-2 flex flex-col">
            <span className="text-[14px] font-semibold text-white">User</span>
            <span className="text-[12px] text-[var(--text-muted)]">user@example.com</span>
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
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <aside 
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col backdrop-blur-[24px] saturate-[150%] transition-all duration-300 hidden md:flex border-r`}
        style={{ 
          width: sidebarOpen ? 240 : 80, 
          backgroundColor: isLightMode ? 'rgba(240,237,231,0.6)' : 'rgba(10,10,12,0.6)',
          borderColor: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
        }}
      >
        {/* Header (Logo + Toggle) */}
        <div className={`flex items-center h-[72px] ${sidebarOpen ? 'px-6' : 'justify-center'} w-full relative`}>
          <AnimatePresence mode="popLayout">
            {sidebarOpen && (
              <motion.div 
                key="logo-open"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }} 
                className="flex items-center space-x-3 overflow-hidden flex-shrink-0"
              >
                <Zap className="w-6 h-6 flex-shrink-0 text-[var(--accent-primary)]" />
                <span className="font-bold text-xl tracking-wide whitespace-nowrap text-[var(--text-primary)]">
                  Pulse
                </span>
              </motion.div>
            )}
            {!sidebarOpen && (
              <motion.div
                key="logo-closed"
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }} 
                className="flex items-center justify-center"
              >
                <Zap className="w-6 h-6 text-[var(--accent-primary)]" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Toggle button - inside when open */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.button
                key="toggle-inside"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors absolute right-4 flex items-center justify-center"
              >
                <PanelLeftClose className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Floating extend button when sidebar is closed */}
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.button
              key="toggle-outside"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-white/10 z-[60]"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4 ml-[1px]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const iconNum = item.shortcut;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={`Press ${item.shortcut} to navigate`}
                className={`group relative flex items-center h-12 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--text-primary)]' 
                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                } ${sidebarOpen ? 'px-4' : 'justify-center w-12 mx-auto'}`}
              >
                {/* Icon for nav items */}
                <div className="flex items-center justify-center w-5 h-5 opacity-70 flex-shrink-0">
                  <item.icon className="w-full h-full" />
                </div>
                
                <AnimatePresence mode="popLayout">
                  {sidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, opacity: 0 }} 
                      animate={{ opacity: 1, opacity: 1 }} 
                      exit={{ opacity: 0, opacity: 0 }}
                      className="ml-3 font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r bg-[var(--accent-primary)]"
                    style={{ boxShadow: '0 0 8px rgba(139,92,246,0.8)' }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setIsLightMode(!isLightMode)}
              className={`flex items-center h-12 rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors ${sidebarOpen ? 'px-4' : 'justify-center w-12 mx-auto'}`}
              title="Toggle Theme"
            >
              <div className="relative w-5 h-5 flex flex-shrink-0 items-center justify-center">
                <AnimatePresence mode="wait">
                  {isLightMode ? (
                    <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute">
                      <Sun className="w-5 h-5 text-amber-500" />
                    </motion.span>
                  ) : (
                    <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute">
                      <Moon className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence mode="popLayout">
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="ml-3 font-medium whitespace-nowrap"
                  >
                    {isLightMode ? 'Light Mode' : 'Dark Mode'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Profile Dropdown trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center h-12 rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-white transition-colors w-full ${sidebarOpen ? 'px-2' : 'justify-center mx-auto'}`}
              >
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full bg-white/10"
                />
                
                <AnimatePresence mode="popLayout">
                  {sidebarOpen && (
                    <motion.div 
                      className="ml-3 flex flex-col items-start overflow-hidden whitespace-nowrap"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      <span className="text-[13px] font-semibold text-[var(--text-primary)]">User</span>
                      <span className={`text-[10px] px-1.5 rounded-sm font-bold uppercase tracking-widest mt-0.5 ${role === 'admin' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border border-[var(--text-muted)]/10'}`}>
                        {role}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              {renderDropdown()}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header (retained for mobile, using a simpler layout) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-[56px] backdrop-blur-[12px] border-b transition-colors duration-300 flex items-center justify-between px-4"
        style={{ 
          backgroundColor: isLightMode ? 'rgba(240,237,231,0.85)' : 'rgba(10,10,12,0.85)',
          borderColor: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' 
        }}
      >
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
          <span className="font-bold text-lg tracking-wide" style={{ color: 'var(--text-primary)' }}>Pulse</span>
        </div>
        <button className="p-2 text-[var(--text-muted)] hover:text-white" onClick={toggleMobileNav}>
          {ui.mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
              className="fixed top-0 left-0 bottom-0 z-50 w-64 border-r p-6 flex flex-col md:hidden transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-base)',
                borderColor: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
              }}
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

              <div className="mt-auto pt-6 border-t flex flex-col gap-4" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Role</span>
                  <div className="flex bg-black/40 (light:bg-black/10) rounded-full p-0.5 border" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)' }}>
                    <button 
                      onClick={() => handleRoleSwitch('viewer')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors duration-300 ${role === 'viewer' ? 'bg-zinc-700 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Viewer
                    </button>
                    <button 
                      onClick={() => handleRoleSwitch('admin')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors duration-300 ${role === 'admin' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Theme</span>
                  <button 
                    onClick={() => setIsLightMode(!isLightMode)}
                    className="p-2 rounded-lg bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
