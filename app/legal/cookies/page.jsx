'use client';

import {
  Anchor,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconSettings } from '@/components/icons3d';

export default function CookiesPage() {
  const handleOpenPreferences = () => {
    window.dispatchEvent(new CustomEvent('nutralab_open_cookie_preferences'));
  };

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1} fz={{ base: 24, sm: 30 }} fw={700} c="#373a2e" mb="xs">
          Política de Cookies
        </Title>
        <Text size="sm" c="#7a7d68">
          Última actualización: Septiembre de 2026 · Conforme al Art. 22.2 de la LSSI-CE y directrices de la AEPD
        </Text>
      </Box>

      <Divider color="rgba(141, 145, 122, 0.18)" />

      {/* 1. Qué es una cookie */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          1. ¿Qué es una cookie?
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          Una cookie es un pequeño fichero de texto que un sitio web almacena en el navegador o dispositivo del usuario
          durante su navegación. Su función principal es facilitar el uso y la navegación, permitir la autenticación de la sesión,
          recordar opciones seleccionadas y garantizar la seguridad de la plataforma.
        </Text>
      </Stack>

      {/* 2. Qué cookies utiliza Nutralab */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          2. ¿Qué tipo de cookies utiliza Nutralab VLC?
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          La plataforma <strong>Nutralab VLC</strong> está diseñada para la monitorización nutricional y deportiva de jugadores y cuerpo técnico.
          Por ello, nuestra política de privacidad minimiza al máximo el tratamiento de identificadores:
        </Text>
        <Text size="sm" c="#5c6049" lh={1.6}>
          • <strong>Cookies técnicas y estrictamente necesarias:</strong> Son aquellas imprescindibles para permitir la comunicación entre el dispositivo del usuario y la red, y para prestar el servicio expresamente solicitado por el usuario (como acceder al panel privado de jugador o técnico mediante credenciales seguras).
        </Text>
        <Text size="sm" c="#5c6049" lh={1.6}>
          • <strong>Sin cookies de publicidad comportamental ni rastreo de terceros:</strong> No insertamos anuncios publicitarios, ni vendemos datos de navegación, ni utilizamos cookies de redes de marketing externas para rastrear a los usuarios fuera de la aplicación.
        </Text>
      </Stack>

      {/* 3. Tabla de cookies */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          3. Inventario de cookies y almacenamiento de sesión
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          A continuación se detallan las cookies y elementos de almacenamiento local utilizados en la plataforma:
        </Text>

        <Paper withBorder radius="md" p="md" mt="xs" bg="#fcfcfb">
          <Table horizontalSpacing="md" verticalSpacing="sm" fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Identificador</Table.Th>
                <Table.Th>Tipo / Entidad</Table.Th>
                <Table.Th>Finalidad</Table.Th>
                <Table.Th>Caducidad</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={700} c="#373a2e">
                  vcf_staff_session
                </Table.Td>
                <Table.Td>Técnica / Propia (HTTP-Only, Secure)</Table.Td>
                <Table.Td>
                  Autenticación segura del usuario (técnico o jugador), verificación de permisos de acceso y prevención de ataques de falsificación de peticiones.
                </Table.Td>
                <Table.Td>Fin de la sesión</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={700} c="#373a2e">
                  nutralab_cookie_consent
                </Table.Td>
                <Table.Td>Almacenamiento local (LocalStorage)</Table.Td>
                <Table.Td>
                  Almacena la confirmación del usuario de haber leído y recibido el aviso informativo sobre cookies.
                </Table.Td>
                <Table.Td>1 año</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={700} c="#373a2e">
                  mantine-color-scheme-value
                </Table.Td>
                <Table.Td>Almacenamiento local (LocalStorage)</Table.Td>
                <Table.Td>
                  Conserva la preferencia de tema visual seleccionada en la interfaz del sistema.
                </Table.Td>
                <Table.Td>Persistente</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>

      {/* 4. Base jurídica */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          4. Base jurídica y exención de consentimiento
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          De acuerdo con el artículo 22.2 de la <strong>Ley 34/2002 (LSSI-CE)</strong> y las directrices de la <strong>Agencia Española de Protección de Datos (AEPD)</strong>,
          las cookies técnicas necesarias para la navegación o la prestación de un servicio solicitado por el usuario están exceptuadas de la obligación de recabar el consentimiento previo. No obstante, en Nutralab mantenemos el compromiso de transparencia informando debidamente de su naturaleza y propósito.
        </Text>
      </Stack>

      {/* 5. Cómo gestionar o deshabilitar cookies */}
      <Stack gap="xs">
        <Title order={2} fz={18} fw={700} c="#373a2e">
          5. ¿Cómo puedes desactivar o eliminar las cookies en tu navegador?
        </Title>
        <Text size="sm" c="#5c6049" lh={1.6}>
          El usuario puede en cualquier momento revocar o restringir la instalación de cookies ajustando la configuración de su navegador web. Ten en cuenta que si bloqueas las cookies técnicas esenciales, no será posible iniciar sesión ni acceder al portal privado de jugadores o técnicos:
        </Text>
        <Text size="sm" c="#5c6049" lh={1.6}>
          • <Anchor href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" c="#5c6049" fw={600}>Google Chrome</Anchor><br />
          • <Anchor href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" c="#5c6049" fw={600}>Apple Safari</Anchor><br />
          • <Anchor href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" c="#5c6049" fw={600}>Mozilla Firefox</Anchor><br />
          • <Anchor href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" c="#5c6049" fw={600}>Microsoft Edge</Anchor>
        </Text>
      </Stack>

      {/* 6. Botón interactivo para consultar */}
      <Paper p="md" radius="lg" bg="rgba(92, 96, 73, 0.06)" style={{ border: '1px solid rgba(141, 145, 122, 0.2)' }}>
        <Stack gap="sm" align="flex-start">
          <Text size="sm" fw={600} c="#373a2e">
            ¿Deseas volver a consultar el aviso o las cookies activas?
          </Text>
          <Text size="xs" c="#5c6049">
            Puedes abrir el panel informativo rápido en cualquier instante haciendo clic en el siguiente botón:
          </Text>
          <Button
            size="xs"
            radius="xl"
            leftSection={<IconSettings size={16} />}
            onClick={handleOpenPreferences}
            style={{ backgroundColor: '#5c6049' }}
          >
            Abrir información rápida de cookies
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
