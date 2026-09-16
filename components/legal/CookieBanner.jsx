'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  Anchor,
  Transition,
} from '@mantine/core';
import { IconCookie, IconShieldCheck } from '@/components/icons3d';
import Link from 'next/link';

const CONSENT_STORAGE_KEY = 'nutralab_cookie_consent';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consent) {
      // Pequeño retardo para no interferir con la animación de carga inicial
      const timer = setTimeout(() => {
        setVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Permitir que cualquier enlace del footer abra las preferencias de cookies
  useEffect(() => {
    const handleOpenModal = () => {
      setModalOpen(true);
    };
    window.addEventListener('nutralab_open_cookie_preferences', handleOpenModal);
    return () => {
      window.removeEventListener('nutralab_open_cookie_preferences', handleOpenModal);
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Banner flotante inferior */}
      <Transition mounted={visible} transition="slide-up" duration={350} timingFunction="ease">
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)',
              maxWidth: 720,
              zIndex: 9999,
            }}
          >
            <Paper
              radius={18}
              p={{ base: 'md', sm: 'lg' }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(141, 145, 122, 0.24)',
                boxShadow: '0 12px 36px rgba(45, 48, 35, 0.12), 0 2px 8px rgba(45, 48, 35, 0.04)',
              }}
            >
              <Group align="flex-start" wrap="nowrap" gap="md">
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'rgba(92, 96, 73, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5c6049',
                    flexShrink: 0,
                  }}
                >
                  <IconCookie size={22} stroke={1.7} />
                </Box>

                <Stack gap={6} style={{ flex: 1 }}>
                  <Text size="sm" fw={700} c="#373a2e">
                    Gestión de Cookies y Privacidad
                  </Text>
                  <Text size="xs" c="#5c6049" lh={1.5}>
                    Utilizamos cookies técnicas y estrictamente necesarias para gestionar la sesión de
                    forma segura y permitir las funciones operativas de la plataforma deportiva. No
                    empleamos cookies publicitarias ni de seguimiento de terceros sin tu consentimiento.
                  </Text>

                  <Group justify="space-between" mt={8} wrap="wrap" gap="xs">
                    <Group gap="xs">
                      <Anchor
                        component={Link}
                        href="/legal/cookies"
                        size="xs"
                        c="#7a7d68"
                        underline="hover"
                      >
                        Política de Cookies
                      </Anchor>
                      <Text size="xs" c="#c2c5b6">
                        •
                      </Text>
                      <Anchor
                        component="button"
                        type="button"
                        size="xs"
                        c="#5c6049"
                        fw={600}
                        underline="hover"
                        onClick={() => setModalOpen(true)}
                      >
                        Ver detalles técnicos
                      </Anchor>
                    </Group>

                    <Button
                      size="xs"
                      radius="xl"
                      onClick={handleAccept}
                      style={{
                        backgroundColor: '#5c6049',
                        fontWeight: 600,
                        padding: '0 18px',
                        height: 32,
                        boxShadow: '0 2px 8px rgba(92, 96, 73, 0.25)',
                      }}
                    >
                      Entendido y continuar
                    </Button>
                  </Group>
                </Stack>
              </Group>
            </Paper>
          </Box>
        )}
      </Transition>

      {/* Modal de información y detalle de cookies */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Group gap="xs">
            <IconShieldCheck size={20} color="#5c6049" />
            <Text fw={700} fz={16} c="#373a2e">
              Cookies Técnicas en Nutralab VLC
            </Text>
          </Group>
        }
        size="lg"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      >
        <Stack gap="md">
          <Text size="sm" c="#5c6049" lh={1.5}>
            De conformidad con la <strong>LSSI-CE (Ley 34/2002)</strong> y el <strong>RGPD (UE 2016/679)</strong>,
            te informamos con total transparencia sobre las cookies y elementos de almacenamiento que
            emplea este portal:
          </Text>

          <Paper withBorder radius="md" p="xs">
            <Table horizontalSpacing="sm" verticalSpacing="xs" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Finalidad</Table.Th>
                  <Table.Th>Duración</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600}>vcf_staff_session</Table.Td>
                  <Table.Td>Técnica / HTTP-Only</Table.Td>
                  <Table.Td>Mantener activa la sesión autenticada de forma segura.</Table.Td>
                  <Table.Td>Sesión</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>nutralab_cookie_consent</Table.Td>
                  <Table.Td>Preferencia local</Table.Td>
                  <Table.Td>Recordar que has revisado la información de cookies.</Table.Td>
                  <Table.Td>1 año</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

          <Text size="xs" c="#7a7d68" lh={1.5}>
            Al ser cookies técnicas estrictamente necesarias para prestar el servicio del portal (autenticación y
            seguridad), no requieren consentimiento previo para su activación, pero tienes derecho a ser informado
            en todo momento y puedes gestionarlas o eliminarlas desde la configuración de tu navegador.
          </Text>

          <Group justify="space-between" mt="xs">
            <Anchor component={Link} href="/legal/cookies" size="xs" c="#5c6049" fw={600}>
              Leer la Política de Cookies completa →
            </Anchor>
            <Button
              size="xs"
              radius="xl"
              style={{ backgroundColor: '#5c6049' }}
              onClick={() => {
                localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
                setVisible(false);
                setModalOpen(false);
              }}
            >
              Aceptar y cerrar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
