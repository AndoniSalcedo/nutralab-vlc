'use client';

import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { IconPlus, IconFileSpreadsheet, IconMail, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';

import NewPlayerModal from '@/components/modals/NewPlayerModal';
import ImportDataModal from '@/components/modals/ImportDataModal';
import SendMessageModal from '@/components/modals/SendMessageModal';

export default function DashboardActions({ players = [], team }) {
  const [openedModal, setOpenedModal] = useState(null);

  const closeModal = () => setOpenedModal(null);

  return (
    <>
      <Group gap="xs">
        {team?.id && (
          <Button
            component={Link}
            href={`/dashboard/equipo/${team.id}/configuracion`}
            radius="xl"
            size="xs"
            variant="light"
            color="gray"
            leftSection={<IconSettings size={14} />}
          >
            Configuración
          </Button>
        )}

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
          variant="filled"
          color="blue"
          leftSection={<IconPlus size={14} />}
          onClick={() => setOpenedModal('new-player')}
        >
          Nuevo jugador
        </Button>
      </Group>

      <NewPlayerModal
        opened={openedModal === 'new-player'}
        onClose={closeModal}
        team={team}
      />

      <ImportDataModal
        opened={openedModal === 'import'}
        onClose={closeModal}
        team={team}
      />

      <SendMessageModal
        opened={openedModal === 'message'}
        onClose={closeModal}
        players={players}
        team={team}
        onSent={closeModal}
      />
    </>
  );
}
