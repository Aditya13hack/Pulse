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
      className="pointer-events-auto relative overflow-hidden rounded-xl p-[14px_18px] min-w-[300px] max-w-[400px] flex items-start gap-3 backdrop-blur-xl transition-colors duration-300"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderColor: 'var(--border-subtle)',
        borderWidth: '1px',
        borderLeft: `4px solid ${config.color}`,
        boxShadow: 'var(--card-shadow-hover)',
      }}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0" style={{ backgroundColor: `${config.color}15` }}>
        <Icon className="w-4 h-4" style={{ color: config.color }} />
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-[14px] leading-snug font-semibold" style={{ color: 'var(--text-primary)' }}>
          {toast.message}
        </p>
      </div>
      <button 
        onClick={onRemove}
        className="p-1 rounded-md transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <X className="w-3.5 h-3.5" />
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
