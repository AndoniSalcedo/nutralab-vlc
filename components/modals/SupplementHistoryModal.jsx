import React from 'react';
import { Modal, Group, Text, Box, Timeline, Paper } from '@mantine/core';
import { IconHistory, IconBottle, IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';

export default function SupplementHistoryModal({
  opened,
  onClose,
  historyModal,
  catalogsById
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconHistory size={20} style={{ color: 'var(--mantine-color-grape-6)' }} />
          <Text fw={700}>Historial de Suplementación</Text>
        </Group>
      }
      size="md"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Box px="md" py="xs">
        <Text size="sm" mb="lg">
          Historial de fases y catálogos asignados a <strong>{historyModal.player?.nombre} {historyModal.player?.apellidos}</strong>.
        </Text>

        {historyModal.historyEvents.length > 0 ? (
          <Timeline active={0} bulletSize={24} lineWidth={2} color="grape">
            {historyModal.historyEvents.map((event) => {
              const catalog = catalogsById.get(String(event.lista_id));
              return (
                <Timeline.Item
                  key={event.id}
                  bullet={<IconBottle size={12} />}
                  title={catalog ? catalog.nombre : 'Catálogo eliminado'}
                >
                  <Text c="dimmed" size="xs" mt={4}>
                    <IconCalendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    {dayjs(event.created_at).format('DD MMM YYYY, HH:mm')}
                  </Text>
                </Timeline.Item>
              );
            })}
          </Timeline>
        ) : (
          <Paper p="xl" radius="md" bg="gray.0" style={{ textAlign: 'center' }}>
            <IconHistory size={32} style={{ color: 'var(--mantine-color-gray-4)' }} />
            <Text c="dimmed" size="sm" mt="sm">No hay registros en el historial de este jugador.</Text>
          </Paper>
        )}
      </Box>
    </Modal>
  );
}
