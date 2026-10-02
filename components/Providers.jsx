'use client';

import { useEffect } from 'react';
import { ActionIcon, Combobox, createTheme, HoverCard, MantineProvider, Menu, Modal, MultiSelect, Popover, Select, Tooltip } from '@mantine/core';

const nutralabColor = [
  '#f5f6ef',
  '#e5e6e0',
  '#d1d2ca',
  '#b8baad',
  '#a2a594',
  '#949784',
  '#8d917a',
  '#7a7d68',
  '#6c705a',
  '#5c6049',
];

const theme = createTheme({
  fontFamily: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
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
    nutralabColor,
  },
  primaryColor: 'nutralabColor',
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
