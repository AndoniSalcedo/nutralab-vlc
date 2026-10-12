'use client';

import { notifications } from '@mantine/notifications';
import AnimatedCheck from './AnimatedCheck';

// Notificación de guardado con el check animado (misma API que notifications.show)
export function notifySaved({ title = 'Guardado', message, color = 'teal', ...rest } = {}) {
  notifications.show({ title, message, color, icon: <AnimatedCheck size={20} color="white" />, ...rest });
}
