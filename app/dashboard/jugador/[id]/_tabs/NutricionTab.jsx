'use client';

import { motion } from 'motion/react';
import { Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';
import headerClasses from './SubtabSectionHeader.module.css';
import PlanSubtab from './nutricion/PlanSubtab';
import SuplementacionSubtab from './nutricion/SuplementacionSubtab';
import MenuSemanalSubtab from './nutricion/MenuSemanalSubtab';
import ProtocolosSubtab from './nutricion/ProtocolosSubtab';
import { PLAN_MODES } from '@/config/plan-modes';

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

      {/* Cambio de subpestaña con un fundido corto (antes cambiaba de golpe) */}
      <motion.div
        key={activeSubtab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeSubtab === 'plan' && <PlanSubtab jugador={jugador} readOnly={readOnly} modo={PLAN_MODES.SEMANA} />}
        {activeSubtab === 'tipos' && <PlanSubtab jugador={jugador} readOnly={readOnly} modo={PLAN_MODES.TIPOS} />}
        {activeSubtab === 'suplementacion' && <SuplementacionSubtab jugador={jugador} readOnly={readOnly} />}
        {activeSubtab === 'menu' && <MenuSemanalSubtab menus={menus} />}
        {activeSubtab === 'protocolos' && <ProtocolosSubtab jugador={jugador} readOnly={readOnly} />}
      </motion.div>
    </Stack>
  );
}
