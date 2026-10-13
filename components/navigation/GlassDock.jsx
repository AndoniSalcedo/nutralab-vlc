'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Box, Text } from '@mantine/core';
import classes from './GlassDock.module.css';

/**
 * Barra de navegación inferior en móvil: dock flotante de cristal (estilo Apple) con una burbuja que se desliza a la
 * pestaña activa. Cada item es `{ value, label, icon, href?, onClick?, id? }`: con `href` es un enlace, si no un botón.
 * `layoutId` identifica la burbuja; cada dock usa el suyo.
 */
export default function GlassDock({ items, active, layoutId, ariaLabel }) {
  return (
    <Box hiddenFrom="sm" className={classes.dock}>
      <nav className={classes.bar} aria-label={ariaLabel} data-compact={items.length > 4 || undefined}>
        {items.map(({ value, label, icon, href, onClick, id }) => {
          const isActive = value === active;
          const content = (
            <>
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className={classes.bubble}
                  transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                />
              )}
              <span className={classes.icon}>{icon}</span>
              <Text component="span" fz={10} lh={1.2} className={classes.label}>
                {label}
              </Text>
            </>
          );
          const common = {
            id,
            className: classes.tab,
            'data-active': isActive || undefined,
            'aria-current': isActive ? 'page' : undefined,
            onClick,
          };
          return href ? (
            <Link key={value} href={href} {...common}>{content}</Link>
          ) : (
            <button key={value} type="button" {...common}>{content}</button>
          );
        })}
      </nav>
    </Box>
  );
}
