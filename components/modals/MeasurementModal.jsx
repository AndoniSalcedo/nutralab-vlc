import React from 'react';
import {
  Modal,
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
import { IconRuler2, IconEdit, IconCheck, IconCalendar } from '@tabler/icons-react';
import { MEASUREMENT_DETAIL_SECTIONS } from '@/lib/measurement-metrics';

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
  handleSave,
  saving
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          {modalMode === 'new' ? (
            <IconRuler2 size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          ) : (
            <IconEdit size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
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
          leftSection={<IconCalendar size={16} />}
        />

        <Divider my="xs" label="Métricas del Jugador" labelPosition="center" />

        <ScrollArea.Autosize maxHeight="50vh" offsetScrollbars>
          <Stack gap="xl" pr="xs">
            {MEASUREMENT_DETAIL_SECTIONS.map((section) => (
              <Stack gap="xs" key={section.title}>
                <Text fw={700} size="sm" c="blue.6" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 }}>
                  {section.title}
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {section.fields.map((field) => (
                    <TextInput
                      key={field.key}
                      label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                      type="number"
                      step="any"
                      value={form[field.key] ?? ''}
                      onChange={(e) => updateFormField(field.key, e.target.value)}
                    />
                  ))}
                </SimpleGrid>
              </Stack>
            ))}

            <Stack gap="xs">
              <Text fw={700} size="sm" c="blue.6" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 }}>
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
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={!form.fecha}
          >
            Guardar medición
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
