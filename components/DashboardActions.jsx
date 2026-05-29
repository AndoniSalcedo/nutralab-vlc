'use client';

import { useState } from 'react';
import { Button, Group, Modal, Tabs } from '@mantine/core';
import { IconPlus, IconFileSpreadsheet, IconBodyScan, IconMail, IconBottle } from '@tabler/icons-react';
import PlayerForm from './PlayerForm';
import ExcelImporter from './ExcelImporter';
import AnthroImporter from './AnthroImporter';
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
        <Tabs defaultValue="players" variant="outline" radius="md" color="dark" keepMounted={false}>
          <Tabs.List grow mb="md">
            <Tabs.Tab value="players" leftSection={<IconFileSpreadsheet size={16} />}>
              Jugadores
            </Tabs.Tab>
            <Tabs.Tab value="anthro" leftSection={<IconBodyScan size={16} />}>
              Antropometría
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="players">
            <ExcelImporter team={team} />
          </Tabs.Panel>

          <Tabs.Panel value="anthro">
            <AnthroImporter team={team} />
          </Tabs.Panel>
        </Tabs>
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
