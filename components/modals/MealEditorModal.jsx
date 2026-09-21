import React from 'react';
import { Text } from '@mantine/core';
import MealForm from '@/components/forms/MealForm';
import ResponsiveModal from './ResponsiveModal';

export default function MealEditorModal({
  opened,
  onClose,
  jugadorId,
  meal,
  onSuccess,
  onCancel,
}) {
  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      title={<Text fw={700}>{meal ? 'Editar Comida' : 'Registrar Comida'}</Text>}
      radius="lg"
      padding="lg"
    >
      <MealForm
        jugadorId={jugadorId}
        meal={meal}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </ResponsiveModal>
  );
}
