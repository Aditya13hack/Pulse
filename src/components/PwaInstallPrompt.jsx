import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Smartphone, X } from 'lucide-react';

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hint, setHint] = useState('');
  const notificationShownRef = useRef(false);

  const showBrowserNotification = useCallback(async () => {
    const options = {
      body: 'Install Pulse for quick access on your smartphone.',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'pulse-pwa-visit',
      renotify: false,
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Pulse is ready for your phone', options);
        return;
      } catch {
        // Fall through to Notification API if service worker notification is unavailable.
      }
    }

    if ('Notification' in window) {
      try {
        new Notification('Pulse is ready for your phone', options);
      } catch {
        // Ignore if constructor-based notifications are blocked by the browser.
      }
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsStandalone(standalone);
    if (standalone) {
      return undefined;
    }

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 900);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setInstallPromptEvent(null);
      setHint('');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!visible || isStandalone || notificationShownRef.current) {
      return;
    }

    notificationShownRef.current = true;

    const notificationTimer = window.setTimeout(async () => {
      if (!('Notification' in window)) {
        return;
      }

      let permission = Notification.permission;
      if (permission === 'default') {
        try {
          permission = await Notification.requestPermission();
        } catch {
          return;
        }
      }

      if (permission === 'granted') {
        await showBrowserNotification();
      }
    }, 1300);

    return () => window.clearTimeout(notificationTimer);
  }, [visible, isStandalone, showBrowserNotification]);

  const handleInstall = async () => {
    setHint('');

    if (!installPromptEvent) {
      setHint('Tip: open your browser menu and choose Add to Home Screen.');
      return;
    }

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } finally {
      setInstallPromptEvent(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setHint('');
  };

  if (isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pwa-nudge"
          role="dialog"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-nudge-close"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pwa-nudge-main">
            <img src="/pwa-192.png" alt="Pulse app icon" className="pwa-nudge-icon" />

            <div className="pwa-nudge-copy">
              <p className="pwa-nudge-title">Get Pulse on your smartphone</p>
              <p className="pwa-nudge-subtitle">
                Install it for fast launch, full-screen view, and a native-app feel.
              </p>
            </div>

            <button type="button" className="pwa-nudge-install" onClick={handleInstall}>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install</span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {hint && <p className="pwa-nudge-hint">{hint}</p>}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
