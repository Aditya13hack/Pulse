import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../store';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    color: '#10B981', // green
  },
  error: {
    icon: XCircle,
    color: '#F43F5E', // rose
  },
  info: {
    icon: Info,
    color: '#8B5CF6', // violet
  }
};

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed top-[72px] right-[24px] z-[1000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = VARIANTS[toast.type] || VARIANTS.info;
  const Icon = config.icon;

  // We set auto-remove in the store logic (3000ms), 
  // but we can also handle the visual bar closing exactly on that 3s window.

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto relative overflow-hidden bg-[#1E1E22] border border-white/10 rounded-xl shadow-2xl p-[12px_16px] min-w-[280px] max-w-[360px] flex items-start gap-3"
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      <Icon className="w-5 h-5 mt-0.5" style={{ color: config.color }} />
      <div className="flex-1">
        <p className="text-[14px] text-text-primary leading-tight font-medium">
          {toast.message}
        </p>
      </div>
      <button 
        onClick={onRemove}
        className="text-text-muted hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Countdown bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full" style={{ backgroundColor: `${config.color}20` }}>
        <div 
          className="h-full origin-left" 
          style={{ 
            backgroundColor: config.color,
            animation: 'toast-progress 3s linear forwards'
          }} 
        />
      </div>

      <style>{`
        @keyframes toast-progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </motion.div>
  );
}
