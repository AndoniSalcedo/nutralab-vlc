'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  Combobox,
  Divider,
  Group,
  InputBase,
  Popover,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import SafeAvatar from '@/components/SafeAvatar';
import { IconSearch, IconUser } from '@/components/icons3d';
import { getPlayerAvatarUrl, initials, playerFullName } from '@/lib/utils';

const normalize = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Etiqueta del botón según la selección (null = todos)
function playerSelectionLabel(value, players) {
  if (value === null) return 'Todos los jugadores';
  if (value.length === 0) return 'Ningún jugador';
  if (value.length === 1) {
    const player = players.find((p) => String(p.id) === value[0]);
    return player ? playerFullName(player) : '1 jugador';
  }
  return `${value.length} jugadores`;
}

/**
 * Selector de jugadores con casillas, búsqueda y atajos por posición.
 * `value` es null cuando están todos (así los que se den de alta después también entran)
 * o un array de ids en el orden en que se eligieron.
 */
export default function PlayerPicker({ players = [], value = null, onChange, getMeta, style, size = 'sm', variant = 'filled' }) {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState('');

  const allIds = useMemo(() => players.map((p) => String(p.id)), [players]);
  const selected = useMemo(() => new Set(value === null ? allIds : value), [value, allIds]);

  const emit = (next) => {
    const valid = next.filter((id) => allIds.includes(id));
    onChange(valid.length === allIds.length ? null : valid);
  };

  const toggle = (id) => {
    const current = value === null ? allIds : value;
    emit(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const toggleGroup = (ids, checked) => {
    const current = value === null ? allIds : value;
    emit(checked ? current.filter((x) => !ids.includes(x)) : [...current, ...ids.filter((x) => !current.includes(x))]);
  };

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const visible = players
      .filter((p) => !q || normalize(`${playerFullName(p)} ${p.posicion || ''}`).includes(q))
      .sort((a, b) => playerFullName(a).localeCompare(playerFullName(b), 'es', { sensitivity: 'base' }));
    const map = new Map();
    visible.forEach((p) => {
      const key = p.posicion || 'Sin posición';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [players, query]);

  const showGroups = groups.length > 1;
  const count = value === null ? allIds.length : value.length;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      width={300}
      radius="lg"
      shadow="md"
      trapFocus
      onClose={() => setQuery('')}
    >
      <Popover.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          variant={variant}
          radius="xl"
          size={size}
          leftSection={<IconUser size={16} style={{ opacity: 0.7 }} />}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onClick={() => setOpened((o) => !o)}
          aria-label="Seleccionar jugadores"
          style={style}
        >
          <Text span fz="sm" truncate c={value === null ? 'dimmed' : undefined} fw={value === null ? 400 : 600}>
            {playerSelectionLabel(value, players)}
          </Text>
        </InputBase>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Stack gap={0}>
          <Box p="xs">
            <TextInput
              placeholder="Buscar jugador..."
              leftSection={<IconSearch size={14} style={{ opacity: 0.6 }} />}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              radius="xl"
              size="xs"
              variant="filled"
              data-autofocus
            />
          </Box>

          <Group justify="space-between" px="sm" pb={6}>
            <Text fz={11} fw={700} c="dimmed" tt="uppercase">
              {count} de {allIds.length}
            </Text>
            <Group gap={10}>
              <UnstyledButton onClick={() => onChange(null)} fz="xs" fw={700} c={value === null ? 'dimmed' : 'bosque.6'} disabled={value === null}>
                Todos
              </UnstyledButton>
              <UnstyledButton onClick={() => onChange([])} fz="xs" fw={700} c={value?.length === 0 ? 'dimmed' : 'bosque.6'} disabled={value?.length === 0}>
                Ninguno
              </UnstyledButton>
            </Group>
          </Group>
          <Divider color="gray.2" />

          <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
            <Stack gap={0} py={4}>
              {groups.length === 0 && (
                <Text fz="xs" c="dimmed" ta="center" py="md">Sin coincidencias</Text>
              )}
              {groups.map(([position, list]) => {
                const ids = list.map((p) => String(p.id));
                const checkedCount = ids.filter((id) => selected.has(id)).length;
                const allChecked = checkedCount === ids.length;
                return (
                  <Box key={position}>
                    {showGroups && (
                      <Group px="sm" pt={8} pb={4} gap={8} wrap="nowrap">
                        <Checkbox
                          size="xs"
                          color="bosque"
                          checked={allChecked}
                          indeterminate={checkedCount > 0 && !allChecked}
                          onChange={() => toggleGroup(ids, allChecked)}
                          aria-label={`Seleccionar ${position}`}
                        />
                        <Text fz={11} fw={700} c="var(--nutra-salvia, #6C705A)" tt="uppercase" lts={0.4}>
                          {position}
                        </Text>
                      </Group>
                    )}
                    {list.map((player) => {
                      const id = String(player.id);
                      const meta = getMeta?.(player);
                      return (
                        <UnstyledButton
                          key={id}
                          onClick={() => toggle(id)}
                          px="sm"
                          py={5}
                          w="100%"
                          className="nl-picker-row"
                          style={{ display: 'block', borderRadius: 8 }}
                        >
                          <Group gap={8} wrap="nowrap">
                            <Checkbox size="xs" color="bosque" checked={selected.has(id)} readOnly tabIndex={-1} style={{ pointerEvents: 'none' }} />
                            <SafeAvatar src={getPlayerAvatarUrl(player)} size={22} radius="xl" color="initials">
                              {initials(playerFullName(player))}
                            </SafeAvatar>
                            <Text fz="sm" fw={500} truncate style={{ flex: 1, minWidth: 0 }}>
                              {playerFullName(player)}
                            </Text>
                            {meta && <Text fz={11} c="dimmed" style={{ flexShrink: 0 }}>{meta}</Text>}
                          </Group>
                        </UnstyledButton>
                      );
                    })}
                  </Box>
                );
              })}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
        <style>{'.nl-picker-row:hover { background: rgba(108, 112, 90, 0.07); }'}</style>
      </Popover.Dropdown>
    </Popover>
  );
}
