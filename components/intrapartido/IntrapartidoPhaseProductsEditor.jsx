'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Menu,
  MultiSelect,
  Paper,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconCopy, IconDeviceFloppy, IconDroplet, IconPlus, IconRefresh, IconTrash } from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import {
  INTRAPARTIDO_PRODUCTS,
  INTRAPARTIDO_PRODUCT_CATEGORIES,
  DEFAULT_PHASE_PRODUCTS,
  MAX_PHASES,
  MAX_QUICK_BUTTONS,
  PHASE_ICONS,
  PHASE_LABEL_MAX,
  PHASE_SHORT_MAX,
  createPhaseId,
  getDefaultPhases,
} from '@/config/intrapartido';

const PRODUCT_OPTIONS = INTRAPARTIDO_PRODUCT_CATEGORIES.map((cat) => ({
  group: cat.label,
  items: INTRAPARTIDO_PRODUCTS.filter((p) => p.categoria === cat.id).map((p) => ({ value: p.id, label: p.nombre })),
}));

// Copia los productos de una fase a las fases que se marquen
function CopyProductsButton({ phase, phases, onCopy }) {
  const [opened, setOpened] = useState(false);
  const [targets, setTargets] = useState([]);
  const others = phases.filter((p) => p.id !== phase.id);
  const allSelected = others.length > 0 && targets.length === others.length;

  const close = () => {
    setOpened(false);
    setTargets([]);
  };

  return (
    <Popover opened={opened} onChange={(o) => (o ? setOpened(true) : close())} position="bottom-end" shadow="md" radius="md" width={260} withinPortal zIndex={2500}>
      <Popover.Target>
        <Tooltip label="Copiar productos a otras fases" withArrow disabled={opened}>
          <ActionIcon
            aria-label={`Copiar productos de ${phase.short} a otras fases`}
            variant="light"
            color="gray"
            radius="xl"
            size="md"
            disabled={others.length === 0}
            onClick={() => (opened ? close() : setOpened(true))}
          >
            <IconCopy size={16} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">Copiar botones y reparto de «{phase.short}» a:</Text>
          <Checkbox
            size="xs"
            label="Todas las fases"
            checked={allSelected}
            indeterminate={targets.length > 0 && !allSelected}
            onChange={() => setTargets(allSelected ? [] : others.map((p) => p.id))}
          />
          <Checkbox.Group value={targets} onChange={setTargets}>
            <Stack gap={6} pl="sm">
              {others.map((p) => (
                <Checkbox key={p.id} size="xs" value={p.id} label={p.label} />
              ))}
            </Stack>
          </Checkbox.Group>
          <Button
            size="xs"
            radius="xl"
            color="nutralabColor.8"
            disabled={targets.length === 0}
            onClick={() => {
              onCopy(targets);
              close();
            }}
          >
            Copiar a {targets.length} {targets.length === 1 ? 'fase' : 'fases'}
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// Hueco entre fases para insertar una nueva en esa posición
function InsertPhaseButton({ onInsert, disabled }) {
  return (
    <UnstyledButton
      onClick={onInsert}
      disabled={disabled}
      aria-label="Añadir fase aquí"
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <Box style={{ flex: 1, height: 1, background: 'var(--mantine-color-gray-3)' }} />
      <Group gap={4} wrap="nowrap">
        <IconPlus size={12} />
        <Text size="xs" fw={600} c="dimmed">Añadir fase aquí</Text>
      </Group>
      <Box style={{ flex: 1, height: 1, background: 'var(--mantine-color-gray-3)' }} />
    </UnstyledButton>
  );
}

/**
 * Fases del control intrapartido del equipo (orden, nombre, icono) y los productos de cada una:
 * botones de toma individual y productos del menú «Repartir». value es la lista de fases.
 */
export default function IntrapartidoPhaseProductsEditor({ value, onChange, readOnly, hasChanges, saving, onSave }) {
  const canAdd = value.length < MAX_PHASES;

  const updatePhase = (id, patch) => {
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const insertPhase = (index) => {
    const phase = {
      id: createPhaseId(),
      label: 'Nueva fase',
      short: '',
      icon: 'droplet',
      botones: [...DEFAULT_PHASE_PRODUCTS.botones],
      reparto: [...DEFAULT_PHASE_PRODUCTS.reparto],
    };
    onChange([...value.slice(0, index), phase, ...value.slice(index)]);
  };

  const movePhase = (index, delta) => {
    const next = [...value];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  const copyProducts = (source, targetIds) => {
    const targets = new Set(targetIds);
    onChange(value.map((p) => (targets.has(p.id) ? { ...p, botones: [...source.botones], reparto: [...source.reparto] } : p)));
  };

  return (
    <Paper p="md" radius={24} shadow="xs">
      <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm">
        <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
          <IconDroplet size={20} style={{ flexShrink: 0 }} />
          <Box style={{ minWidth: 0 }}>
            <Group gap="xs" align="center" wrap="wrap">
              <Text fz={13} fw={700} c="dark.5">Intrapartido</Text>
              {hasChanges && (
                <Group gap={4} align="center" wrap="nowrap">
                  <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                  <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                </Group>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              Fases del partido y productos de cada una (botones rápidos y reparto en lote). Los partidos ya registrados conservan sus fases.
            </Text>
          </Box>
        </Group>
        {!readOnly && (
          <Group gap="xs" wrap="wrap" w={{ base: '100%', sm: 'auto' }}>
            <Button
              size="xs"
              radius="xl"
              variant="default"
              leftSection={<IconRefresh size={14} />}
              onClick={() => onChange(getDefaultPhases())}
              style={{ flex: '1 1 auto' }}
            >
              Restaurar por defecto
            </Button>
            {hasChanges && (
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                loading={saving}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={onSave}
                style={{ flex: '1 1 auto' }}
              >
                Guardar Intrapartido
              </Button>
            )}
          </Group>
        )}
      </Group>

      <Stack gap="xs">
        {!readOnly && <InsertPhaseButton onInsert={() => insertPhase(0)} disabled={!canAdd} />}
        {value.map((phase, index) => (
          <Stack key={phase.id} gap="xs">
            <Paper p="sm" radius="md" withBorder>
              <Group justify="space-between" align="flex-end" mb="xs" wrap="wrap" gap="xs">
                <Group gap="xs" wrap="nowrap" align="flex-end" style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <Menu shadow="md" position="bottom-start" radius="md" withinPortal zIndex={2500} disabled={readOnly}>
                    <Menu.Target>
                      <ActionIcon aria-label="Cambiar icono de la fase" variant="default" radius="xl" size={30} style={{ flexShrink: 0 }}>
                        <Icon3D name={phase.icon} size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <SimpleGrid cols={7} spacing={4} p={4}>
                        {PHASE_ICONS.map((icon) => (
                          <ActionIcon
                            key={icon}
                            aria-label={icon}
                            variant={icon === phase.icon ? 'light' : 'subtle'}
                            color={icon === phase.icon ? 'lima' : 'gray'}
                            radius="md"
                            size={30}
                            onClick={() => updatePhase(phase.id, { icon })}
                          >
                            <Icon3D name={icon} size={18} />
                          </ActionIcon>
                        ))}
                      </SimpleGrid>
                    </Menu.Dropdown>
                  </Menu>
                  <TextInput
                    label="Nombre"
                    value={phase.label}
                    onChange={(e) => updatePhase(phase.id, { label: e.currentTarget.value })}
                    maxLength={PHASE_LABEL_MAX}
                    readOnly={readOnly}
                    radius="xl"
                    size="xs"
                    style={{ flex: 2, minWidth: 0 }}
                  />
                  <TextInput
                    label="Abreviatura"
                    placeholder={phase.label.slice(0, PHASE_SHORT_MAX)}
                    value={phase.short}
                    onChange={(e) => updatePhase(phase.id, { short: e.currentTarget.value })}
                    maxLength={PHASE_SHORT_MAX}
                    readOnly={readOnly}
                    radius="xl"
                    size="xs"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                </Group>
                {!readOnly && (
                  <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <ActionIcon aria-label="Subir fase" variant="light" color="gray" radius="xl" size="md" disabled={index === 0} onClick={() => movePhase(index, -1)}>
                      <IconArrowUp size={16} />
                    </ActionIcon>
                    <ActionIcon aria-label="Bajar fase" variant="light" color="gray" radius="xl" size="md" disabled={index === value.length - 1} onClick={() => movePhase(index, 1)}>
                      <IconArrowDown size={16} />
                    </ActionIcon>
                    <CopyProductsButton phase={phase} phases={value} onCopy={(ids) => copyProducts(phase, ids)} />
                    <Tooltip label="Eliminar fase" withArrow>
                      <ActionIcon
                        aria-label={`Eliminar fase ${phase.label}`}
                        variant="light"
                        color="red"
                        radius="xl"
                        size="md"
                        disabled={value.length === 1}
                        onClick={() => onChange(value.filter((p) => p.id !== phase.id))}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )}
              </Group>
              <Group grow align="flex-start" wrap="wrap" gap="sm">
                <MultiSelect
                  label={`Botones rápidos (máx. ${MAX_QUICK_BUTTONS})`}
                  placeholder={phase.botones.length ? undefined : 'Solo menú «Más»'}
                  data={PRODUCT_OPTIONS}
                  value={phase.botones}
                  onChange={(ids) => updatePhase(phase.id, { botones: ids })}
                  maxValues={MAX_QUICK_BUTTONS}
                  readOnly={readOnly}
                  searchable
                  radius="xl"
                  size="xs"
                  style={{ minWidth: 220 }}
                />
                <MultiSelect
                  label="Reparto en lote"
                  placeholder={phase.reparto.length ? undefined : 'Sin reparto'}
                  data={PRODUCT_OPTIONS}
                  value={phase.reparto}
                  onChange={(ids) => updatePhase(phase.id, { reparto: ids })}
                  readOnly={readOnly}
                  searchable
                  radius="xl"
                  size="xs"
                  style={{ minWidth: 220 }}
                />
              </Group>
            </Paper>
            {!readOnly && <InsertPhaseButton onInsert={() => insertPhase(index + 1)} disabled={!canAdd} />}
          </Stack>
        ))}
        {!readOnly && !canAdd && (
          <Text size="xs" c="dimmed" ta="center">Máximo {MAX_PHASES} fases por partido.</Text>
        )}
      </Stack>
    </Paper>
  );
}
