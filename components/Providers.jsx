'use client';

import { useEffect } from 'react';
import { ActionIcon, Button, Combobox, createTheme, HoverCard, MantineProvider, Menu, Modal, MultiSelect, Popover, Select, Tooltip } from '@mantine/core';

// Bosque: #1F2A24 (Texto primario, superficies de prestigio y menú lateral)
const bosque = [
  '#edf2ee',
  '#d7e2da',
  '#b2c5b7',
  '#8da894',
  '#688a71',
  '#4d6b53',
  '#364f3d',
  '#27372c',
  '#1F2A24', // 8: Bosque base
  '#141c18', // 9: Bosque deep
];

// Salvia: #6C705A (Textos secundarios, datos y acentos neutros cálidos)
const salvia = [
  '#f6f7f3',
  '#e8eae1',
  '#d2d6c6',
  '#bcc2aa',
  '#a4aa8e',
  '#8c9273',
  '#6C705A', // 6: Salvia base
  '#5a5e4b',
  '#474a3b',
  '#33352a',
];

// Hueso: #F8F7F4 (Fondo general del lienzo de la aplicación calibrado)
const hueso = [
  '#fdfcfb',
  '#faf9f7',
  '#F8F7F4', // 2: Hueso base
  '#f3f1ea',
  '#eae6dd',
  '#dfd8cb',
  '#cfc5b3',
  '#b8ab96',
  '#9c8d76',
  '#7a6d59',
];

// Lima: #C1F080 (Acento quirúrgico <5%, estados activos y CTAs prioritarios)
const lima = [
  '#f7fde9',
  '#eefbc8',
  '#e2f9a2',
  '#D5F677',
  '#C1F080', // 4: Lima base
  '#a9de50',
  '#8ec42b',
  '#719e1f',
  '#557816',
  '#3a520d',
];

// Arcilla: #B8674A (Alertas, desvíos fisiológicos y valores fuera de rango)
const arcilla = [
  '#fdf6f3',
  '#fae8e2',
  '#f3cfc3',
  '#ebb3a1',
  '#e0937c',
  '#d2785a',
  '#B8674A', // 6: Arcilla base
  '#9e5239',
  '#81422c',
  '#5c2d1d',
];

// Escala armónica de nutralabColor para retrocompatibilidad total
const nutralabColor = [
  '#F8F7F4', // 0: Hueso calibrado
  '#e8eae1', // 1: Salvia light
  '#d2d6c6', // 2: Salvia soft
  '#bcc2aa', // 3: Salvia tint
  '#a4aa8e', // 4: Salvia medium
  '#6C705A', // 5: Salvia
  '#4d6b53', // 6: Bosque light
  '#364f3d', // 7: Bosque mid
  '#1F2A24', // 8: Bosque base
  '#141c18', // 9: Bosque deep
];

const theme = createTheme({
  fontFamily: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  autoContrast: true,
  primaryColor: 'bosque',
  primaryShade: { light: 8, dark: 8 },
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
      },
      styles: (t, props) => {
        if (props.color === 'lima' && (!props.variant || props.variant === 'filled')) {
          return {
            root: {
              backgroundColor: '#C1F080',
              color: '#1F2A24',
              fontWeight: 700,
            },
          };
        }
        return {};
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        radius: 'xl',
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        lockScroll: false,
      },
    }),
    Popover: Popover.extend({
      defaultProps: {
        zIndex: 2500,
      },
    }),
    Menu: Menu.extend({
      defaultProps: {
        zIndex: 2500,
      },
    }),
    HoverCard: HoverCard.extend({
      defaultProps: {
        zIndex: 2500,
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        zIndex: 2500,
      },
    }),
    Combobox: Combobox.extend({
      defaultProps: {
        zIndex: 2500,
      },
    }),
    Select: Select.extend({
      defaultProps: {
        comboboxProps: { zIndex: 2500, withinPortal: true },
      },
    }),
    MultiSelect: MultiSelect.extend({
      defaultProps: {
        comboboxProps: { zIndex: 2500, withinPortal: true },
      },
    }),
  },
  colors: {
    bosque,
    salvia,
    hueso,
    lima,
    arcilla,
    nutralabColor,
  },
});

import { Notifications } from '@mantine/notifications';
import CookieBanner from '@/components/legal/CookieBanner';

export default function Providers({ children }) {
  useEffect(() => {
    // En dev los chunks de /_next/static no cambian de URL: el SW (cache-first) serviría JS antiguo
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
      return;
    }

    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.error('Service Worker registration failed: ', err);
          }
        );
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications />
      {children}
      <CookieBanner />
    </MantineProvider>
  );
}
