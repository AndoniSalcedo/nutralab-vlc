'use client';

import { useState } from 'react';
import { Button, Group, Modal } from '@mantine/core';
import { IconPlus, IconFileSpreadsheet, IconMail, IconBottle } from '@tabler/icons-react';
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

      <Modal opened={openedModal === 'new-player'} onClose={closeModal} title="Añadir jugador" size="xl">
        <PlayerForm initial={null} team={team} />
      </Modal>

      <Modal opened={openedModal === 'import'} onClose={closeModal} title="Importar datos" size="xl">
        <PlayerExcelImporter team={team} />
      </Modal>

      <Modal opened={openedModal === 'message'} onClose={closeModal} title="Enviar mensaje" size="lg">
        <MessageComposer players={players} team={team} onSent={closeModal} />
      </Modal>

      <Modal
        opened={openedModal === 'supplementation'}
        onClose={closeModal}
        title="Gestión de suplementación"
        size="xl"
        closeOnClickOutside={false}
        closeOnEscape={false}
        trapFocus={false}
      >
        <SupplementCatalogManager players={players} team={team} />
      </Modal>
    </>
  );
}
