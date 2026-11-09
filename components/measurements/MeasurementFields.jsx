'use client';

import { Button, Group, SimpleGrid, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { IconHistory } from '@/components/icons3d';
import {
  MEASUREMENT_DETAIL_SECTIONS,
  countFillableFromPrevious,
  formatMetricValue,
  metricValue,
} from '@/lib/metrics/measurements';

function fechaLabel(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const sectionTitleStyle = { borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 };

/**
 * Campos de una medición antropométrica con la medición anterior al lado: cada campo enseña
 * su valor anterior y un botón copia la anterior en los campos vacíos.
 * Lo usan la ficha del jugador y el registro de mediciones por equipo.
 */
export default function MeasurementFields({ form, updateFormField, previous = null, onFillFromPrevious, disabled = false }) {
  const previousValue = (field) => (previous ? metricValue(previous, field) : null);
  const fillableCount = countFillableFromPrevious(form, previous);

  return (
    <Stack gap="xl">
      {previous ? (
        <Group justify="space-between" gap="xs">
          <Text size="sm" c="dimmed">
            Medición anterior: <Text span fw={600} c="dark.5">{fechaLabel(previous.fecha)}</Text>
          </Text>
          <Button
            size="xs"
            radius="xl"
            variant="light"
            color="bosque"
            leftSection={<IconHistory size={14} />}
            onClick={onFillFromPrevious}
            disabled={fillableCount === 0 || disabled}
          >
            Rellenar con la anterior
          </Button>
        </Group>
      ) : (
        <Text size="sm" c="dimmed">
          No hay mediciones anteriores a esta fecha.
        </Text>
      )}

      {MEASUREMENT_DETAIL_SECTIONS.map((section) => (
        <Stack gap="xs" key={section.title}>
          <Text fw={700} size="sm" c="dark.5" style={sectionTitleStyle}>
            {section.title}
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {section.fields.map((field) => (
              <TextInput
                key={field.key}
                label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                description={previous ? `Anterior: ${formatMetricValue(previousValue(field), field.unit)}` : undefined}
                inputMode="decimal"
                value={form[field.key] ?? ''}
                onChange={(e) => updateFormField(field.key, e.target.value)}
                disabled={disabled}
              />
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      <Stack gap="xs">
        <Text fw={700} size="sm" c="dark.5" style={sectionTitleStyle}>
          Otros
        </Text>
        <Textarea
          label="Notas"
          placeholder="Observaciones de la medición..."
          value={form.notas || ''}
          onChange={(e) => updateFormField('notas', e.target.value)}
          minRows={2}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  );
}
