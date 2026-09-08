'use client';

import React from 'react';
import Image from 'next/image';
import { Box } from '@mantine/core';
import * as TablerIcons from '@tabler/icons-react';

// Re-export all standard Tabler icons
export * from '@tabler/icons-react';

/**
 * Global Switch: 3D PNG Icons vs @tabler/icons-react.
 * 
 * - false (current): Uses native Tabler vector icons across the entire app.
 * - true: Switches to 3D PNG icons from /public/icons-3d/.
 * 
 * Changing this single constant switches icon rendering across all screens!
 */
export const USE_3D_ICONS = false;

export const ICONS_3D_AVAILABLE = [
  'alarmclock',
  'analiticas',
  'apple',
  'arrowleft',
  'avocado',
  'barchart',
  'battery',
  'bed',
  'bell',
  'blood',
  'bolt',
  'book',
  'bowl',
  'brain',
  'bread',
  'bulb',
  'butter',
  'calendar',
  'camera',
  'chart',
  'chat',
  'check',
  'clipboard',
  'coffee',
  'configuracion',
  'cross',
  'cup',
  'dna',
  'document',
  'droplet',
  'edit',
  'envelope',
  'evolucion',
  'eye',
  'fire',
  'flag',
  'folder',
  'glass',
  'gym',
  'heart',
  'inbox',
  'info',
  'key',
  'link',
  'lock',
  'meat',
  'medal',
  'memo',
  'menu',
  'microscope',
  'outbox',
  'package',
  'pill',
  'pin',
  'plantilla',
  'plate',
  'plus',
  'pot',
  'printer',
  'refresh',
  'rice',
  'running',
  'salad',
  'scale',
  'search',
  'shield',
  'soccer',
  'sparkles',
  'star',
  'stethoscope',
  'stopwatch',
  'suplementacion',
  'target',
  'testtube',
  'trash',
  'trophy',
  'user',
  'warning',
];

export const ALIASES = {
  settings: 'configuracion',
  gear: 'configuracion',
  add: 'plus',
  delete: 'trash',
  remove: 'trash',
  mail: 'envelope',
  email: 'envelope',
  file: 'document',
  history: 'alarmclock',
  clock: 'alarmclock',
  time: 'alarmclock',
  weight: 'scale',
  weights: 'gym',
  water: 'droplet',
  nutrition: 'apple',
  food: 'plate',
  meal: 'plate',
  protocol: 'target',
  suplementos: 'suplementacion',
  supplements: 'suplementacion',
  stats: 'barchart',
  analytics: 'analiticas',
  team: 'soccer',
  players: 'plantilla',
  player: 'user',
  download: 'inbox',
  upload: 'outbox',
  export: 'outbox',
  import: 'inbox',
  pdf: 'document',
  report: 'memo',
  message: 'chat',
  messages: 'chat',
  overview: 'chart',
  trending: 'evolucion',
  calendar_event: 'calendar',
};

export const TABLER_ICON_MAP = {
  alarmclock: TablerIcons.IconClock,
  analiticas: TablerIcons.IconReportAnalytics,
  apple: TablerIcons.IconApple,
  arrowleft: TablerIcons.IconArrowLeft,
  arrowright: TablerIcons.IconArrowRight,
  arrowup: TablerIcons.IconArrowUp,
  arrowdown: TablerIcons.IconArrowDown,
  avocado: TablerIcons.IconAvocado || TablerIcons.IconSalad,
  barchart: TablerIcons.IconChartBar,
  battery: TablerIcons.IconBatteryCharging,
  bed: TablerIcons.IconBed,
  bell: TablerIcons.IconBell,
  blood: TablerIcons.IconDroplet,
  bolt: TablerIcons.IconBolt,
  book: TablerIcons.IconBook,
  bowl: TablerIcons.IconToolsKitchen,
  brain: TablerIcons.IconBrain,
  bread: TablerIcons.IconBread || TablerIcons.IconWheat,
  bulb: TablerIcons.IconBulb,
  butter: TablerIcons.IconCheese,
  calendar: TablerIcons.IconCalendar,
  calendar_event: TablerIcons.IconCalendarEvent,
  camera: TablerIcons.IconCamera,
  chart: TablerIcons.IconChartLine,
  chat: TablerIcons.IconMessageCircle,
  check: TablerIcons.IconCheck,
  clipboard: TablerIcons.IconClipboardList,
  coffee: TablerIcons.IconCoffee,
  configuracion: TablerIcons.IconSettings,
  cross: TablerIcons.IconX,
  cup: TablerIcons.IconCup,
  dna: TablerIcons.IconDna,
  document: TablerIcons.IconFileText,
  droplet: TablerIcons.IconDroplet,
  edit: TablerIcons.IconPencil,
  envelope: TablerIcons.IconMail,
  evolucion: TablerIcons.IconTrendingUp,
  eye: TablerIcons.IconEye,
  fire: TablerIcons.IconFlame,
  flag: TablerIcons.IconFlag,
  folder: TablerIcons.IconFolder,
  glass: TablerIcons.IconGlassFull || TablerIcons.IconGlass,
  gym: TablerIcons.IconBarbell,
  heart: TablerIcons.IconHeart,
  inbox: TablerIcons.IconInbox,
  info: TablerIcons.IconInfoCircle,
  key: TablerIcons.IconKey,
  link: TablerIcons.IconExternalLink,
  lock: TablerIcons.IconLock,
  meat: TablerIcons.IconMeat,
  medal: TablerIcons.IconMedal,
  memo: TablerIcons.IconNotes || TablerIcons.IconFileText,
  menu: TablerIcons.IconCalendarEvent,
  microscope: TablerIcons.IconMicroscope,
  outbox: TablerIcons.IconFileSpreadsheet,
  package: TablerIcons.IconPackage,
  pill: TablerIcons.IconPill,
  pin: TablerIcons.IconPin,
  plantilla: TablerIcons.IconUsers,
  plate: TablerIcons.IconToolsKitchen2,
  plus: TablerIcons.IconPlus,
  pot: TablerIcons.IconChefHat,
  printer: TablerIcons.IconPrinter,
  refresh: TablerIcons.IconArrowsExchange,
  rice: TablerIcons.IconSoup,
  running: TablerIcons.IconRun,
  salad: TablerIcons.IconSalad,
  scale: TablerIcons.IconScale,
  search: TablerIcons.IconSearch,
  shield: TablerIcons.IconShield,
  soccer: TablerIcons.IconBallFootball,
  sparkles: TablerIcons.IconSparkles,
  star: TablerIcons.IconStar,
  stethoscope: TablerIcons.IconStethoscope,
  stopwatch: TablerIcons.IconClock,
  suplementacion: TablerIcons.IconBottle,
  target: TablerIcons.IconTarget,
  testtube: TablerIcons.IconTestPipe,
  trash: TablerIcons.IconTrash,
  trophy: TablerIcons.IconTrophy,
  user: TablerIcons.IconUser,
  warning: TablerIcons.IconAlertTriangle,
  filter: TablerIcons.IconFilter,
  copy: TablerIcons.IconCopy,
  download: TablerIcons.IconDownload,
  upload: TablerIcons.IconUpload,
  logout: TablerIcons.IconLogout,
};

const PRESET_SIZES = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 42,
  xl: 54,
  hero: 72,
  jumbo: 96,
};

function resolvePixelSize(size) {
  if (size === undefined || size === null) return 24;
  if (typeof size === 'number') {
    return Math.max(14, Math.round(size));
  }
  if (typeof size === 'string') {
    const parsed = parseFloat(size);
    if (!isNaN(parsed)) {
      return resolvePixelSize(parsed);
    }
    return PRESET_SIZES[size] || 24;
  }
  return 24;
}

function resolveTablerSize(size) {
  if (size === undefined || size === null) return 20;
  if (typeof size === 'number') {
    if (size >= 80) return 56;
    if (size >= 60) return 44;
    if (size >= 40) return 30;
    if (size >= 30) return 26;
    return size;
  }
  if (typeof size === 'string') {
    const parsed = parseFloat(size);
    if (!isNaN(parsed)) {
      return resolveTablerSize(parsed);
    }
    const tablerPresets = {
      xs: 14,
      sm: 18,
      md: 20,
      lg: 26,
      xl: 32,
      hero: 44,
      jumbo: 56,
    };
    return tablerPresets[size] || 20;
  }
  return 20;
}

export default function Icon3D({
  name,
  size = 'md',
  alt,
  className,
  style = {},
  stroke = 1.5,
  color,
  ...props
}) {
  if (!name) return null;

  const resolvedName = ALIASES[name] || name;

  if (USE_3D_ICONS) {
    const pixelSize = resolvePixelSize(size);
    const src = `/icons-3d/${resolvedName}.png`;
    const shouldShowShadow = pixelSize >= 22;

    return (
      <Box
        component="span"
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
          verticalAlign: 'middle',
          flexShrink: 0,
          filter: shouldShowShadow ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))' : 'none',
          transition: 'transform 160ms ease, filter 160ms ease',
          ...style,
        }}
        {...props}
      >
        <Image
          src={src}
          alt={alt || `${name} 3D`}
          width={pixelSize}
          height={pixelSize}
          unoptimized
          style={{
            width: pixelSize,
            height: pixelSize,
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </Box>
    );
  }

  // When 3D is disabled, render the corresponding Tabler icon
  const TablerComponent = TABLER_ICON_MAP[resolvedName] || TablerIcons.IconFileText;
  const tablerSize = resolveTablerSize(size);

  return (
    <TablerComponent
      size={tablerSize}
      stroke={stroke}
      color={color}
      className={className}
      style={{
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}

export { Icon3D };

const create3DIcon = (name) => {
  const Component = (props) => <Icon3D name={name} {...props} />;
  Component.displayName = `Icon3D_${name}`;
  return Component;
};

const makeIcon = (name3d, TablerComponent) => {
  if (USE_3D_ICONS) {
    return create3DIcon(name3d);
  }
  return TablerComponent;
};

// Activity, Health & Medical
export const IconActivity = makeIcon('chart', TablerIcons.IconActivity);
export const IconActivityHeartbeat = makeIcon('heart', TablerIcons.IconActivityHeartbeat);
export const IconHeart = makeIcon('heart', TablerIcons.IconHeart);
export const IconReportMedical = makeIcon('stethoscope', TablerIcons.IconReportMedical);
export const IconStethoscope = makeIcon('stethoscope', TablerIcons.IconStethoscope);
export const IconDna = makeIcon('dna', TablerIcons.IconDna);
export const IconMicroscope = makeIcon('microscope', TablerIcons.IconMicroscope);
export const IconTestPipe = makeIcon('testtube', TablerIcons.IconTestPipe);

// Alerts & Info
export const IconAlertCircle = makeIcon('warning', TablerIcons.IconAlertCircle);
export const IconAlertTriangle = makeIcon('warning', TablerIcons.IconAlertTriangle);
export const IconInfoCircle = makeIcon('info', TablerIcons.IconInfoCircle);

// Food & Nutrition
export const IconApple = makeIcon('apple', TablerIcons.IconApple);
export const IconChefHat = makeIcon('pot', TablerIcons.IconChefHat);
export const IconMeat = makeIcon('meat', TablerIcons.IconMeat);
export const IconSalad = makeIcon('salad', TablerIcons.IconSalad);
export const IconToolsKitchen = makeIcon('plate', TablerIcons.IconToolsKitchen);
export const IconToolsKitchen2 = makeIcon('plate', TablerIcons.IconToolsKitchen2);
export const IconCoffee = makeIcon('coffee', TablerIcons.IconCoffee);
export const IconBottle = makeIcon('suplementacion', TablerIcons.IconBottle);
export const IconPill = makeIcon('pill', TablerIcons.IconPill);
export const IconWheat = TablerIcons.IconWheat;

// Physical & Metrics
export const IconDroplet = makeIcon('droplet', TablerIcons.IconDroplet);
export const IconFlame = makeIcon('fire', TablerIcons.IconFlame);
export const IconScale = makeIcon('scale', TablerIcons.IconScale);
export const IconRuler2 = makeIcon('scale', TablerIcons.IconRuler2);
export const IconBed = makeIcon('bed', TablerIcons.IconBed);
export const IconRun = makeIcon('running', TablerIcons.IconRun);
export const IconBarbell = makeIcon('gym', TablerIcons.IconBarbell);
export const IconBatteryCharging = makeIcon('battery', TablerIcons.IconBatteryCharging);

// Charts & Analytics
export const IconChartBar = makeIcon('barchart', TablerIcons.IconChartBar);
export const IconChartLine = makeIcon('chart', TablerIcons.IconChartLine);
export const IconReportAnalytics = makeIcon('analiticas', TablerIcons.IconReportAnalytics);
export const IconFileAnalytics = makeIcon('analiticas', TablerIcons.IconFileAnalytics);
export const IconTrendingUp = makeIcon('evolucion', TablerIcons.IconTrendingUp);
export const IconTrophy = makeIcon('trophy', TablerIcons.IconTrophy);

// Users & Squad
export const IconUser = makeIcon('user', TablerIcons.IconUser);
export const IconUserCheck = makeIcon('user', TablerIcons.IconUserCheck);
export const IconUserCog = makeIcon('configuracion', TablerIcons.IconUserCog);
export const IconUserPlus = makeIcon('user', TablerIcons.IconUserPlus);
export const IconUserStar = makeIcon('star', TablerIcons.IconUserStar);
export const IconUsers = makeIcon('plantilla', TablerIcons.IconUsers);
export const IconUsersGroup = makeIcon('plantilla', TablerIcons.IconUsersGroup);

// Calendar & Time
export const IconCalendar = makeIcon('calendar', TablerIcons.IconCalendar);
export const IconCalendarEvent = makeIcon('calendar', TablerIcons.IconCalendarEvent);
export const IconCalendarStats = makeIcon('calendar', TablerIcons.IconCalendarStats);
export const IconClock = makeIcon('alarmclock', TablerIcons.IconClock);
export const IconHistory = makeIcon('alarmclock', TablerIcons.IconHistory);

// Navigation & Actions
export const IconArrowLeft = makeIcon('arrowleft', TablerIcons.IconArrowLeft);
export const IconArrowRight = makeIcon('arrowright', TablerIcons.IconArrowRight);
export const IconArrowUp = makeIcon('arrowup', TablerIcons.IconArrowUp);
export const IconArrowDown = makeIcon('arrowdown', TablerIcons.IconArrowDown);
export const IconArrowsExchange = makeIcon('refresh', TablerIcons.IconArrowsExchange);
export const IconArrowsLeftRight = makeIcon('refresh', TablerIcons.IconArrowsLeftRight);
export const IconRotate = makeIcon('refresh', TablerIcons.IconRotate);
export const IconRotateClockwise = makeIcon('refresh', TablerIcons.IconRotateClockwise);
export const IconRefresh = makeIcon('refresh', TablerIcons.IconRefresh);
export const IconExchange = makeIcon('refresh', TablerIcons.IconExchange || TablerIcons.IconArrowsExchange);
export const IconPlus = makeIcon('plus', TablerIcons.IconPlus);
export const IconCirclePlus = makeIcon('plus', TablerIcons.IconCirclePlus);
export const IconTrash = makeIcon('trash', TablerIcons.IconTrash);
export const IconEdit = makeIcon('edit', TablerIcons.IconEdit);
export const IconPencil = makeIcon('edit', TablerIcons.IconPencil);
export const IconCheck = makeIcon('check', TablerIcons.IconCheck);
export const IconDeviceFloppy = makeIcon('check', TablerIcons.IconDeviceFloppy);
export const IconX = makeIcon('cross', TablerIcons.IconX);
export const IconLogout = makeIcon('cross', TablerIcons.IconLogout);

// Documents & Files
export const IconClipboardList = makeIcon('clipboard', TablerIcons.IconClipboardList);
export const IconDocument = makeIcon('document', TablerIcons.IconFileDescription || TablerIcons.IconFileText);
export const IconFileText = makeIcon('document', TablerIcons.IconFileText);
export const IconFileSpreadsheet = makeIcon('document', TablerIcons.IconFileSpreadsheet);
export const IconFileTypePdf = makeIcon('document', TablerIcons.IconFileTypePdf);
export const IconBook = makeIcon('book', TablerIcons.IconBook);
export const IconNotes = makeIcon('memo', TablerIcons.IconNotes);
export const IconCopy = makeIcon('memo', TablerIcons.IconCopy);
export const IconList = makeIcon('menu', TablerIcons.IconList);
export const IconFolderShare = makeIcon('folder', TablerIcons.IconFolderShare);
export const IconDatabase = makeIcon('folder', TablerIcons.IconDatabase);
export const IconDatabaseImport = makeIcon('inbox', TablerIcons.IconDatabaseImport);
export const IconDownload = makeIcon('inbox', TablerIcons.IconDownload);
export const IconInbox = makeIcon('inbox', TablerIcons.IconInbox);
export const IconCloudUpload = makeIcon('outbox', TablerIcons.IconCloudUpload);
export const IconUpload = makeIcon('outbox', TablerIcons.IconUpload);

// Media & Device
export const IconCamera = makeIcon('camera', TablerIcons.IconCamera);
export const IconPhoto = makeIcon('camera', TablerIcons.IconPhoto);
export const IconSearch = makeIcon('search', TablerIcons.IconSearch);
export const IconZoomIn = makeIcon('search', TablerIcons.IconZoomIn);
export const IconZoomOut = makeIcon('search', TablerIcons.IconZoomOut);
export const IconFilter = makeIcon('target', TablerIcons.IconFilter);
export const IconSortDescending = makeIcon('barchart', TablerIcons.IconSortDescending);

// Settings & Security
export const IconSettings = makeIcon('configuracion', TablerIcons.IconSettings);
export const IconLock = makeIcon('lock', TablerIcons.IconLock);
export const IconShield = makeIcon('shield', TablerIcons.IconShield);
export const IconShieldCheck = makeIcon('shield', TablerIcons.IconShieldCheck);
export const IconKey = makeIcon('key', TablerIcons.IconKey);

// Communication & Extras
export const IconMail = makeIcon('envelope', TablerIcons.IconMail);
export const IconSend = makeIcon('chat', TablerIcons.IconSend);
export const IconBrain = makeIcon('brain', TablerIcons.IconBrain);
export const IconSparkles = makeIcon('sparkles', TablerIcons.IconSparkles);
export const IconPalette = makeIcon('sparkles', TablerIcons.IconPalette);
export const IconCalculator = makeIcon('scale', TablerIcons.IconCalculator);
export const IconFlag = makeIcon('flag', TablerIcons.IconFlag);
export const IconExternalLink = makeIcon('link', TablerIcons.IconExternalLink);
export const IconEye = makeIcon('eye', TablerIcons.IconEye);
export const IconBell = makeIcon('bell', TablerIcons.IconBell);
