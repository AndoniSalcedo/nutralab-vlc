'use client';

import React from 'react';
import { 
  IconApple, 
  IconRun, 
  IconCoffee, 
  IconDroplet, 
  IconBatteryCharging, 
  IconFlag, 
  IconBed, 
  IconActivity, 
  IconMeat, 
  IconPill, 
  IconClipboardList 
} from '@tabler/icons-react';

export const PROTOCOL_ICON_MAP = {
  IconApple,
  IconRun,
  IconCoffee,
  IconDroplet,
  IconBatteryCharging,
  IconFlag,
  IconBed,
  IconActivity,
  IconMeat,
  IconPill,
  IconClipboardList,
};

export const PROTOCOL_AVAILABLE_ICONS = {
  IconApple: <IconApple size={16} />,
  IconRun: <IconRun size={16} />,
  IconCoffee: <IconCoffee size={16} />,
  IconDroplet: <IconDroplet size={16} />,
  IconBatteryCharging: <IconBatteryCharging size={16} />,
  IconFlag: <IconFlag size={16} />,
  IconBed: <IconBed size={16} />,
  IconActivity: <IconActivity size={16} />,
  IconMeat: <IconMeat size={16} />,
  IconPill: <IconPill size={16} />,
  IconClipboardList: <IconClipboardList size={16} />
};

export const PROTOCOL_ICON_OPTIONS = [
  { value: 'IconApple', label: 'Comida / Manzana' },
  { value: 'IconRun', label: 'Ejercicio / Correr' },
  { value: 'IconCoffee', label: 'Cafeína / Café' },
  { value: 'IconDroplet', label: 'Hidratación / Agua' },
  { value: 'IconBatteryCharging', label: 'Energía / Batería' },
  { value: 'IconFlag', label: 'Meta / Bandera' },
  { value: 'IconBed', label: 'Descanso / Cama' },
  { value: 'IconActivity', label: 'Rendimiento / Actividad' },
  { value: 'IconMeat', label: 'Proteína / Carne' },
  { value: 'IconPill', label: 'Suplemento / Píldora' },
  { value: 'IconClipboardList', label: 'Tareas / Checklist' },
];

export default function ProtocolIcon({ iconName, size = 14, color, style = {} }) {
  if (!iconName) return null;
  const IconComponent = PROTOCOL_ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent size={size} style={{ color: color || 'inherit', flexShrink: 0, ...style }} />;
  }
  if (typeof iconName === 'string' && iconName.length <= 4) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}>{iconName}</span>;
  }
  return null;
}
