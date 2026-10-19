'use client';

import { Table } from '@mantine/core';
import { motion, useReducedMotion } from 'motion/react';

const MotionTr = motion.create(Table.Tr);

/**
 * Fila de tabla con entrada escalonada: cada una sube y aparece con un pequeño
 * retardo según su `index` (tope en 8 para que las tablas largas no tarden).
 * Sustituye a `Table.Tr` en las tablas de listado.
 */
export default function AnimatedRow({ index = 0, children, ...props }) {
  const reduce = useReducedMotion();
  if (reduce) return <Table.Tr {...props}>{children}</Table.Tr>;
  return (
    <MotionTr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 + Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </MotionTr>
  );
}
