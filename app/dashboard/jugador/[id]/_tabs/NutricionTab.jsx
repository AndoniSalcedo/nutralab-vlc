'use client';

import { Paper, SegmentedControl, Stack } from '@mantine/core';
import { IconBottle, IconBrain, IconClipboardList, IconDroplet } from '@tabler/icons-react';
import { tabLabel } from './tab-label';
import HidratacionSubtab from './nutricion/HidratacionSubtab';
import PlanSubtab from './nutricion/PlanSubtab';
import ProtocolosSubtab from './nutricion/ProtocolosSubtab';
import SuplementacionSubtab from './nutricion/SuplementacionSubtab';

export default function NutricionTab({ jugador, activeSubtab, onSubtabChange, readOnly = false }) {
  return (
    <Stack gap="lg">
      <Paper p="xs" radius="xl" withBorder bg="white" shadow="xs">
        <SegmentedControl
          value={activeSubtab}
          onChange={onSubtabChange}
          fullWidth
          radius="xl"
          data={[
            { value: 'plan', label: tabLabel(IconBrain, 'Plan IA') },
            { value: 'hidratacion', label: tabLabel(IconDroplet, 'Hidratación') },
            { value: 'suplementacion', label: tabLabel(IconBottle, 'Suplementación') },
            { value: 'protocolos', label: tabLabel(IconClipboardList, 'Protocolos') },
          ]}
        />
      </Paper>

      {activeSubtab === 'plan' && <PlanSubtab jugador={jugador} readOnly={readOnly} />}
      {activeSubtab === 'hidratacion' && <HidratacionSubtab jugador={jugador} readOnly={readOnly} />}
      {activeSubtab === 'suplementacion' && <SuplementacionSubtab jugador={jugador} readOnly={readOnly} />}
      {activeSubtab === 'protocolos' && <ProtocolosSubtab jugador={jugador} readOnly={readOnly} />}
    </Stack>
  );
}
