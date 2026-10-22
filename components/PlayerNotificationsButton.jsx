'use client';

import { useState } from 'react';
import { ActionIcon, Button, Menu, Tooltip } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import NotificationSettingsModal from '@/components/notifications/NotificationSettingsModal';

// Acceso del jugador a sus avisos push (mismo patrón que PlayerPasswordButton)
export default function PlayerNotificationsButton({ menuItem = false, iconOnly = false }) {
  const [opened, setOpened] = useState(false);

  let trigger;
  if (menuItem) {
    trigger = (
      <Menu.Item leftSection={<Icon3D name="bell" size={18} />} onClick={() => setOpened(true)}>
        Notificaciones
      </Menu.Item>
    );
  } else if (iconOnly) {
    trigger = (
      <Tooltip label="Notificaciones" position="bottom" withArrow>
        <ActionIcon aria-label="Notificaciones" variant="subtle" size={36} radius="xl" style={{ '--ai-hover': 'rgba(255, 255, 255, 0.1)' }} onClick={() => setOpened(true)}>
          <Icon3D name="bell" size={20} />
        </ActionIcon>
      </Tooltip>
    );
  } else {
    trigger = (
      <Button size="xs" radius="xl" variant="light" color="gray" leftSection={<Icon3D name="bell" size={18} />} onClick={() => setOpened(true)}>
        Notificaciones
      </Button>
    );
  }

  return (
    <>
      {trigger}
      <NotificationSettingsModal opened={opened} onClose={() => setOpened(false)} />
    </>
  );
}
