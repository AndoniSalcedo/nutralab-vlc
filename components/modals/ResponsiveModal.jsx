'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Drawer, Box, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

/**
 * ResponsiveModal
 *
 * Componente unificado que muestra:
 * - Un <Modal> centrado en escritorio (> 768px).
 * - Un <Drawer position="bottom"> (bottom sheet nativo) en móvil (<= 768px).
 *
 * El contenido (`children`) es lo que varía entre casos de uso.
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
  mobileHeight = 'auto',
  withCloseButton = true,
  centered = true,
  zIndex = 1000,
  overlayProps = { backgroundOpacity: 0.55, blur: 4 },
  styles,
  showDragHandle = true,
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
        styles={styles}
        {...props}
      >
        {children}
      </Modal>
    );
  }

  // En móvil (<= 768px): Drawer tipo Bottom Sheet
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={renderedTitle}
      position={mobilePosition}
      size={mobileHeight}
      withCloseButton={withCloseButton}
      zIndex={zIndex}
      padding={padding}
      overlayProps={overlayProps}
      styles={{
        content: {
          borderTopLeftRadius: mobilePosition === 'bottom' ? 24 : 0,
          borderTopRightRadius: mobilePosition === 'bottom' ? 24 : 0,
          maxHeight: mobilePosition === 'bottom' ? '90dvh' : '100%',
          display: 'flex',
          flexDirection: 'column',
          ...(typeof styles === 'object' && styles?.content ? styles.content : {}),
        },
        header: {
          paddingBottom: 8,
          ...(typeof styles === 'object' && styles?.header ? styles.header : {}),
        },
        body: {
          overflowY: 'auto',
          flex: 1,
          paddingBottom: 'calc(var(--mantine-spacing-lg) + env(safe-area-inset-bottom, 12px))',
          ...(typeof styles === 'object' && styles?.body ? styles.body : {}),
        },
        ...(typeof styles === 'object' ? styles : {}),
      }}
      {...props}
    >
      {mobilePosition === 'bottom' && showDragHandle && (
        <Box
          style={{
            width: 38,
            height: 4,
            borderRadius: 4,
            backgroundColor: 'var(--mantine-color-gray-4)',
            margin: '-4px auto 14px auto',
          }}
        />
      )}
      {children}
    </Drawer>
  );
}
