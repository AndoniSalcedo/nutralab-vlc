'use client';

import { useState } from 'react';
import { Box, Button, Group, Paper, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Icon3D from '@/components/Icon3D';
import ResponsiveModal from '@/components/modals/ResponsiveModal';
import { NOTIFICATION_TYPES } from '@/config/notifications';
import { sendTestNotification } from '@/actions/notificationActions';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';
import { usePushSubscription } from './usePushSubscription';

function DeviceStatus({ push }) {
  const { settings, support, subscribed, busy, enable, disable } = push;

  if (settings && !settings.available) {
    return <Text fz="sm" c="dimmed">Los avisos todavía no están disponibles. Te avisaremos cuando lo estén.</Text>;
  }
  if (support.needsInstall) {
    return (
      <Stack gap="xs">
        <Text fz="sm" c="dark.4" lh={1.45}>
          En iPhone los avisos solo funcionan con la app instalada en la pantalla de inicio.
        </Text>
        <Text fz="sm" c="dark.4" lh={1.45}>
          En Safari pulsa <Text span fw={700}>Compartir</Text> → <Text span fw={700}>Añadir a pantalla de inicio</Text>, abre la app desde el icono y vuelve aquí.
        </Text>
      </Stack>
    );
  }
  if (!support.supported) {
    return <Text fz="sm" c="dimmed">Este navegador no admite notificaciones. Prueba con Chrome, Edge, Firefox o Safari actualizados.</Text>;
  }
  if (support.permission === 'denied' && !subscribed) {
    return (
      <Text fz="sm" c="dark.4" lh={1.45}>
        Has bloqueado las notificaciones de Nutralab en este navegador. Actívalas desde los ajustes del navegador (icono del candado junto a la dirección) y vuelve aquí.
      </Text>
    );
  }

  const toggle = async (checked) => {
    try {
      if (checked) {
        const result = await enable();
        if (result === 'granted') notifySaved({ title: 'Avisos activados', message: 'Te llegarán en este dispositivo.' });
        else if (result === 'denied') notifications.show({ color: 'orange', title: 'Permiso denegado', message: 'Sin permiso del navegador no podemos enviarte avisos.' });
      } else {
        await disable();
      }
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo cambiar', message: errorMessage(error, 'Inténtalo de nuevo.') });
    }
  };

  return (
    <Switch
      checked={subscribed}
      onChange={(e) => toggle(e.currentTarget.checked)}
      disabled={busy}
      color="lima"
      size="md"
      label={<Text fz="sm" fw={700} c="dark.5">Recibir avisos en este dispositivo</Text>}
      description={subscribed ? 'Activado. Puedes elegir abajo qué avisos quieres.' : 'Te pediremos permiso para mostrar notificaciones.'}
    />
  );
}

export default function NotificationSettingsModal({ opened, onClose }) {
  const push = usePushSubscription({ enabled: opened });
  const { settings, subscribed, setPref } = push;
  const [testing, setTesting] = useState(false);

  const handlePref = async (key, value) => {
    try {
      await setPref(key, value);
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: errorMessage(error, 'Inténtalo de nuevo.') });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { delivered } = await sendTestNotification();
      if (!delivered) notifications.show({ color: 'orange', title: 'No ha llegado', message: 'Desactiva y vuelve a activar los avisos en este dispositivo.' });
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo enviar', message: errorMessage(error, 'Inténtalo de nuevo.') });
    } finally {
      setTesting(false);
    }
  };

  const title = (
    <Group gap="xs" wrap="nowrap">
      <Icon3D name="bell" size={22} />
      <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6">Notificaciones</Text>
    </Group>
  );

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={title} size="md" radius="xl">
        <Stack gap="lg">
          <Paper p="md" radius="lg" bg="gray.0">
            {push.loading ? <Text fz="sm" c="dimmed">Cargando…</Text> : <DeviceStatus push={push} />}
          </Paper>

          {settings?.available && (
            <Stack gap="sm">
              <Text fz="xs" fw={700} c="dimmed" tt="uppercase">Qué avisos quieres</Text>
              {NOTIFICATION_TYPES.map((type) => (
                <Group key={type.key} justify="space-between" wrap="nowrap" gap="md" align="flex-start">
                  <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                    <Icon3D name={type.icon} size={24} style={{ flexShrink: 0 }} />
                    <Box style={{ minWidth: 0 }}>
                      <Text fz="sm" fw={700} c="dark.5">{type.label}</Text>
                      <Text fz="xs" c="dimmed" lh={1.35}>{type.description}</Text>
                    </Box>
                  </Group>
                  <Switch
                    checked={settings.prefs?.[type.key] !== false}
                    onChange={(e) => handlePref(type.key, e.currentTarget.checked)}
                    color="lima"
                    aria-label={type.label}
                  />
                </Group>
              ))}
            </Stack>
          )}

          {subscribed && (
            <Button variant="light" color="dark" radius="xl" onClick={handleTest} loading={testing}>
              Enviar un aviso de prueba
            </Button>
          )}
        </Stack>
    </ResponsiveModal>
  );
}
