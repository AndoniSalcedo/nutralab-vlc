'use client';

import React from 'react';
import Image from 'next/image';
import { Box } from '@mantine/core';
import * as TablerIcons from '@tabler/icons-react';

// Re-export all standard Tabler icons
export * from '@tabler/icons-react';
export * as TablerIcons from '@tabler/icons-react';
export * as NormalIcons from '@tabler/icons-react';

/**
 * Icon System Configuration:
 * 
 * - USE_3D_ICONS: Master switch for 3D PNG icons vs standard vector Tabler icons.
 * - USE_3D_IN_INPUTS: When false, inputs, selects, search bars, datepickers, and form controls
 *   automatically use clean, crisp normal Tabler vector icons.
 * - USE_3D_IN_BUTTONS: When false, buttons and action icons automatically use normal vector icons.
 * 
 * Individual override props on any icon component:
 * - normal / flat / variant="normal": Forces normal Tabler vector icon.
 * - force3d / variant="3d": Forces 3D PNG icon.
 */
export const USE_3D_ICONS = true;
export const USE_3D_IN_INPUTS = false;
export const USE_3D_IN_BUTTONS = false;
export const USE_3D_IN_TABS = true;

export const ICON_CONFIG = {
  use3D: USE_3D_ICONS,
  use3DInInputs: USE_3D_IN_INPUTS,
  use3DInButtons: USE_3D_IN_BUTTONS,
  use3DInTabs: USE_3D_IN_TABS,
};

export const ICONS_3D_AVAILABLE = [
  'adhesive_bandage',
  'alarmclock',
  'analiticas',
  'apple',
  'arrowleft',
  'avocado',
  'barchart',
  'battery',
  'bed',
  'bell',
  'bento_box',
  'blood',
  'bolt',
  'bone',
  'book',
  'bowl',
  'boxing_glove',
  'brain',
  'bread',
  'bulb',
  'butter',
  'calendar',
  'camera',
  'canned_food',
  'card_file_box',
  'card_index',
  'chart',
  'chat',
  'check',
  'clipboard',
  'coffee',
  'configuracion',
  'cooking',
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
  'fork_and_knife',
  'glass',
  'gym',
  'heart',
  'hourglass',
  'inbox',
  'info',
  'jar',
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
  'running_shoe',
  'salad',
  'sandwich',
  'scale',
  'search',
  'shield',
  'soccer',
  'sparkles',
  'spiral_notepad',
  'star',
  'stethoscope',
  'stopwatch',
  'suplementacion',
  'syringe',
  'target',
  'testtube',
  'timer_clock',
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
  analiticas: 'stethoscope',
  analytics: 'stethoscope',
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
  catalog: 'card_file_box',
  catalogo: 'card_file_box',
  catalogos: 'card_file_box',
  bottle: 'jar',
  jar: 'jar',
  bento: 'bento_box',
  cutlery: 'fork_and_knife',
  dining: 'fork_and_knife',
  menu: 'fork_and_knife',
  cooking: 'cooking',
  snack: 'sandwich',
  timing: 'hourglass',
  diario: 'spiral_notepad',
  notepad: 'spiral_notepad',
  bandage: 'adhesive_bandage',
};

export const TABLER_ICON_MAP = {
  adhesive_bandage: TablerIcons.IconBandage || TablerIcons.IconFirstAidKit,
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
  bento_box: TablerIcons.IconBox,
  blood: TablerIcons.IconDroplet,
  bolt: TablerIcons.IconBolt,
  bone: TablerIcons.IconBone,
  book: TablerIcons.IconBook,
  bowl: TablerIcons.IconToolsKitchen,
  boxing_glove: TablerIcons.IconBarbell,
  brain: TablerIcons.IconBrain,
  bread: TablerIcons.IconBread || TablerIcons.IconWheat,
  bulb: TablerIcons.IconBulb,
  butter: TablerIcons.IconCheese,
  calendar: TablerIcons.IconCalendar,
  calendar_event: TablerIcons.IconCalendarEvent,
  camera: TablerIcons.IconCamera,
  canned_food: TablerIcons.IconArchive,
  card_file_box: TablerIcons.IconFolders || TablerIcons.IconFolder,
  card_index: TablerIcons.IconId,
  chart: TablerIcons.IconChartLine,
  chat: TablerIcons.IconMessageCircle,
  check: TablerIcons.IconCheck,
  clipboard: TablerIcons.IconClipboardList,
  coffee: TablerIcons.IconCoffee,
  configuracion: TablerIcons.IconSettings,
  cooking: TablerIcons.IconToolsKitchen,
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
  fork_and_knife: TablerIcons.IconToolsKitchen,
  glass: TablerIcons.IconGlassFull || TablerIcons.IconGlass,
  gym: TablerIcons.IconBarbell,
  heart: TablerIcons.IconHeart,
  hourglass: TablerIcons.IconHourglass,
  inbox: TablerIcons.IconInbox,
  info: TablerIcons.IconInfoCircle,
  jar: TablerIcons.IconBottle,
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
  running_shoe: TablerIcons.IconShoe || TablerIcons.IconRun,
  salad: TablerIcons.IconSalad,
  sandwich: TablerIcons.IconToolsKitchen2,
  scale: TablerIcons.IconScale,
  search: TablerIcons.IconSearch,
  shield: TablerIcons.IconShield,
  soccer: TablerIcons.IconBallFootball,
  sparkles: TablerIcons.IconSparkles,
  spiral_notepad: TablerIcons.IconNotes,
  star: TablerIcons.IconStar,
  stethoscope: TablerIcons.IconStethoscope,
  stopwatch: TablerIcons.IconClock,
  suplementacion: TablerIcons.IconBottle,
  syringe: TablerIcons.IconVaccine || TablerIcons.IconDroplet,
  target: TablerIcons.IconTarget,
  testtube: TablerIcons.IconTestPipe,
  timer_clock: TablerIcons.IconClock,
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

export const Icon3D = React.forwardRef(function Icon3D({
  name,
  size = 'md',
  alt,
  className = '',
  style = {},
  stroke = 1.5,
  color,
  normal = false,
  flat = false,
  force3d = false,
  variant, // 'normal' | '3d' | 'auto'
  tablerComponent,
  ...props
}, ref) {
  if (!name) return null;

  const resolvedName = ALIASES[name] || name;
  const isExplicitNormal = normal || flat || variant === 'normal';
  const isExplicit3D = force3d || variant === '3d';
  const TablerComponent = tablerComponent || TABLER_ICON_MAP[resolvedName] || TablerIcons.IconFileText;
  const tablerSize = resolveTablerSize(size);

  // If 3D is disabled globally or explicitly forced to normal
  if (!USE_3D_ICONS || isExplicitNormal) {
    return (
      <TablerComponent
        ref={ref}
        size={tablerSize}
        stroke={stroke}
        color={color}
        className={`nutra-icon-root force-normal ${className}`.trim()}
        style={{
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style,
        }}
        {...props}
      />
    );
  }

  // If explicitly forced 3D (even inside inputs or buttons)
  if (isExplicit3D) {
    const pixelSize = resolvePixelSize(size);
    const src = `/icons-3d/${resolvedName}.png`;
    const shouldShowShadow = pixelSize >= 22;

    return (
      <Box
        ref={ref}
        component="span"
        className={`nutra-icon-root force-3d ${className}`.trim()}
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

  // Check if 3D image exists for this name; if not, fallback to Tabler
  const is3DAvailable = ICONS_3D_AVAILABLE.includes(resolvedName);
  if (!is3DAvailable) {
    return (
      <TablerComponent
        ref={ref}
        size={tablerSize}
        stroke={stroke}
        color={color}
        className={`nutra-icon-root ${className}`.trim()}
        style={{
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style,
        }}
        {...props}
      />
    );
  }

  // Default dual-mode: Render both representations.
  // CSS automatically displays the normal vector icon in inputs, selects, and buttons
  // when USE_3D_IN_INPUTS / USE_3D_IN_BUTTONS are false.
  const pixelSize = resolvePixelSize(size);
  const src = `/icons-3d/${resolvedName}.png`;
  const shouldShowShadow = pixelSize >= 22;

  return (
    <span
      ref={ref}
      className={`nutra-icon-root ${className}`.trim()}
      data-icon-name={resolvedName}
      data-3d-inputs={USE_3D_IN_INPUTS ? 'true' : 'false'}
      data-3d-buttons={USE_3D_IN_BUTTONS ? 'true' : 'false'}
      data-3d-tabs={USE_3D_IN_TABS ? 'true' : 'false'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <span
        className="nutra-icon-3d"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
          filter: shouldShowShadow ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))' : 'none',
          transition: 'transform 160ms ease, filter 160ms ease',
        }}
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
      </span>
      <span
        className="nutra-icon-normal"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
        }}
      >
        <TablerComponent
          size={tablerSize}
          stroke={stroke}
          color={color}
          style={{
            verticalAlign: 'middle',
            flexShrink: 0,
          }}
        />
      </span>
    </span>
  );
});

export default Icon3D;

// Helper component to wrap any section where normal icons are explicitly desired
export function IconNormalZone({ children, className = '', ...props }) {
  return (
    <span data-icon-normal="true" className={`icon-normal-zone ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

const makeIcon = (name3d, TablerComponent) => {
  const Component = React.forwardRef((props, ref) => (
    <Icon3D
      ref={ref}
      name={name3d}
      tablerComponent={TablerComponent}
      {...props}
    />
  ));
  Component.displayName = `Icon_${name3d}`;
  return Component;
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
export const IconToolsKitchen = makeIcon('fork_and_knife', TablerIcons.IconToolsKitchen);
export const IconToolsKitchen2 = makeIcon('plate', TablerIcons.IconToolsKitchen2);
export const IconPlate = makeIcon('plate', TablerIcons.IconToolsKitchen2);
export const IconCoffee = makeIcon('coffee', TablerIcons.IconCoffee);
export const IconBottle = makeIcon('jar', TablerIcons.IconBottle);
export const IconJar = makeIcon('jar', TablerIcons.IconBottle);
export const IconPill = makeIcon('pill', TablerIcons.IconPill);
export const IconBentoBox = makeIcon('bento_box', TablerIcons.IconBox);
export const IconCooking = makeIcon('cooking', TablerIcons.IconToolsKitchen);
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
export const IconHourglass = makeIcon('hourglass', TablerIcons.IconHourglass);

// Charts & Analytics
export const IconChartBar = makeIcon('barchart', TablerIcons.IconChartBar);
export const IconChartLine = makeIcon('chart', TablerIcons.IconChartLine);
export const IconReportAnalytics = makeIcon('stethoscope', TablerIcons.IconReportAnalytics);
export const IconFileAnalytics = makeIcon('stethoscope', TablerIcons.IconFileAnalytics);
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
export const IconNotes = makeIcon('spiral_notepad', TablerIcons.IconNotes);
export const IconCardFile = makeIcon('card_file_box', TablerIcons.IconFolders || TablerIcons.IconFolder);
export const IconFolders = makeIcon('card_file_box', TablerIcons.IconFolders);
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
export const IconCalculator = makeIcon('barchart', TablerIcons.IconCalculator);
export const IconFlag = makeIcon('flag', TablerIcons.IconFlag);
export const IconExternalLink = makeIcon('link', TablerIcons.IconExternalLink);
export const IconEye = makeIcon('eye', TablerIcons.IconEye);
export const IconBell = makeIcon('bell', TablerIcons.IconBell);
