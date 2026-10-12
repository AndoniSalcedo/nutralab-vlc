'use client';

import { Avatar, Box, Group, Paper, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@/components/icons3d';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';

/**
 * Lista de jugadores en tarjetas para móvil (sustituye a las tablas anchas).
 * Cada item: { id, player, name, subtitle, onClick, highlight, chips: [{ key, label, value, delta, tone }] }
 *  - highlight: texto corto a la derecha del nombre (p. ej. "2 alertas")
 *  - chips: valores clave; `delta` (texto) se colorea según `deltaTone` ('salvia' | 'arcilla' | 'gray')
 */
export default function PlayerListCards({ items = [], columns = 2 }) {
  return (
    <Stack gap="xs">
      {items.map((item) => (
        <Paper key={item.id} radius="lg" bg="white" p="sm" withBorder>
          <UnstyledButton onClick={item.onClick} style={{ width: '100%' }} aria-label={`Abrir ${item.name}`}>
            <Group gap="sm" wrap="nowrap" align="center">
              <Avatar src={item.player ? getPlayerAvatarUrl(item.player) : undefined} size={38} radius="xl" color="initials">
                {initials(item.name)}
              </Avatar>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fz="sm" fw={700} c="dark.5" truncate>{item.name}</Text>
                {item.subtitle && <Text fz="xs" c="dimmed" truncate>{item.subtitle}</Text>}
              </Box>
              {item.highlight}
              <IconChevronDown size={16} style={{ transform: 'rotate(-90deg)', opacity: 0.45, flexShrink: 0 }} />
            </Group>
          </UnstyledButton>

          {item.chips?.length > 0 && (
            <SimpleGrid cols={columns} spacing={8} verticalSpacing={8} mt="sm">
              {item.chips.map((chip) => (
                <Box
                  key={chip.key}
                  px={10}
                  py={6}
                  style={{ borderRadius: 12, background: 'rgba(108, 112, 90, 0.06)', minWidth: 0 }}
                >
                  <Text fz={11} fw={600} c="dimmed" truncate>{chip.label}</Text>
                  <Group gap={6} wrap="nowrap" align="baseline">
                    <Text fz="sm" fw={700} c={chip.tone ? `${chip.tone}.7` : 'dark.5'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {chip.value}
                    </Text>
                    {chip.delta && (
                      <Text fz={11} fw={700} c={`${chip.deltaTone || 'gray'}.7`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {chip.delta}
                      </Text>
                    )}
                  </Group>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Paper>
      ))}
    </Stack>
  );
}
