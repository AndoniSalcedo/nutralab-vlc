'use client';

import React from 'react';
import { Group } from '@mantine/core';

/**
 * ModalFooter
 *
 * Barra de acciones (Guardar / Cancelar) que queda fija en la parte inferior
 * del cuerpo con scroll de <ResponsiveModal>, para que los botones sean siempre
 * visibles aunque el formulario sea más alto que la pantalla.
 */
export default function ModalFooter({ children, style, ...props }) {
  return (
    <Group
      justify="flex-end"
      mt="md"
      py="sm"
      {...props}
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        background: 'var(--mantine-color-body)',
        borderTop: '1px solid var(--mantine-color-default-border)',
        ...style,
      }}
    >
      {children}
    </Group>
  );
}
