'use client';

import { useState } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { IconPlus, IconFileSpreadsheet, IconMail, IconBottle, IconUserPlus } from '@tabler/icons-react';
import PlayerForm from './PlayerForm';
import PlayerExcelImporter from './PlayerExcelImporter';
import MessageComposer from './MessageComposer';
import SupplementCatalogManager from './SupplementCatalogManager';

export default function DashboardActions({ players = [], team }) {
  const [openedModal, setOpenedModal] = useState(null);

  const closeModal = () => setOpenedModal(null);

  return (
    <>
      <Group gap="xs">
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconFileSpreadsheet size={14} />}
          onClick={() => setOpenedModal('import')}
        >
          Importar datos
        </Button>
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconMail size={14} />}
          onClick={() => setOpenedModal('message')}
        >
          Mensaje
        </Button>
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="grape"
          leftSection={<IconBottle size={14} />}
          onClick={() => setOpenedModal('supplementation')}
        >
          Suplementación
        </Button>
        <Button
          radius="xl"
          size="xs"
          variant="filled"
          color="blue"
          leftSection={<IconPlus size={14} />}
          onClick={() => setOpenedModal('new-player')}
        >
          Nuevo jugador
        </Button>
      </Group>

      <Modal
        opened={openedModal === 'new-player'}
        onClose={closeModal}
        title={
          <Group gap="xs">
            <IconUserPlus size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Añadir jugador</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <PlayerForm initial={null} team={team} />
      </Modal>

      <Modal
        opened={openedModal === 'import'}
        onClose={closeModal}
        title={
          <Group gap="xs">
            <IconFileSpreadsheet size={20} style={{ color: 'var(--mantine-color-teal-6)' }} />
            <Text fw={700}>Importar datos</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <PlayerExcelImporter team={team} />
      </Modal>

      <Modal
        opened={openedModal === 'message'}
        onClose={closeModal}
        title={
          <Group gap="xs">
            <IconMail size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Enviar mensaje</Text>
          </Group>
        }
        size="lg"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <MessageComposer players={players} team={team} onSent={closeModal} />
      </Modal>

      <Modal
        opened={openedModal === 'supplementation'}
        onClose={closeModal}
        title={
          <Group gap="xs">
            <IconBottle size={20} style={{ color: 'var(--mantine-color-grape-6)' }} />
            <Text fw={700}>Gestión de suplementación</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
        closeOnClickOutside={false}
        closeOnEscape={false}
        trapFocus={false}
      >
        <SupplementCatalogManager players={players} team={team} />
      </Modal>
    </>
  );
}
