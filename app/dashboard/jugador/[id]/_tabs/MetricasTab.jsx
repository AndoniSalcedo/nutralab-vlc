'use client';

import { Box, Paper, SegmentedControl, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import AnaliticasSubtab from './metricas/AnaliticasSubtab';
import MedicionesSubtab from './metricas/MedicionesSubtab';
import HidratacionSubtab from './metricas/HidratacionSubtab';
import ProtocolosSubtab from './metricas/ProtocolosSubtab';

export default function MetricasTab({ jugador, analiticas, evoluciones, registrosHidratacion = [], activeSubtab, onSubtabChange, readOnly = false }) {
  const analiticasVisibles = readOnly ? (analiticas || []).filter(a => a.visible_para_jugador) : (analiticas || []);
  const showAnaliticas = !readOnly || analiticasVisibles.length > 0;

  const allTabs = getSubtabControlData('metricas', tabLabel);
  const tabsData = showAnaliticas ? allTabs : allTabs.filter(t => t.value !== 'analiticas');

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
        <SegmentedControl
          value={activeSubtab}
          onChange={onSubtabChange}
          fullWidth
          radius="xl"
          size="sm"
          bg="gray.1"
          data={tabsData}
          styles={{
            root: { border: 'none', width: '100%' },
            indicator: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
          }}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'mediciones' && (
          <MedicionesSubtab jugador={jugador} evoluciones={evoluciones} readOnly={readOnly} />
        )}
        {activeSubtab === 'analiticas' && showAnaliticas && (
          <AnaliticasSubtab jugador={jugador} analiticas={analiticasVisibles} readOnly={readOnly} />
        )}
        {activeSubtab === 'hidratacion' && (
          <HidratacionSubtab jugador={jugador} registrosHidratacion={registrosHidratacion} readOnly={readOnly} />
        )}
        {activeSubtab === 'protocolos' && (
          <ProtocolosSubtab jugador={jugador} readOnly={readOnly} />
        )}
      </Box>
    </Stack>
  );
}
