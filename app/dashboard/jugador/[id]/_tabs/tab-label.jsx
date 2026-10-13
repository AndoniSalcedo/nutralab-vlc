'use client';

import { Center, Text, rem } from '@mantine/core';
import classes from './SubtabControl.module.css';

// En móvil solo la pestaña activa muestra su nombre (completo); el resto queda como icono. `mobileText` se mantiene
// en la firma por compatibilidad con las llamadas existentes.
// eslint-disable-next-line no-unused-vars
export function tabLabel(Icon, text, mobileText = text, id = null) {
  return (
    <Center id={id || undefined} style={{ minWidth: 0, width: '100%' }}>
      <Icon size={16} stroke={1.6} />
      <Text span size="sm" fw={600} lh={1} visibleFrom="sm" ml={rem(8)}>
        {text}
      </Text>
      <Text span size="sm" fw={600} lh={1} hiddenFrom="sm" className={classes.mobileText}>
        {text}
      </Text>
    </Center>
  );
}
