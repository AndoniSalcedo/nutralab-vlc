import React from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  SimpleGrid,
  TextInput,
  Select,
  Textarea,
  Button
} from '@mantine/core';
import { IconEdit, IconCheck } from '@tabler/icons-react';

export default function EditRecordModal({
  opened,
  onClose,
  editForm,
  setEditForm,
  saveEditedRecord,
  savingEdit
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconEdit size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Editar Registro</Text>
        </Group>
      }
      radius="lg"
      size="md"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <SimpleGrid cols={2} spacing="sm">
          <TextInput label="Fecha" value={editForm.fecha} disabled />
          <TextInput
            label="Hora"
            placeholder="e.g. 9:22 AM"
            value={editForm.hora}
            onChange={(e) => setEditForm(prev => ({ ...prev, hora: e.target.value }))}
          />
          <TextInput
            label="Tipo"
            placeholder="e.g. sosm"
            value={editForm.tipo}
            onChange={(e) => setEditForm(prev => ({ ...prev, tipo: e.target.value }))}
          />
          <TextInput
            label="Valor"
            type="number"
            placeholder="e.g. 60"
            value={editForm.valor}
            onChange={(e) => setEditForm(prev => ({ ...prev, valor: e.target.value }))}
          />
          <TextInput
            label="Unidad"
            placeholder="e.g. mOsm"
            value={editForm.unidad}
            onChange={(e) => setEditForm(prev => ({ ...prev, unidad: e.target.value }))}
          />
          <Select
            label="Estado"
            value={editForm.estado}
            onChange={(val) => setEditForm(prev => ({ ...prev, estado: val }))}
            data={String(editForm.tipo || '').toLowerCase() === 'sweat'
              ? [
                { value: 'Low Sodium', label: 'Sodio Bajo (Low)' },
                { value: 'Moderate Sodium', label: 'Sodio Moderado (Moderate)' },
                { value: 'High Sodium', label: 'Sodio Alto (High)' },
              ]
              : [
                { value: 'Hydrated', label: 'Hidratado (Hydrated)' },
                { value: 'Mildly Dehydrated', label: 'Deshidratación Leve (Mildly)' },
                { value: 'Moderately Dehydrated', label: 'Deshidratación Moderada (Moderately)' },
                { value: 'Severely Dehydrated', label: 'Deshidratación Severa (Severely)' },
              ]}
          />
        </SimpleGrid>

        <Textarea
          label="Notas"
          value={editForm.notas}
          onChange={(e) => setEditForm(prev => ({ ...prev, notas: e.target.value }))}
          minRows={2}
        />
        <Textarea
          label="Cuestionario"
          value={editForm.cuestionario}
          onChange={(e) => setEditForm(prev => ({ ...prev, cuestionario: e.target.value }))}
          minRows={2}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="light" color="gray" radius="xl" size="xs" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="blue" radius="xl" size="xs" leftSection={<IconCheck size={16} />} onClick={saveEditedRecord} loading={savingEdit}>
            Guardar Cambios
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
