'use client';

import { Box, Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';

import PesosSubtab from './metricas/PesosSubtab';
import AnaliticasSubtab from './metricas/AnaliticasSubtab';
import MedicionesSubtab from './metricas/MedicionesSubtab';
import HidratacionSubtab from './metricas/HidratacionSubtab';

export default function MetricasTab({ jugador, analiticas, evoluciones, pesajes, registrosHidratacion = [], activeSubtab, onSubtabChange, readOnly = false }) {
  const analiticasVisibles = readOnly ? (analiticas || []).filter(a => a.visible_para_jugador) : (analiticas || []);

  const tabsData = getSubtabControlData('metricas', tabLabel);

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
          data={tabsData}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'pesos' && (
          <PesosSubtab jugador={jugador} pesajes={pesajes} readOnly={readOnly} />
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
      </Box>
    </Stack>
  );
}
