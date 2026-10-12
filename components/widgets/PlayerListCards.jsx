'use client';

import { useState } from 'react';
import { Avatar, Box, Group, Paper, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { AnimatePresence, motion } from 'motion/react';
import { IconChevronDown } from '@/components/icons3d';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';

/**
 * Lista de jugadores en tarjetas para móvil (sustituye a las tablas anchas).
 * Cada item: { id, player, name, subtitle, onClick, highlight, chips: [{ key, label, value, delta, tone }] }
 *  - highlight: texto corto a la derecha del nombre (p. ej. "2 alertas")
 *  - chips: valores clave; `delta` (texto) se colorea según `deltaTone` ('salvia' | 'arcilla' | 'gray')
 * Con `maxChips` se muestran solo los primeros y el resto se despliega con "ver más".
 */
function Chip({ chip }) {
  return (
    <Box px={10} py={6} style={{ borderRadius: 12, background: 'rgba(108, 112, 90, 0.06)', minWidth: 0 }}>
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
  );
}

function PlayerCard({ item, columns, maxChips, index }) {
  const [expanded, setExpanded] = useState(false);
  const chips = item.chips || [];
  const limit = maxChips && chips.length > maxChips + 1 ? maxChips : chips.length;
  const visible = expanded ? chips : chips.slice(0, limit);
  const hidden = chips.length - limit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Paper radius="lg" bg="white" p="sm" withBorder>
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

        {visible.length > 0 && (
          <SimpleGrid cols={columns} spacing={8} verticalSpacing={8} mt="sm">
            <AnimatePresence initial={false}>
              {visible.map((chip) => (
                <motion.div
                  key={chip.key}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  style={{ minWidth: 0 }}
                >
                  <Chip chip={chip} />
                </motion.div>
              ))}
            </AnimatePresence>
          </SimpleGrid>
        )}

        {hidden > 0 && (
          <UnstyledButton onClick={() => setExpanded((v) => !v)} mt={8} aria-expanded={expanded}>
            <Text fz="xs" fw={700} c="var(--nutra-salvia, #6C705A)">
              {expanded ? 'Ver menos' : `Ver ${hidden} más`}
            </Text>
          </UnstyledButton>
        )}
      </Paper>
    </motion.div>
  );
}

export default function PlayerListCards({ items = [], columns = 2, maxChips }) {
  return (
    <Stack gap="xs">
      {items.map((item, index) => (
        <PlayerCard key={item.id} item={item} columns={columns} maxChips={maxChips} index={index} />
      ))}
    </Stack>
  );
}
