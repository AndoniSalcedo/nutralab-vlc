import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';

import { ColorSchemeScript } from '@mantine/core';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Nutralab - Cuídate y disfruta',
  description: 'Panel nutricional para monitorización de jugadores',
  icons: {
    icon: '/favico_nutralab-32x32.png',
    apple: '/favico_nutralab-192x192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
