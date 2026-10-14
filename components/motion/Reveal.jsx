'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Entrada escalonada de las teselas del bento: cada una sube y aparece con un
 * pequeño retardo según su `index`. Ocupa todo el alto para no romper la rejilla.
 */
export default function Reveal({ index = 0, children, style }) {
  const reduce = useReducedMotion();
  // Sin animación se mantiene el contenedor para no perder el estilo (p. ej. gridColumn)
  if (reduce) return <div style={{ height: '100%', ...style }}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.04 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%', ...style }}
    >
      {children}
    </motion.div>
  );
}
