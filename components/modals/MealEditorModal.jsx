import React from 'react';
import { Modal, Text } from '@mantine/core';
import MealForm from '@/app/dashboard/jugador/[id]/_tabs/nutricion/MealForm';

export default function MealEditorModal({
  opened,
  onClose,
  jugadorId,
  meal,
  onSuccess,
  onCancel
}) {
  return (
    <Modal
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
    </Modal>
  );
}
