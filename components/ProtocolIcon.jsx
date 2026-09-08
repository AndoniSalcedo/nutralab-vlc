'use client';

import React from 'react';
import Icon3D from '@/components/Icon3D';
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
} from '@/components/icons3d';

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

export const PROTOCOL_3D_MAP = {
  IconApple: 'apple',
  IconRun: 'running',
  IconCoffee: 'coffee',
  IconDroplet: 'glass',
  IconBatteryCharging: 'battery',
  IconFlag: 'flag',
  IconBed: 'bed',
  IconActivity: 'stopwatch',
  IconMeat: 'meat',
  IconPill: 'suplementacion',
  IconClipboardList: 'target',
};

export const PROTOCOL_AVAILABLE_ICONS = {
  IconApple: <Icon3D name="apple" size={22} />,
  IconRun: <Icon3D name="running" size={22} />,
  IconCoffee: <Icon3D name="coffee" size={22} />,
  IconDroplet: <Icon3D name="glass" size={22} />,
  IconBatteryCharging: <Icon3D name="battery" size={22} />,
  IconFlag: <Icon3D name="flag" size={22} />,
  IconBed: <Icon3D name="bed" size={22} />,
  IconActivity: <Icon3D name="stopwatch" size={22} />,
  IconMeat: <Icon3D name="meat" size={22} />,
  IconPill: <Icon3D name="suplementacion" size={22} />,
  IconClipboardList: <Icon3D name="target" size={22} />
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

export default function ProtocolIcon({ iconName, size = 20, color, style = {} }) {
  if (!iconName) return null;
  const name3d = PROTOCOL_3D_MAP[iconName];
  if (name3d) {
    return <Icon3D name={name3d} size={size} style={{ flexShrink: 0, ...style }} />;
  }
  const IconComponent = PROTOCOL_ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent size={size} style={{ color: color || 'inherit', flexShrink: 0, ...style }} />;
  }
  if (typeof iconName === 'string' && iconName.length <= 4) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}>{iconName}</span>;
  }
  return null;
}
