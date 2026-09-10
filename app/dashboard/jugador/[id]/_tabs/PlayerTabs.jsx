'use client';

import { Box, Group, Tabs, Text, rem } from '@mantine/core';
import { IconChartBar, IconClipboardList, IconSalad } from '@/components/icons3d';
import { useParams, useRouter } from 'next/navigation';
import MetricasTab from './MetricasTab';
import NutricionTab from './NutricionTab';
import ResumenTab from './ResumenTab';
import classes from './PlayerTabs.module.css';
import { PlayerDashboardProvider } from './PlayerDashboardContext';
import PlayerTutorial from '@/components/tutorials/PlayerTutorial';

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
  pesajes = [],
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
    metricas: isPlayer
      ? ['mediciones', 'pesos', 'hidratacion']
      : ['mediciones', 'pesos', 'analiticas', 'hidratacion'],
    nutricion: ['plan', 'suplementacion', 'menu', 'protocolos'],
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
    { value: 'resumen', label: 'Resumen', icon: IconClipboardList },
    { value: 'nutricion', label: 'Nutrición', icon: IconSalad },
    { value: 'metricas', label: 'Métricas', icon: IconChartBar },
  ];

  return (
    <PlayerDashboardProvider user={user}>
      {isPlayer && <PlayerTutorial jugador={jugador} />}
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
          <Tabs.Tab id="tab-nav-resumen" value="resumen" leftSection={<IconClipboardList size={18} />} style={activeTabStyle('resumen')}>Resumen</Tabs.Tab>
          <Tabs.Tab id="tab-nav-metricas" value="metricas" leftSection={<IconChartBar size={18} />} style={activeTabStyle('metricas')}>Métricas</Tabs.Tab>
          <Tabs.Tab id="tab-nav-nutricion" value="nutricion" leftSection={<IconSalad size={18} />} style={activeTabStyle('nutricion')}>Nutrición</Tabs.Tab>
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
                  pesajes={pesajes}
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

        {/* BARRA DE NAVEGACIÓN INFERIOR FIJA PARA MÓVILES (Idéntica en tamaño y diseño a la del equipo) */}
        <Box
          hiddenFrom="sm"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 300,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(222, 226, 230, 0.85)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 2px)',
          }}
        >
          <Group justify="space-around" align="center" gap={0} wrap="nowrap" h={58} px={4}>
            {mobileTabs.map(({ value, label, icon: Icon }) => {
              const isActive = activeTab === value;
              return (
                <Box
                  key={value}
                  id={`mobile-nav-${value}`}
                  component="button"
                  onClick={() => navigate(value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    height: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: isActive ? '#1c1f1a' : 'var(--mantine-color-gray-6)',
                    position: 'relative',
                    paddingTop: 4,
                    transition: 'color 140ms ease, transform 100ms ease',
                  }}
                >
                  {isActive && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: 3,
                        width: 20,
                        height: 3,
                        borderRadius: 3,
                        backgroundColor: '#24291f',
                      }}
                    />
                  )}
                  <Icon
                    size={isActive ? 22 : 20}
                    style={{
                      opacity: isActive ? 1 : 0.75,
                      transform: isActive ? 'scale(1.04)' : 'scale(1)',
                      transition: 'transform 160ms ease, opacity 160ms ease',
                      marginBottom: 2,
                    }}
                  />
                  <Text
                    fz={10}
                    fw={isActive ? 750 : 500}
                    lh={1.2}
                    mt={3}
                    c={isActive ? '#1c1f1a' : 'dimmed'}
                    style={{
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {label}
                  </Text>
                </Box>
              );
            })}
          </Group>
        </Box>
      </Tabs>
    </PlayerDashboardProvider>
  );
}
