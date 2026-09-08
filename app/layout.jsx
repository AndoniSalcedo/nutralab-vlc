import { Plus_Jakarta_Sans } from 'next/font/google';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@/components/icons3d.css';
import { ColorSchemeScript } from '@mantine/core';
import Providers from '@/components/Providers';
import '@/components/bones/registry';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata = {
  title: 'Nutralab - Cuídate y disfruta',
  description: 'Panel nutricional para monitorización de jugadores',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nutralab',
  },
  icons: {
    icon: '/favico_nutralab-32x32.png',
    apple: '/favico_nutralab-192x192.png',
  },
};

export const viewport = {
  themeColor: '#6c705a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={plusJakartaSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
