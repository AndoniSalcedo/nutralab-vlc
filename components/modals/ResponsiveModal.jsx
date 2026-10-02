'use client';

import React from 'react';
import { Modal, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

/**
 * ResponsiveModal
 *
 * Usa SIEMPRE un único <Modal> de Mantine (nunca alterna con <Drawer>), de modo
 * que al girar el móvil / redimensionar la ventana React no desmonta el árbol
 * y el estado del formulario hijo no se pierde. Solo cambia la presentación:
 * - Escritorio (> 768px): modal centrado.
 * - Móvil (<= 768px): pantalla completa (100dvh), como un drawer.
 *
 * Escala de z-index (ver también components/Providers.jsx):
 *   navegación inferior fija: 100  <  modal/drawer: 200  <  popovers/selects: 2500
 */
export default function ResponsiveModal({
  opened,
  onClose,
  title,
  children,
  size = 'md',
  radius = 'lg',
  padding = 'lg',
  withCloseButton = true,
  centered = true,
  zIndex = 200,
  overlayProps = { backgroundOpacity: 0.55, blur: 4 },
  styles,
  // Props heredadas del Drawer: se ignoran para que no lleguen al <Modal>.
  // eslint-disable-next-line no-unused-vars
  mobilePosition,
  // eslint-disable-next-line no-unused-vars
  mobileHeight,
  ...props
}) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const custom = typeof styles === 'object' && styles ? styles : {};

  const renderedTitle =
    typeof title === 'string' ? (
      <Text fw={700} size="md">
        {title}
      </Text>
    ) : (
      title
    );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={renderedTitle}
      centered={centered && !isMobile}
      fullScreen={isMobile}
      size={size}
      radius={isMobile ? 0 : radius}
      padding={padding}
      withCloseButton={withCloseButton}
      zIndex={zIndex}
      overlayProps={overlayProps}
      transitionProps={isMobile ? { transition: 'slide-up', duration: 250 } : undefined}
      styles={{
        ...custom,
        content: {
          maxHeight: isMobile ? '100dvh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          ...custom.content,
        },
        header: {
          flexShrink: 0,
          ...(isMobile
            ? { paddingTop: 'max(12px, env(safe-area-inset-top, 12px))', paddingBottom: 10 }
            : {}),
          ...custom.header,
        },
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          ...(isMobile
            ? { paddingBottom: 'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom, 16px))' }
            : {}),
          ...custom.body,
        },
      }}
      {...props}
    >
      {children}
    </Modal>
  );
}
