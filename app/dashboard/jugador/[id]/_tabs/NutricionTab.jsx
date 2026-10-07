'use client';

import { Box, Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';
import headerClasses from './SubtabSectionHeader.module.css';
import PlanSubtab from './nutricion/PlanSubtab';
import SuplementacionSubtab from './nutricion/SuplementacionSubtab';
import MenuSemanalSubtab from './nutricion/MenuSemanalSubtab';
import ProtocolosSubtab from './nutricion/ProtocolosSubtab';

export default function NutricionTab({ jugador, menus = [], activeSubtab = 'plan', onSubtabChange, readOnly = false }) {
  return (
    <Stack gap={0}>
      <Paper
        p="xs"
        bg="white"
        className={headerClasses.subtabsHeader}
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
