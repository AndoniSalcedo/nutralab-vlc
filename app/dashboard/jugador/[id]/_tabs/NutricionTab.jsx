'use client';

import { Box, Paper, SegmentedControl, Stack } from '@mantine/core';
import { IconBottle, IconBrain, IconChefHat } from '@tabler/icons-react';
import { tabLabel } from './tab-label';
import PlanSubtab from './nutricion/PlanSubtab';
import SuplementacionSubtab from './nutricion/SuplementacionSubtab';
import MenuSemanal from '@/components/MenuSemanal';

export default function NutricionTab({ jugador, menus = [], activeSubtab, onSubtabChange, readOnly = false }) {
  return (
    <Stack gap={0}>
      <Paper
        p="xs"
        bg="white"
        radius={0}
        style={{
          zIndex: 99,
          position: 'sticky',
          top: 0,
          clipPath: 'inset(0 -100% 0 -100%)',
          width: '100%',
          borderBottom: 0,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          borderRight: '1px solid var(--mantine-color-gray-3)',
          boxShadow: 'none',
        }}
      >
        <SegmentedControl
          value={activeSubtab}
          onChange={onSubtabChange}
          fullWidth
          radius="xl"
          size="sm"
          bg="gray.1"
          data={[
            { value: 'plan', label: tabLabel(IconBrain, 'Plan nutricional', 'Plan') },
            { value: 'suplementacion', label: tabLabel(IconBottle, 'Suplementación', 'Supl.') },
            { value: 'menu', label: tabLabel(IconChefHat, 'Menú comedor', 'Menú') },
          ]}
          styles={{
            root: { border: 'none', width: '100%' },
            indicator: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
          }}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'plan' && <PlanSubtab jugador={jugador} readOnly={readOnly} />}
        {activeSubtab === 'suplementacion' && <SuplementacionSubtab jugador={jugador} readOnly={readOnly} />}
        {activeSubtab === 'menu' && <MenuSemanal menusIniciales={menus} isSubtab={true} readOnly={readOnly} />}
      </Box>
    </Stack>
  );
}
