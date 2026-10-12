'use client';

import { motion } from 'motion/react';

/**
 * Check que se dibuja (círculo + tilde) para confirmar un guardado.
 * Pensado para el `icon` de las notificaciones de Mantine.
 */
export default function AnimatedCheck({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }}
      />
    </svg>
  );
}
