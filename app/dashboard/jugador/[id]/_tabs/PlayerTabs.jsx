'use client';

import { Box, Tabs, rem } from '@mantine/core';
import { IconChartBar, IconInfoCircle, IconSalad } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import MetricasTab from './MetricasTab';
import NutricionTab from './NutricionTab';
import ResumenTab from './ResumenTab';

const DEFAULT_SUBTABS = {
  resumen: 'ficha',
  metricas: 'mediciones',
  nutricion: 'plan',
};

const VALID_TABS = Object.keys(DEFAULT_SUBTABS);
const VALID_SUBTABS = {
  resumen: ['ficha', 'objetivos'],
  metricas: ['mediciones', 'analiticas'],
  nutricion: ['plan', 'hidratacion', 'suplementacion', 'protocolos'],
};

export default function PlayerTabs({
  jugador,
  analiticas = [],
  evoluciones = [],
  activeTab: activeTabProp = 'resumen',
  activeSubtab: activeSubtabProp,
  readOnly = false,
}) {
  const router = useRouter();

  const activeTab = VALID_TABS.includes(activeTabProp) ? activeTabProp : 'resumen';
  const activeSubtab = VALID_SUBTABS[activeTab].includes(activeSubtabProp)
    ? activeSubtabProp
    : DEFAULT_SUBTABS[activeTab];

  function navigate(nextTab, nextSubtab = DEFAULT_SUBTABS[nextTab]) {
    router.replace(`/dashboard/jugador/${jugador.id}/${nextTab}/${nextSubtab}`, { scroll: false });
  }

  const activeTabStyle = (value) => ({
    backgroundColor: activeTab === value ? 'var(--mantine-color-white)' : 'transparent',
  });

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => value && navigate(value)}
      variant="outline"
      radius="md"
      color="dark"
      keepMounted={false}
      styles={{
        list: { backgroundColor: 'transparent', borderBottomColor: 'var(--mantine-color-gray-3)' },
        tab: {
          fontSize: rem(15),
          fontWeight: 600,
          padding: `${rem(10)} ${rem(16)}`,
        },
      }}
    >
      <Tabs.List grow>
        <Tabs.Tab value="resumen" leftSection={<IconInfoCircle size={18} />} style={activeTabStyle('resumen')}>Resumen</Tabs.Tab>
        <Tabs.Tab value="metricas" leftSection={<IconChartBar size={18} />} style={activeTabStyle('metricas')}>Métricas</Tabs.Tab>
        <Tabs.Tab value="nutricion" leftSection={<IconSalad size={18} />} style={activeTabStyle('nutricion')}>Nutrición</Tabs.Tab>
      </Tabs.List>

      <Box>
        <Tabs.Panel value="resumen">
          <ResumenTab
            jugador={jugador}
            activeSubtab={activeTab === 'resumen' ? activeSubtab : DEFAULT_SUBTABS.resumen}
            onSubtabChange={(value) => navigate('resumen', value)}
            readOnly={readOnly}
          />
        </Tabs.Panel>

        <Tabs.Panel value="metricas">
          <MetricasTab
            jugador={jugador}
            analiticas={analiticas}
            evoluciones={evoluciones}
            activeSubtab={activeTab === 'metricas' ? activeSubtab : DEFAULT_SUBTABS.metricas}
            onSubtabChange={(value) => navigate('metricas', value)}
            readOnly={readOnly}
          />
        </Tabs.Panel>

        <Tabs.Panel value="nutricion">
          <NutricionTab
            jugador={jugador}
            activeSubtab={activeTab === 'nutricion' ? activeSubtab : DEFAULT_SUBTABS.nutricion}
            onSubtabChange={(value) => navigate('nutricion', value)}
            readOnly={readOnly}
          />
        </Tabs.Panel>
      </Box>
    </Tabs>
  );
}
