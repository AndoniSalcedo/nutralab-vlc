'use client';

import { Dropzone } from '@mantine/dropzone';
import { Badge, Box, Button, Group, Paper, Stack, Text, ThemeIcon, Title, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCloudUpload, IconDownload, IconRefresh, IconX } from '@/components/icons3d';

// Piezas comunes de los importadores (métricas y osmolaridad): en móvil las tablas pasan a tarjetas,
// la zona de subida se compacta y el botón de confirmar queda fijo abajo.

export function useIsMobile() {
  return useMediaQuery('(max-width: 48em)', false);
}

export function ImporterShell({ icon: Icon, title, description, showReset, resetDisabled, onReset, children }) {
  return (
    <Paper
      radius="lg"
      p={{ base: 0, sm: 'md' }}
      withBorder={false}
      bg="white"
      style={{ minWidth: 0 }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon color="teal" variant="light" radius="md" size={36} visibleFrom="sm">
              <Icon size={18} />
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Title order={4} fz={{ base: 'sm', sm: 'lg' }} c="dark.8" lh={1.2}>
                {title}
              </Title>
              <Text size="xs" c="dimmed" lineClamp={2} visibleFrom="sm">
                {description}
              </Text>
            </Box>
          </Group>

          {showReset && (
            <Button
              size="xs"
              radius="xl"
              variant="light"
              color="gray"
              leftSection={<IconRefresh size={14} />}
              onClick={onReset}
              disabled={resetDisabled}
              style={{ flexShrink: 0 }}
            >
              Nuevo archivo
            </Button>
          )}
        </Group>

        {children}
      </Stack>
    </Paper>
  );
}

export function ImportDropzone({ openRef, onDrop, accept, maxSize, idleLabel, rejectLabel, onTemplate }) {
  const theme = useMantineTheme();

  return (
    <Dropzone
      openRef={openRef}
      onDrop={onDrop}
      accept={accept}
      maxSize={maxSize}
      radius="lg"
      activateOnClick={false}
      p={{ base: 'md', sm: 40 }}
      style={{
        border: '2px dashed var(--mantine-color-gray-4)',
        backgroundColor: 'var(--mantine-color-gray-0)',
        textAlign: 'center',
      }}
    >
      <Stack gap={4} align="center" style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconDownload size={42} color={theme.colors.blue[6]} stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={42} color={theme.colors.red[6]} stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconCloudUpload size={42} stroke={1.5} color="var(--mantine-color-dimmed)" />
        </Dropzone.Idle>

        <Text ta="center" fw={700} fz={{ base: 'md', sm: 'lg' }} mt="xs">
          <Dropzone.Accept>¡Suelta el archivo aquí!</Dropzone.Accept>
          <Dropzone.Reject>{rejectLabel}</Dropzone.Reject>
          <Dropzone.Idle>{idleLabel}</Dropzone.Idle>
        </Text>
        <Text ta="center" size="sm" c="dimmed" visibleFrom="sm">
          Arrastra y suelta el archivo o selecciónalo.
        </Text>
      </Stack>

      <Group justify="center" mt="md" gap="xs" grow preventGrowOverflow={false} wrap="wrap">
        <Button
          radius="xl"
          size="sm"
          color="dark"
          style={{ pointerEvents: 'all' }}
          onClick={() => openRef.current?.()}
          maw={{ sm: 220 }}
        >
          Seleccionar archivo
        </Button>
        <Button
          radius="xl"
          size="sm"
          variant="default"
          style={{ pointerEvents: 'all' }}
          onClick={onTemplate}
          leftSection={<IconDownload size={14} />}
          maw={{ sm: 220 }}
        >
          Plantilla
        </Button>
      </Group>
    </Dropzone>
  );
}

export function SummaryBadges({ items }) {
  return (
    <Group gap={6} wrap="wrap">
      {items.filter(Boolean).map(({ label, color }) => (
        <Badge key={label} color={color} variant="light" size="md" radius="sm" tt="none">
          {label}
        </Badge>
      ))}
    </Group>
  );
}

/** Fila de jugador en móvil: nombre + estado arriba, datos en una línea y, debajo, el control de acción. */
export function ImportRowCard({ title, subtitle, badge, meta, children }) {
  return (
    <Paper withBorder radius="lg" p="sm" bg="white">
      <Stack gap={8}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} size="sm" truncate>
              {title}
            </Text>
            {subtitle ? (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {subtitle}
              </Text>
            ) : null}
          </Box>
          <Box style={{ flexShrink: 0 }}>{badge}</Box>
        </Group>
        {meta?.length ? (
          <Group gap="md" wrap="wrap">
            {meta.map(({ label, value }) => (
              <Text key={label} size="xs" c="dimmed">
                {label}:{' '}
                <Text span size="xs" fw={600} c="dark.6">
                  {value}
                </Text>
              </Text>
            ))}
          </Group>
        ) : null}
        {children}
      </Stack>
    </Paper>
  );
}

/** Pie con el resumen y el botón de confirmar; en móvil queda fijo al fondo del área de scroll. */
export function ImportActionBar({ text, children }) {
  return (
    <Box
      pos="sticky"
      bottom={0}
      bg="white"
      py="xs"
      style={{ zIndex: 2, borderTop: '1px solid var(--mantine-color-gray-2)' }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <Text size="xs" c="dimmed" style={{ minWidth: 0 }}>
          {text}
        </Text>
        <Box style={{ flexShrink: 0 }}>{children}</Box>
      </Group>
    </Box>
  );
}
