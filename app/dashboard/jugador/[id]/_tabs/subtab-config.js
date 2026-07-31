import { IconUser, IconCalendar, IconMail } from '@tabler/icons-react';
import { IconChartLine, IconReportAnalytics, IconDroplet, IconClipboardList } from '@tabler/icons-react';
import { IconBrain, IconBottle, IconChefHat } from '@tabler/icons-react';
import { IconRuler2, IconReportMedical } from '@tabler/icons-react';

/**
 * Single source of truth for all player dashboard subtab configs.
 * Used by the real subtab components, the loading skeleton,
 * and the tab selectors — so everything stays in sync.
 *
 * IMPORTANT: if you change any title, subtitle, icon or color here,
 * it will be reflected everywhere automatically.
 */

export const SUBTAB_CONFIGS = {
  resumen: {
    defaultSubtab: 'perfil',
    tabs: [
      { value: 'perfil', icon: IconUser, label: 'Perfil', mobileLabel: 'Perfil' },
      { value: 'diario', icon: IconCalendar, label: 'Diario de comidas', mobileLabel: 'Diario' },
      { value: 'mensajes', icon: IconMail, label: 'Mensajes', mobileLabel: 'Mensajes' },
    ],
    headers: {
      perfil: {
        icon: IconUser,
        iconColor: 'blue',
        title: 'Perfil del jugador',
        subtitle: 'Objetivos, preferencias y ajustes individuales.',
        subtitleReadOnly: 'Objetivos y pautas semanales.',
      },
      diario: {
        icon: IconCalendar,
        iconColor: 'blue',
        title: 'Diario de Comidas',
        subtitle: 'Registro diario de ingestas.',
      },
      mensajes: {
        icon: IconMail,
        iconColor: 'blue',
        title: 'Mensajes',
        subtitle: 'Comunicaciones hacia el jugador.',
      },
    },
  },
  metricas: {
    defaultSubtab: 'mediciones',
    tabs: [
      { value: 'mediciones', icon: IconChartLine, label: 'Mediciones', mobileLabel: 'Med.' },
      { value: 'analiticas', icon: IconReportAnalytics, label: 'Analíticas', mobileLabel: 'Anali.' },
      { value: 'hidratacion', icon: IconDroplet, label: 'Hidratación', mobileLabel: 'Hidra.' },
      { value: 'protocolos', icon: IconClipboardList, label: 'Protocolos', mobileLabel: 'Prot.' },
    ],
    headers: {
      mediciones: {
        icon: IconRuler2,
        iconColor: 'cyan',
        title: 'Composición',
        subtitle: 'Historial de medidas y evolución del jugador.',
      },
      analiticas: {
        icon: IconReportMedical,
        iconColor: 'blue',
        title: 'Analíticas',
        subtitle: 'Documentos clínicos destacados.',
      },
      hidratacion: {
        icon: IconDroplet,
        iconColor: 'blue',
        title: 'Hidratación y sudoración',
        subtitle: 'Análisis de osmolaridad salival y sodio en sudor.',
      },
      protocolos: {
        icon: IconClipboardList,
        iconColor: 'dark',
        title: 'Protocolos',
        subtitle: 'Guía nutricional para distintos protocolos.',
      },
    },
  },
  nutricion: {
    defaultSubtab: 'plan',
    tabs: [
      { value: 'plan', icon: IconBrain, label: 'Plan nutricional', mobileLabel: 'Plan' },
      { value: 'suplementacion', icon: IconBottle, label: 'Suplementación', mobileLabel: 'Supl.' },
      { value: 'menu', icon: IconChefHat, label: 'Menú semanal', mobileLabel: 'Menú' },
    ],
    headers: {
      plan: {
        icon: IconBrain,
        iconColor: 'blue',
        title: 'Planes nutricionales',
        subtitle: 'Fichas con métricas, macros y pautas.',
      },
      suplementacion: {
        icon: IconBottle,
        iconColor: 'grape',
        title: 'Suplementación',
        subtitle: 'Asignación de catálogos de suplementación.',
      },
      menu: {
        icon: IconChefHat,
        iconColor: 'teal',
        title: 'Menú comedor',
        subtitle: 'Comedor del equipo.',
      },
    },
  },
};

/** Helper: get SegmentedControl data array for a tab */
export function getSubtabControlData(tab, tabLabelFn) {
  const config = SUBTAB_CONFIGS[tab];
  if (!config) return [];
  return config.tabs.map((t) => ({
    value: t.value,
    label: tabLabelFn(t.icon, t.label, t.mobileLabel),
  }));
}

/** Helper: resolve the active subtab (falling back to default) */
export function resolveSubtab(tab, subtab) {
  const config = SUBTAB_CONFIGS[tab] || SUBTAB_CONFIGS.resumen;
  if (config.tabs.some((t) => t.value === subtab)) return subtab;
  return config.defaultSubtab;
}

/** Helper: get the section header config for a given tab+subtab */
export function getSubtabHeader(tab, subtab) {
  const config = SUBTAB_CONFIGS[tab];
  return config?.headers?.[subtab] || null;
}
