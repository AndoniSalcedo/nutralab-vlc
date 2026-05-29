'use client';

import { Box, Tabs, rem } from '@mantine/core';
import { IconChartBar, IconInfoCircle, IconSalad } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import MetricasTab from './MetricasTab';
import NutricionTab from './NutricionTab';
import ResumenTab from './ResumenTab';

const DEFAULT_SUBTABS = {
  general: 'perfil',
  metricas: 'mediciones',
  nutricion: 'plan',
};

const VALID_TABS = Object.keys(DEFAULT_SUBTABS);

export default function PlayerTabs({
  jugador,
  analiticas = [],
  evoluciones = [],
  registrosHidratacion = [],
  messages = [],
  menus = [],
  informes = [],
  activeTab: activeTabProp = 'general',
  activeSubtab: activeSubtabProp,
  readOnly = false,
}) {
  const router = useRouter();

  const normalizedTab = activeTabProp === 'resumen' ? 'general' : activeTabProp;
  const normalizedSubtab = activeSubtabProp === 'ficha' || activeSubtabProp === 'objetivos'
    ? 'perfil'
    : activeSubtabProp;
  const validSubtabs = {
    general: ['perfil', 'mensajes'],
    metricas: readOnly 
      ? ['mediciones', 'hidratacion', 'protocolos'] 
      : ['mediciones', 'analiticas', 'hidratacion', 'protocolos'],
    nutricion: ['plan', 'suplementacion', 'menu'],
  };

  const activeTab = VALID_TABS.includes(normalizedTab) ? normalizedTab : 'general';
  const activeSubtab = validSubtabs[activeTab].includes(normalizedSubtab)
    ? normalizedSubtab
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
        <Tabs.Tab value="general" leftSection={<IconInfoCircle size={18} />} style={activeTabStyle('general')}>General</Tabs.Tab>
        <Tabs.Tab value="metricas" leftSection={<IconChartBar size={18} />} style={activeTabStyle('metricas')}>Métricas</Tabs.Tab>
        <Tabs.Tab value="nutricion" leftSection={<IconSalad size={18} />} style={activeTabStyle('nutricion')}>Nutrición</Tabs.Tab>
      </Tabs.List>

      <Box>
        <Tabs.Panel value="general">
          <ResumenTab
            jugador={jugador}
            evoluciones={evoluciones}
            messages={messages}
            informes={informes}
            activeSubtab={activeTab === 'general' ? activeSubtab : DEFAULT_SUBTABS.general}
            onSubtabChange={(value) => navigate('general', value)}
            readOnly={readOnly}
          />
        </Tabs.Panel>

        <Tabs.Panel value="metricas">
          <MetricasTab
            jugador={jugador}
            analiticas={analiticas}
            evoluciones={evoluciones}
            registrosHidratacion={registrosHidratacion}
            activeSubtab={activeTab === 'metricas' ? activeSubtab : DEFAULT_SUBTABS.metricas}
            onSubtabChange={(value) => navigate('metricas', value)}
            readOnly={readOnly}
          />
        </Tabs.Panel>

        <Tabs.Panel value="nutricion">
          <NutricionTab
            jugador={jugador}
            menus={menus}
            activeSubtab={activeTab === 'nutricion' ? activeSubtab : DEFAULT_SUBTABS.nutricion}
            onSubtabChange={(value) => navigate('nutricion', value)}
            readOnly={readOnly}
          />
        </Tabs.Panel>
      </Box>
    </Tabs>
  );
}
