'use client';

import { Box, Group, Paper, Stack, Tabs, Text, UnstyledButton, rem } from '@mantine/core';
import { IconChartBar, IconInfoCircle, IconSalad } from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import MetricasTab from './MetricasTab';
import NutricionTab from './NutricionTab';
import ResumenTab from './ResumenTab';
import classes from './PlayerTabs.module.css';
import { PlayerDashboardProvider } from './PlayerDashboardContext';

const DEFAULT_SUBTABS = {
  resumen: 'perfil',
  metricas: 'mediciones',
  nutricion: 'plan',
};

const VALID_TABS = Object.keys(DEFAULT_SUBTABS);

export default function PlayerTabs({
  jugador,
  user,
  analiticas = [],
  evoluciones = [],
  registrosHidratacion = [],
  messages = [],
  menus = [],
  activeTab: activeTabProp = 'resumen',
  activeSubtab: activeSubtabProp,
  children,
  isPlayer = false,
  readOnly = false,
}) {
  const router = useRouter();
  const params = useParams();

  const routeTab = params?.tab;
  const routeSubtab = params?.subtab?.[0];

  const activeTabPropFromParams = routeTab || activeTabProp;
  const activeSubtabPropFromParams = routeSubtab || activeSubtabProp;

  const normalizedTab = activeTabPropFromParams === 'general' ? 'resumen' : activeTabPropFromParams;
  const normalizedSubtab = activeSubtabPropFromParams === 'ficha' || activeSubtabPropFromParams === 'objetivos'
    ? 'perfil'
    : activeSubtabPropFromParams;

  const validSubtabs = {
    resumen: ['perfil', 'diario', 'mensajes'],
    metricas: readOnly
      ? ['mediciones', 'hidratacion', 'protocolos']
      : ['mediciones', 'analiticas', 'hidratacion', 'protocolos'],
    nutricion: ['plan', 'suplementacion', 'menu'],
  };

  const activeTab = VALID_TABS.includes(normalizedTab) ? normalizedTab : 'resumen';
  const activeSubtab = validSubtabs[activeTab]?.includes(normalizedSubtab)
    ? normalizedSubtab
    : DEFAULT_SUBTABS[activeTab];

  function navigate(nextTab, nextSubtab = DEFAULT_SUBTABS[nextTab]) {
    if (!params?.id) return;
    router.replace(`/dashboard/jugador/${jugador.id}/${nextTab}/${nextSubtab}`, { scroll: false });
  }

  const activeTabStyle = (value) => ({
    backgroundColor: activeTab === value ? 'var(--mantine-color-white)' : 'transparent',
  });

  const mobileTabs = [
    { value: 'resumen', label: 'Resumen', icon: IconInfoCircle },
    { value: 'nutricion', label: 'Nutrición', icon: IconSalad },
    { value: 'metricas', label: 'Métricas', icon: IconChartBar },
  ];

  return (
    <PlayerDashboardProvider user={user}>
      <Tabs
        className={classes.tabs}
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
        <Tabs.List grow visibleFrom="sm">
          <Tabs.Tab value="resumen" leftSection={<IconInfoCircle size={18} />} style={activeTabStyle('resumen')}>Resumen</Tabs.Tab>
          <Tabs.Tab value="metricas" leftSection={<IconChartBar size={18} />} style={activeTabStyle('metricas')}>Métricas</Tabs.Tab>
          <Tabs.Tab value="nutricion" leftSection={<IconSalad size={18} />} style={activeTabStyle('nutricion')}>Nutrición</Tabs.Tab>
        </Tabs.List>

        <Box>
          {children ? children : (
            <>
              <Tabs.Panel value="resumen">
                <ResumenTab
                  jugador={jugador}
                  evoluciones={evoluciones}
                  messages={messages}
                  activeSubtab={activeTab === 'resumen' ? activeSubtab : DEFAULT_SUBTABS.resumen}
                  onSubtabChange={(value) => navigate('resumen', value)}
                  readOnly={readOnly}
                  isPlayer={isPlayer}
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
            </>
          )}
        </Box>

        <Paper
          hiddenFrom="sm"
          className={classes.mobileDock}
          shadow="md"
          radius={0}
          withBorder
        >
          <Group gap={0} grow preventGrowOverflow={false} className={classes.mobileDockInner}>
            {mobileTabs.map(({ value, label, icon: Icon }) => (
              <UnstyledButton
                key={value}
                onClick={() => navigate(value)}
                className={classes.mobileTab}
                data-active={activeTab === value || undefined}
              >
                <Stack gap={4} align="center">
                  <Icon size={24} stroke={activeTab === value ? 2 : 1.5} />
                  <Text size="xs" fw={activeTab === value ? 700 : 500} lh={1}>
                    {label}
                  </Text>
                </Stack>
              </UnstyledButton>
            ))}
          </Group>
        </Paper>
      </Tabs>
    </PlayerDashboardProvider>
  );
}
