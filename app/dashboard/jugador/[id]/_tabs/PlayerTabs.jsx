'use client';

import { Box, Tabs } from '@mantine/core';
import { IconChartBar, IconClipboardList, IconSalad } from '@/components/icons3d';
import { useParams, useRouter } from 'next/navigation';
import MetricasTab from './MetricasTab';
import NutricionTab from './NutricionTab';
import ResumenTab from './ResumenTab';
import PlayerSidebar from './PlayerSidebar';
import classes from './PlayerTabs.module.css';
import { PlayerDashboardProvider } from './PlayerDashboardContext';
import PlayerTutorial from '@/components/tutorials/PlayerTutorial';
import GlassDock from '@/components/navigation/GlassDock';

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
    nutricion: ['plan', 'tipos', 'suplementacion', 'menu', 'protocolos'],
  };

  const activeTab = VALID_TABS.includes(normalizedTab) ? normalizedTab : 'resumen';
  const activeSubtab = validSubtabs[activeTab]?.includes(normalizedSubtab)
    ? normalizedSubtab
    : DEFAULT_SUBTABS[activeTab];

  function navigate(nextTab, nextSubtab = DEFAULT_SUBTABS[nextTab]) {
    if (!params?.id) return;
    router.replace(`/dashboard/jugador/${jugador.id}/${nextTab}/${nextSubtab}`, { scroll: false });
  }

  const mobileTabs = [
    { value: 'resumen', label: 'Resumen', icon: IconClipboardList },
    { value: 'nutricion', label: 'Nutrición', icon: IconSalad },
    { value: 'metricas', label: 'Métricas', icon: IconChartBar },
  ];

  const content = children ? children : (
    <Tabs value={activeTab} keepMounted={false}>
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
    </Tabs>
  );

  return (
    <PlayerDashboardProvider user={user}>
      {isPlayer && <PlayerTutorial jugador={jugador} />}

      <Box className={classes.tabs} style={{ width: '100%', minWidth: 0 }}>
        {/* Layout en Escritorio: Sidebar Lateral + Contenido Principal */}
        <Box
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            width: '100%',
            minWidth: 0,
          }}
        >
          {/* Sidebar lateral en escritorio con foto ampliada, equipo y tabs estilo Apple Settings */}
          <Box
            visibleFrom="sm"
            style={{
              width: 240,
              minWidth: 240,
              maxWidth: 240,
              position: 'sticky',
              top: 16,
              alignSelf: 'flex-start',
              zIndex: 40,
            }}
          >
            <PlayerSidebar
              jugador={jugador}
              user={user}
              activeTab={activeTab}
              onTabChange={(val) => navigate(val)}
              readOnly={readOnly}
              isPlayer={isPlayer}
            />
          </Box>

          {/* Área de Contenido Principal a la derecha (subtabs pegadas al nav y extendidas) */}
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {content}
          </Box>
        </Box>

        {/* Barra de navegación inferior en móvil: dock flotante de cristal */}
        <GlassDock
          ariaLabel="Secciones del jugador"
          layoutId="player-nav-glass"
          active={activeTab}
          items={mobileTabs.map(({ value, label, icon: Icon }) => ({
            value,
            label,
            id: `mobile-nav-${value}`,
            icon: <Icon size={activeTab === value ? 22 : 20} />,
            onClick: () => navigate(value),
          }))}
        />
      </Box>
    </PlayerDashboardProvider>
  );
}
