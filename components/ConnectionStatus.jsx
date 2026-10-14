'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';

/**
 * Píldora flotante que avisa al perder la conexión (los guardados fallarán) y
 * confirma brevemente cuando vuelve. Útil en la PWA con mala cobertura.
 */
export default function ConnectionStatus() {
  const [status, setStatus] = useState('online'); // 'online' | 'offline' | 'back'
  const timer = useRef(null);

  useEffect(() => {
    const goOffline = () => {
      clearTimeout(timer.current);
      setStatus('offline');
    };
    const goOnline = () => {
      clearTimeout(timer.current);
      setStatus((prev) => (prev === 'offline' ? 'back' : 'online'));
      timer.current = setTimeout(() => setStatus('online'), 2500);
    };
    if (typeof navigator !== 'undefined' && navigator.onLine === false) goOffline();
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  const offline = status === 'offline';

  return (
    <AnimatePresence>
      {status !== 'online' && (
        <motion.div
          key={status}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
            left: 0,
            right: 0,
            margin: '0 auto',
            width: 'fit-content',
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.3,
            color: offline ? '#fff' : '#1F2A24',
            background: offline ? '#B8674A' : '#C1F080',
            boxShadow: '0 6px 20px rgba(31, 42, 36, 0.18)',
            pointerEvents: 'none',
          }}
        >
          {offline ? <IconWifiOff size={16} stroke={2} /> : <IconWifi size={16} stroke={2} />}
          <span>{offline ? 'Sin conexión: los cambios no se guardarán hasta que vuelva' : 'Conexión recuperada'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
