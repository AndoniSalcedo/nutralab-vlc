'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Icon3D from '@/components/Icon3D';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';
import { usePushSubscription } from './usePushSubscription';

const DISMISSED_KEY = 'nutralab_vlc_push_prompt_dismissed';

/**
 * Invitación en el inicio para activar los recordatorios. Solo aparece si el navegador
 * puede recibirlos, aún no se ha decidido el permiso y el paciente no la ha descartado.
 * `onOpenSettings`: abre el panel completo (iPhone sin instalar, más opciones).
 */
export default function PushPromptCard({ onOpenSettings }) {
  const [dismissed, setDismissed] = useState(true);
  const push = usePushSubscription({ enabled: !dismissed });
  const { settings, support, subscribed, loading, busy, enable } = push;

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch { /* sin almacenamiento */ }
  };

  const visible = !dismissed && !loading && settings?.available && !subscribed
    && (support.needsInstall || (support.supported && support.permission === 'default'));

  const handleEnable = async () => {
    if (support.needsInstall) {
      onOpenSettings?.();
      return;
    }
    try {
      const result = await enable();
      if (result === 'granted') {
        notifySaved({ title: 'Avisos activados', message: 'Puedes ajustar cuáles quieres desde el menú de tu perfil › Notificaciones.' });
      } else {
        dismiss();
      }
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudieron activar', message: errorMessage(error, 'Inténtalo de nuevo.') });
    }
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Paper radius={24} p="md" bg="white" style={{ boxShadow: '0 1px 2px rgba(21, 21, 19, 0.05)' }}>
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Icon3D name="bell" size={32} style={{ flexShrink: 0 }} />
              <Stack gap={8} style={{ minWidth: 0, flex: 1 }}>
                <Stack gap={2}>
                  <Text fz="sm" fw={800} c="var(--nutra-bosque, #1F2A24)">Activa tus recordatorios</Text>
                  <Text fz="xs" c="dimmed" lh={1.4}>
                    {support.needsInstall
                      ? 'Instala la app en tu pantalla de inicio y te avisaremos del día de partido, tus tomas y el agua.'
                      : 'Te avisamos de cada paso del día de partido, tus tomas, el agua y los mensajes de nutrición.'}
                  </Text>
                </Stack>
                <Group gap="xs">
                  <Button size="xs" radius="xl" color="lima" c="var(--nutra-bosque, #1F2A24)" onClick={handleEnable} loading={busy}>
                    {support.needsInstall ? 'Ver cómo' : 'Activar'}
                  </Button>
                  <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={dismiss}>
                    Ahora no
                  </Button>
                </Group>
              </Stack>
            </Group>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
