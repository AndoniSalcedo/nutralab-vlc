'use client';

import { motion } from 'motion/react';
import { Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';
import headerClasses from './SubtabSectionHeader.module.css';

import PesosSubtab from './metricas/PesosSubtab';
import AnaliticasSubtab from './metricas/AnaliticasSubtab';
import MedicionesSubtab from './metricas/MedicionesSubtab';
import HidratacionSubtab from './metricas/HidratacionSubtab';
import IntrapartidoSubtab from './metricas/IntrapartidoSubtab';

export default function MetricasTab({ jugador, analiticas, evoluciones, pesajes, registrosHidratacion = [], historialIntrapartido = [], activeSubtab = 'mediciones', onSubtabChange, readOnly = false }) {
  const analiticasVisibles = readOnly ? (analiticas || []).filter(a => a.visible_para_jugador) : (analiticas || []);

  const tabsData = getSubtabControlData('metricas', tabLabel);

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
          data={tabsData}
        />
      </Paper>

      {/* Cambio de subpestaña con un fundido corto (antes cambiaba de golpe) */}
      <motion.div
        key={activeSubtab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeSubtab === 'pesos' && (
          <PesosSubtab jugador={jugador} pesajes={pesajes} evoluciones={evoluciones} readOnly={readOnly} />
        )}
        {activeSubtab === 'mediciones' && (
          <MedicionesSubtab jugador={jugador} evoluciones={evoluciones} readOnly={readOnly} />
        )}
        {activeSubtab === 'analiticas' && (
          <AnaliticasSubtab jugador={jugador} analiticas={analiticasVisibles} readOnly={readOnly} />
        )}
        {activeSubtab === 'hidratacion' && (
          <HidratacionSubtab jugador={jugador} registrosHidratacion={registrosHidratacion} readOnly={readOnly} />
        )}
        {activeSubtab === 'intrapartido' && (
          <IntrapartidoSubtab jugador={jugador} historialIntrapartido={historialIntrapartido} />
        )}
      </motion.div>
    </Stack>
  );
}
