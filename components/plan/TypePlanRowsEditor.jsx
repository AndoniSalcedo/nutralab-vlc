import React from 'react';
import {
  Stack,
  Select,
  Paper,
  NumberInput,
  Button,
  Group,
  Text,
  SegmentedControl,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@/components/icons3d';
import { MAX_TYPE_PLAN_DAYS } from '@/config/plan-modes';

const MATCH_SCHEDULE_OPTIONS = [
  { label: 'Mañana', value: 'manana' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Noche', value: 'noche' },
];

let nextRowId = 0;

/** Fila de un plan por tipos: un tipo de día y cuántas opciones generar de él (con horario si es partido). */
function createTypeRow(tipoDia, cantidad = 1) {
  nextRowId += 1;
  return { id: nextRowId, tipoDia, cantidad, horario: tipoDia === 'partido' ? 'tarde' : null };
}

/** Filas iniciales: entreno, descanso y partido (los que tenga el equipo) o, si no, su primer tipo de día. */
export function getDefaultTypeRows(dayTypeOptions) {
  const keys = dayTypeOptions.map((o) => o.value);
  const defaults = ['entreno', 'descanso', 'partido'].filter((key) => keys.includes(key));
  return (defaults.length ? defaults : keys.slice(0, 1)).map((key) => createTypeRow(key));
}

function countTypeRows(rows) {
  return (rows || []).reduce((n, row) => n + (Number(row.cantidad) || 0), 0);
}

/** Las filas piden al menos una opción y no pasan del tope de un plan por tipos. */
export function isValidTypeRows(rows) {
  const total = countTypeRows(rows);
  return total > 0 && total <= MAX_TYPE_PLAN_DAYS;
}

/** Editor de las filas «tipo de día × opciones» de un plan por tipos. */
export default function TypePlanRowsEditor({ rows, onChange, dayTypeOptions }) {
  const total = countTypeRows(rows);
  const overLimit = total > MAX_TYPE_PLAN_DAYS;

  const updateRow = (id, changes) => onChange(rows.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={700}>Opciones por tipo de día</Text>
        <Badge color={overLimit ? 'red' : 'gray'} variant="light">
          {total} / {MAX_TYPE_PLAN_DAYS} opciones
        </Badge>
      </Group>

      {rows.map((row) => (
        <Paper key={row.id} p="xs" radius="md" withBorder bg="white">
          <Group gap="xs" align="flex-end" wrap="wrap">
            <Select
              label="Tipo de día"
              data={dayTypeOptions}
              value={row.tipoDia}
              onChange={(val) => {
                if (!val) return;
                updateRow(row.id, { tipoDia: val, horario: val === 'partido' ? (row.horario || 'tarde') : null });
              }}
              allowDeselect={false}
              size="xs"
              style={{ flex: 1, minWidth: 160 }}
            />
            {row.tipoDia === 'partido' && (
              <Stack gap={2} style={{ minWidth: 200 }}>
                <Text size="xs" fw={500}>Horario del partido</Text>
                <SegmentedControl
                  size="xs"
                  data={MATCH_SCHEDULE_OPTIONS}
                  value={row.horario || 'tarde'}
                  onChange={(val) => updateRow(row.id, { horario: val })}
                />
              </Stack>
            )}
            {/* Opciones siempre al final, alineadas en todas las filas */}
            <NumberInput
              label="Opciones"
              value={row.cantidad}
              onChange={(val) => updateRow(row.id, { cantidad: Number(val) || 0 })}
              min={1}
              max={MAX_TYPE_PLAN_DAYS}
              allowDecimal={false}
              size="xs"
              style={{ width: 90 }}
            />
            <ActionIcon
              variant="subtle"
              color="arcilla"
              size="lg"
              onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              disabled={rows.length === 1}
              aria-label="Quitar tipo de día"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}

      <Group>
        <Button
          size="xs"
          variant="subtle"
          leftSection={<IconPlus size={14} />}
          onClick={() => onChange([...rows, createTypeRow(dayTypeOptions[0]?.value)])}
        >
          Añadir tipo de día
        </Button>
      </Group>

      <Text size="xs" c="dimmed">
        Se genera sin menú comedor, con las pautas habituales del jugador. En los días de partido se aplica su protocolo
        de partido del horario elegido solo a las tomas del propio día (sin la carga de la víspera).
      </Text>
      {overLimit && (
        <Text size="xs" c="red.7" fw={500}>
          Como máximo {MAX_TYPE_PLAN_DAYS} opciones por plan.
        </Text>
      )}
    </Stack>
  );
}
