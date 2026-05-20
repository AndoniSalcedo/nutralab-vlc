'use client';

import { Paper, SegmentedControl, Stack } from '@mantine/core';
import { IconChartLine, IconReportAnalytics } from '@tabler/icons-react';
import { tabLabel } from './tab-label';
import AnaliticasSubtab from './metricas/AnaliticasSubtab';
import MedicionesSubtab from './metricas/MedicionesSubtab';

export default function MetricasTab({ jugador, analiticas, evoluciones, activeSubtab, onSubtabChange, readOnly = false }) {
  return (
    <Stack gap="lg">
      <Paper p="xs" radius="xl" withBorder bg="white" shadow="xs">
        <SegmentedControl
          value={activeSubtab}
          onChange={onSubtabChange}
          fullWidth
          radius="xl"
          data={[
            { value: 'mediciones', label: tabLabel(IconChartLine, 'Mediciones') },
            { value: 'analiticas', label: tabLabel(IconReportAnalytics, 'Analíticas') },
          ]}
        />
      </Paper>

      {activeSubtab === 'mediciones' && (
        <MedicionesSubtab jugador={jugador} evoluciones={evoluciones} readOnly={readOnly} />
      )}
      {activeSubtab === 'analiticas' && (
        <AnaliticasSubtab jugador={jugador} analiticas={analiticas} readOnly={readOnly} />
      )}
    </Stack>
  );
}
