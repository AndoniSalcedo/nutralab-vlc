import React from 'react';
import { Modal, Stack, TextInput, Select, Button, Switch } from '@mantine/core';

export default function DayTypeModal({
  opened,
  onClose,
  editingDayType,
  setEditingDayType,
  COLORS,
  handleSaveDayType
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingDayType?.key ? 'Editar Tipo de Día' : 'Nuevo Tipo de Día'}
      radius="md"
      size="sm"
    >
      {editingDayType && (
        <Stack>
          <TextInput
            label="Nombre del Tipo de Día"
            placeholder="Ej: Día de partido"
            value={editingDayType.label}
            onChange={(e) => {
              const val = e.target.value;
              setEditingDayType({
                ...editingDayType,
                label: val,
                planLabel: val.toLowerCase().startsWith('día') || val.toLowerCase().startsWith('dia') ? val : `Día ${val.toLowerCase()}`
              });
            }}
            radius="md"
          />
          <Select
            label="Color"
            data={COLORS.map((c) => ({ value: c, label: c }))}
            value={editingDayType.color}
            onChange={(v) => setEditingDayType({ ...editingDayType, color: v })}
          />
          <Switch
            label="Incluir batido de proteínas (Post-entreno)"
            description="Activa esta ingesta para este tipo de día si el jugador la tiene asignada"
            checked={Boolean(editingDayType.tienePostentreno !== undefined ? editingDayType.tienePostentreno : editingDayType.tienePreentreno)}
            onChange={(e) => setEditingDayType({ 
              ...editingDayType, 
              tienePostentreno: e.currentTarget.checked,
              tienePreentreno: e.currentTarget.checked 
            })}
            mt="xs"
          />
          <Button onClick={handleSaveDayType} fullWidth mt="md" radius="xl" color="blue">
            Guardar Tipo de Día
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
