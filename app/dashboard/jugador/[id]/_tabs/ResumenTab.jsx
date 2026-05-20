'use client';

import { Paper, SegmentedControl, Stack } from '@mantine/core';
import { IconCalculator, IconClipboardList, IconUser } from '@tabler/icons-react';
import { tabLabel } from './tab-label';
import FichaSubtab from './resumen/FichaSubtab';
import HerramientasSubtab from './resumen/HerramientasSubtab';
import ObjetivosSubtab from './resumen/ObjetivosSubtab';

export default function ResumenTab({ jugador, activeSubtab, onSubtabChange, readOnly = false }) {
  return (
    <Stack gap="lg">
      <Paper p="xs" radius="xl" withBorder bg="white" shadow="xs">
        <SegmentedControl
          value={activeSubtab}
          onChange={onSubtabChange}
          fullWidth
          radius="xl"
          data={[
            { value: 'ficha', label: tabLabel(IconUser, 'Ficha') },
            { value: 'objetivos', label: tabLabel(IconClipboardList, 'Objetivos') },
            { value: 'herramientas', label: tabLabel(IconCalculator, 'Herramientas') },
          ]}
        />
      </Paper>

      {activeSubtab === 'ficha' && <FichaSubtab jugador={jugador} />}
      {activeSubtab === 'objetivos' && <ObjetivosSubtab jugador={jugador} readOnly={readOnly} />}
      {activeSubtab === 'herramientas' && <HerramientasSubtab jugador={jugador} />}
    </Stack>
  );
}
