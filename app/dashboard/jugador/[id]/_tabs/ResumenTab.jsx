'use client';

import { Box, Paper, SegmentedControl, Stack } from '@mantine/core';
import { IconClipboardList, IconUser } from '@tabler/icons-react';
import { tabLabel } from './tab-label';
import FichaSubtab from './resumen/FichaSubtab';
import ObjetivosSubtab from './resumen/ObjetivosSubtab';

export default function ResumenTab({ jugador, activeSubtab, onSubtabChange, readOnly = false }) {
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
            { value: 'ficha', label: tabLabel(IconUser, 'Ficha') },
            { value: 'objetivos', label: tabLabel(IconClipboardList, 'Objetivos') },
          ]}
          styles={{
            root: { border: 'none', width: '100%' },
            indicator: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
          }}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'ficha' && <FichaSubtab jugador={jugador} />}
        {activeSubtab === 'objetivos' && <ObjetivosSubtab jugador={jugador} readOnly={readOnly} />}
      </Box>
    </Stack>
  );
}
