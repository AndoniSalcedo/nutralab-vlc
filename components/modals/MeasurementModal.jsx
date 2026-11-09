import React from 'react';
import {
  Box,
  Group,
  Text,
  Stack,
  Button,
  ScrollArea,
  Divider
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import Icon3D from '@/components/Icon3D';
import MeasurementFields from '@/components/measurements/MeasurementFields';
import ResponsiveModal from './ResponsiveModal';

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

        <ScrollArea.Autosize mah="50vh" offsetScrollbars>
          <Box pr="xs">
            <MeasurementFields
              form={form}
              updateFormField={updateFormField}
              previous={previous}
              onFillFromPrevious={onFillFromPrevious}
              disabled={saving}
            />
          </Box>
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
