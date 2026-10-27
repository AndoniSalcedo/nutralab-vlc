import React from 'react';
import { Stack, TextInput, Paper, Button, Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import TypePlanRowsEditor, { isValidTypeRows } from '@/components/plan/TypePlanRowsEditor';
import ResponsiveModal from './ResponsiveModal';
import ModalFooter from './ModalFooter';

export default function CreateTypesPlanModal({
  opened,
  onClose,
  modalNombre,
  setModalNombre,
  typeRows,
  setTypeRows,
  dayTypeOptions,
  createEmptyPlan,
  generatePlanFromModal,
  actionType,
}) {
  const canSubmit = Boolean(modalNombre.trim()) && isValidTypeRows(typeRows);

  return (
    <ResponsiveModal
      // Formulario de captura: un clic fuera no debe descartar lo escrito
      closeOnClickOutside={false}
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="brain" size={26} />
          <Text fw={700}>Crear plan por tipos de día</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <TextInput
          label="Nombre del plan"
          placeholder="Ej: Opciones de pretemporada"
          value={modalNombre}
          onChange={(e) => setModalNombre(e.target.value)}
          required
        />

        <Paper p="sm" radius="md" withBorder bg="gray.0">
          <TypePlanRowsEditor rows={typeRows} onChange={setTypeRows} dayTypeOptions={dayTypeOptions} />
        </Paper>

        <ModalFooter>
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="light" color="blue" onClick={createEmptyPlan} disabled={!canSubmit}>
            Crear vacío (Manual)
          </Button>
          <Button
            leftSection={<Icon3D name="sparkles" size={20} />}
            onClick={generatePlanFromModal}
            disabled={!canSubmit || actionType === 'generate'}
            loading={actionType === 'generate'}
          >
            Generar Plan
          </Button>
        </ModalFooter>
      </Stack>
    </ResponsiveModal>
  );
}
