'use client';

import { createTheme, MantineProvider, Modal } from '@mantine/core';

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
  components: {
    Modal: Modal.extend({
      defaultProps: {
        lockScroll: false,
      },
    }),
  },
  colors: {
    nutralabColor,
  },
  primaryColor: 'nutralabColor',
});

export default function Providers({ children }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
