'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Drawer, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

/**
 * ResponsiveModal
 *
 * Componente unificado que muestra:
 * - Un <Modal> centrado en escritorio (> 768px).
 * - Un <Drawer> a pantalla completa (100% / 100dvh) en móvil (<= 768px).
 */
export default function ResponsiveModal({
  opened,
  onClose,
  title,
  children,
  size = 'md',
  radius = 'lg',
  padding = 'lg',
  mobilePosition = 'bottom',
  mobileHeight = '100%',
  withCloseButton = true,
  centered = true,
  zIndex = 1000,
  overlayProps = { backgroundOpacity: 0.55, blur: 4 },
  styles,
  ...props
}) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderedTitle =
    typeof title === 'string' ? (
      <Text fw={700} size="md">
        {title}
      </Text>
    ) : (
      title
    );

  // Fallback seguro durante SSR / primer renderizado antes del hook
  if (!mounted || !isMobile) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={renderedTitle}
        centered={centered}
        size={size}
        radius={radius}
        padding={padding}
        withCloseButton={withCloseButton}
        zIndex={zIndex}
        overlayProps={overlayProps}
        styles={{
          ...(typeof styles === 'object' ? styles : {}),
          content: {
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            ...(typeof styles === 'object' && styles?.content ? styles.content : {}),
          },
          body: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflowY: 'hidden',
            ...(typeof styles === 'object' && styles?.body ? styles.body : {}),
          },
        }}
        {...props}
      >
        {children}
      </Modal>
    );
  }

  // En móvil (<= 768px): Drawer a pantalla completa 100%
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={renderedTitle}
      position={mobilePosition}
      size={mobileHeight || '100%'}
      withCloseButton={withCloseButton}
      zIndex={zIndex}
      padding={padding}
      overlayProps={overlayProps}
      styles={{
        ...(typeof styles === 'object' ? styles : {}),
        content: {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: '100dvh',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          ...(typeof styles === 'object' && styles?.content ? styles.content : {}),
        },
        header: {
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
          paddingBottom: 10,
          flexShrink: 0,
          ...(typeof styles === 'object' && styles?.header ? styles.header : {}),
        },
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: 'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom, 16px))',
          ...(typeof styles === 'object' && styles?.body ? styles.body : {}),
        },
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
}
