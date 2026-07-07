'use client';

import { useState } from 'react';
import { Button, Group, Modal, Text, Tabs } from '@mantine/core';
import { IconPlus, IconFileSpreadsheet, IconMail, IconUserPlus, IconDroplet, IconSettings } from '@tabler/icons-react';
import PlayerForm from './PlayerForm';
import PlayerExcelImporter from './PlayerExcelImporter';
import TeamOsmolarityImporter from './TeamOsmolarityImporter';
import MessageComposer from './MessageComposer';

import Link from 'next/link';

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
        size="1200px"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Tabs defaultValue="metrics" variant="outline" radius="md">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="metrics" leftSection={<IconFileSpreadsheet size={16} />}>
              Métricas (Excel de jugadores)
            </Tabs.Tab>
            <Tabs.Tab value="osmolarity" leftSection={<IconDroplet size={16} />}>
              Osmolaridad (CSV de equipo)
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="metrics">
            <PlayerExcelImporter team={team} />
          </Tabs.Panel>

          <Tabs.Panel value="osmolarity">
            <TeamOsmolarityImporter team={team} />
          </Tabs.Panel>
        </Tabs>
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
    </>
  );
}
