'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * Pequeña explosión de partículas para celebrar un logro (objetivo de agua,
 * todos los suplementos tomados…). Se dispara cambiando `burstKey`.
 */
export function ParticleBurst({ burstKey, colors = ['#C1F080', '#7cc6f2', '#f2b45c'], count = 14, top = '50%', left = '50%' }) {
  const reduce = useReducedMotion();
  if (reduce || !burstKey) return null;
  return (
    <span key={burstKey} aria-hidden style={{ position: 'absolute', top, left, width: 0, height: 0, pointerEvents: 'none', zIndex: 3 }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + (i % 2) * 0.2;
        const dist = 46 + (i % 3) * 18;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              width: i % 3 === 0 ? 8 : 6,
              height: i % 3 === 0 ? 8 : 6,
              marginLeft: -3,
              marginTop: -3,
              borderRadius: i % 2 ? '50%' : 2,
              background: colors[i % colors.length],
            }}
          />
        );
      })}
    </span>
  );
}

/**
 * Etiquetas que suben y se desvanecen ("+250 ml", "+1"). `items` = [{ id, text }].
 */
export function FloatingLabels({ items = [], color = 'var(--mantine-color-blue-6)', style }) {
  return (
    <span aria-hidden style={{ position: 'absolute', pointerEvents: 'none', zIndex: 3, ...style }}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
            style={{ position: 'absolute', whiteSpace: 'nowrap', fontWeight: 800, fontSize: 13, color }}
          >
            {item.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
