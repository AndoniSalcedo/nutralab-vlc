import React from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Button
} from '@mantine/core';
import { IconRuler2, IconEdit, IconCheck } from '@tabler/icons-react';

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
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput label="Fecha" type="date" value={form.fecha} onChange={(e) => updateFormField('fecha', e.target.value)} />
          <TextInput label="Altura (cm)" type="number" value={form.altura_cm} onChange={(e) => updateFormField('altura_cm', e.target.value)} />
          <TextInput label="Peso (kg)" type="number" value={form.peso_kg} onChange={(e) => updateFormField('peso_kg', e.target.value)} />
          <TextInput label="% Grasa" type="number" value={form.porcentaje_grasa} onChange={(e) => updateFormField('porcentaje_grasa', e.target.value)} />
          <TextInput label="Masa magra (kg)" type="number" value={form.masa_magra_kg} onChange={(e) => updateFormField('masa_magra_kg', e.target.value)} />
          <TextInput label="Σ6 pliegues (mm)" type="number" value={form.suma_6_pliegues} onChange={(e) => updateFormField('suma_6_pliegues', e.target.value)} />
        </SimpleGrid>

        <Textarea label="Notas" value={form.notas} onChange={(e) => updateFormField('notas', e.target.value)} minRows={2} />

        <Group justify="flex-end">
          <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="xs" radius="xl" leftSection={<IconCheck size={16} />} onClick={handleSave} loading={saving} disabled={!form.fecha}>
            Guardar medición
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
