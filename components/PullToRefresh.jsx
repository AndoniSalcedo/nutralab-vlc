'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { IconRefresh } from '@tabler/icons-react';

const THRESHOLD = 72; // px de tirón (ya amortiguado) para recargar
const MAX_PULL = 110;
const DAMPING = 0.5;

// Zonas donde el gesto pertenece a otro componente (modales, scroll interno, carruseles)
const IGNORE_SELECTOR = '[role="dialog"], [data-no-ptr], .mantine-ScrollArea-viewport, input, textarea, select';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/**
 * Tirar hacia abajo para recargar, solo en la PWA instalada: en modo standalone
 * (sobre todo en iOS) no hay botón de recargar del navegador.
 */
export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const gesture = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!isStandalone()) return undefined;

    const onStart = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0) return;
      // Con un modal abierto nunca: recargar descartaría lo que se esté editando
      if (document.querySelector('[role="dialog"]')) return;
      if (e.target instanceof Element && e.target.closest(IGNORE_SELECTOR)) return;
      const t = e.touches[0];
      gesture.current = { x: t.clientX, y: t.clientY, decided: false };
    };

    const onMove = (e) => {
      const g = gesture.current;
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x;
      const dy = t.clientY - g.y;
      if (!g.decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // Gesto horizontal o hacia arriba: no es un tirón para recargar
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          gesture.current = null;
          return;
        }
        g.decided = true;
      }
      if (window.scrollY > 0) {
        gesture.current = null;
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const next = Math.min(MAX_PULL, Math.max(0, dy * DAMPING));
      pullRef.current = next;
      setPull(next);
    };

    const onEnd = () => {
      if (!gesture.current) return;
      gesture.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        window.location.reload();
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  if (pull <= 0 && !refreshing) return null;

  const progress = Math.min(1, pull / THRESHOLD);
  const ready = progress >= 1;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 3000,
        pointerEvents: 'none',
        transform: `translateY(${pull * 0.6}px)`,
      }}
    >
      <motion.div
        animate={refreshing ? { rotate: 360 } : { rotate: progress * 270 }}
        transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: ready ? '#C1F080' : '#FFFFFF',
          color: '#1F2A24',
          opacity: 0.4 + progress * 0.6,
          boxShadow: '0 4px 14px rgba(31, 42, 36, 0.18)',
          transition: 'background-color 150ms ease',
        }}
      >
        <IconRefresh size={20} stroke={2.2} />
      </motion.div>
    </div>
  );
}
