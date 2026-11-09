import React from 'react';
import {
  Group,
  Text,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Button,
  ScrollArea,
  Divider
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import Icon3D from '@/components/Icon3D';
import { IconHistory } from '@/components/icons3d';
import {
  MEASUREMENT_DETAIL_SECTIONS,
  formatMetricValue,
  hasMetricValue,
  metricValue,
} from '@/lib/metrics/measurements';
import ResponsiveModal from './ResponsiveModal';

function fechaLabel(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function dateValue(value) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function dateInputToIso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MeasurementModal({
  opened,
  onClose,
  modalMode,
  form,
  updateFormField,
  previous = null,
  onFillFromPrevious,
  handleSave,
  saving
}) {
  const previousValue = (field) => (previous ? metricValue(previous, field) : null);

  // Campos vacíos que se rellenarían con la medición anterior
  const fillableCount = MEASUREMENT_DETAIL_SECTIONS.reduce(
    (total, section) => total + section.fields.filter(
      (field) => !hasMetricValue(form[field.key]) && hasMetricValue(previousValue(field))
    ).length,
    0
  );

  return (
    <ResponsiveModal
      // Formulario de captura: un clic fuera no debe descartar lo escrito
      closeOnClickOutside={false}
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          {modalMode === 'new' ? (
            <Icon3D name="gym" size={26} />
          ) : (
            <Icon3D name="edit" size={26} />
          )}
          <Text fw={700}>
            {modalMode === 'new' ? 'Registrar medición' : 'Editar medición'}
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <DateInput
          label="Fecha de medición"
          required
          value={dateValue(form.fecha)}
          onChange={(value) => updateFormField('fecha', dateInputToIso(value))}
          placeholder="Selecciona la fecha"
          valueFormat="DD/MM/YYYY"
          leftSection={<Icon3D name="calendar" size={20} />}
        />

        <Divider my="xs" label="Métricas del Jugador" labelPosition="center" />

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
              disabled={fillableCount === 0 || saving}
            >
              Rellenar con la anterior
            </Button>
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            No hay mediciones anteriores a esta fecha.
          </Text>
        )}

        <ScrollArea.Autosize mah="50vh" offsetScrollbars>
          <Stack gap="xl" pr="xs">
            {MEASUREMENT_DETAIL_SECTIONS.map((section) => (
              <Stack gap="xs" key={section.title}>
                <Text fw={700} size="sm" c="dark.5" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 }}>
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
                    />
                  ))}
                </SimpleGrid>
              </Stack>
            ))}

            <Stack gap="xs">
              <Text fw={700} size="sm" c="dark.5" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 }}>
                Otros
              </Text>
              <Textarea
                label="Notas"
                placeholder="Observaciones de la medición..."
                value={form.notas || ''}
                onChange={(e) => updateFormField('notas', e.target.value)}
                minRows={2}
              />
            </Stack>
          </Stack>
        </ScrollArea.Autosize>

        <Divider my="xs" />

        <Group justify="flex-end">
          <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="xs"
            radius="xl"
            leftSection={<Icon3D name="check" size={20} />}
            onClick={handleSave}
            loading={saving}
            disabled={!form.fecha}
          >
            Guardar medición
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}
