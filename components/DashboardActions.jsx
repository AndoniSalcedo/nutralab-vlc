'use client';

import { useState } from 'react';
import { Button, Group, Modal } from '@mantine/core';
import { IconPlus, IconCalculator, IconFileSpreadsheet, IconBodyScan } from '@tabler/icons-react';
import PlayerForm from './PlayerForm';
import FoodCalculator from './FoodCalculator';
import ExcelImporter from './ExcelImporter';
import AnthroImporter from './AnthroImporter';

export default function DashboardActions() {
  const [openedModal, setOpenedModal] = useState(null);

  const closeModal = () => setOpenedModal(null);

  return (
    <>
      <Group gap="xs">
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="gray"
          leftSection={<IconCalculator size={14} />}
          onClick={() => setOpenedModal('calculator')}
        >
          Calculadora
        </Button>
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconFileSpreadsheet size={14} />}
          onClick={() => setOpenedModal('excel')}
        >
          Importar Excel
        </Button>
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="orange"
          leftSection={<IconBodyScan size={14} />}
          onClick={() => setOpenedModal('anthro')}
        >
          Antropometría
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
        <PlayerForm initial={null} />
      </Modal>

      <Modal opened={openedModal === 'excel'} onClose={closeModal} title="Importar desde Excel" size="xl">
        <ExcelImporter />
      </Modal>

      <Modal opened={openedModal === 'anthro'} onClose={closeModal} title="Importar Antropometría" size="xl">
        <AnthroImporter />
      </Modal>

      <Modal opened={openedModal === 'calculator'} onClose={closeModal} title="Calculadora Rápida" size="lg">
        <FoodCalculator />
      </Modal>
    </>
  );
}
