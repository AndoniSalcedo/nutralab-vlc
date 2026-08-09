'use client';

import { Box, Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';
import PlanSubtab from './nutricion/PlanSubtab';
import SuplementacionSubtab from './nutricion/SuplementacionSubtab';
import MenuSemanalSubtab from './nutricion/MenuSemanalSubtab';
import ProtocolosSubtab from './metricas/ProtocolosSubtab';

export default function NutricionTab({ jugador, menus = [], activeSubtab, onSubtabChange, readOnly = false }) {
  return (
    <Stack gap={0}>
      <Paper
        data-boneyard-ignore="true"
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
        <PlayerSubtabControl
          value={activeSubtab}
          onChange={onSubtabChange}
          data={getSubtabControlData('nutricion', tabLabel)}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'plan' && <PlanSubtab jugador={jugador} readOnly={readOnly} />}
        {activeSubtab === 'suplementacion' && <SuplementacionSubtab jugador={jugador} readOnly={readOnly} />}
        {activeSubtab === 'menu' && <MenuSemanalSubtab menus={menus} />}
        {activeSubtab === 'protocolos' && <ProtocolosSubtab jugador={jugador} readOnly={readOnly} />}
      </Box>
    </Stack>
  );
}
