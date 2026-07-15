import React from 'react';
import { Modal, Stack, TextInput, Select, Button } from '@mantine/core';

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
    >
      {editingDayType && (
        <Stack>
          <TextInput
            label="Nombre del Tipo de Día"
            value={editingDayType.label}
            onChange={(e) => {
              const val = e.target.value;
              setEditingDayType({
                ...editingDayType,
                label: val,
                planLabel: val.toLowerCase().startsWith('día') || val.toLowerCase().startsWith('dia') ? val : `Día ${val.toLowerCase()}`
              });
            }}
          />
          <Select
            label="Color"
            data={COLORS.map((c) => ({ value: c, label: c }))}
            value={editingDayType.color}
            onChange={(v) => setEditingDayType({ ...editingDayType, color: v })}
          />
          <Button onClick={handleSaveDayType} fullWidth mt="md">
            Aceptar
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
