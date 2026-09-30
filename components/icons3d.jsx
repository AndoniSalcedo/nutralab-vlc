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
 * - USE_3D_IN_TABS: When false, navigation tabs and segmented controls use normal vector icons.
 * - USE_3D_IN_DROPDOWNS: When false, menus, dropdowns, and menu items automatically use normal vector icons.
 * 
 * Individual override props on any icon component:
 * - normal / flat / variant="normal": Forces normal Tabler vector icon.
 * - force3d / variant="3d": Forces 3D PNG icon.
 */
export const USE_3D_ICONS = true;
export const USE_3D_IN_INPUTS = false;
export const USE_3D_IN_BUTTONS = false;
export const USE_3D_IN_TABS = true;
export const USE_3D_IN_DROPDOWNS = false;
export const USE_3D_IN_MENUS = USE_3D_IN_DROPDOWNS;

export const ICON_CONFIG = {
  use3D: USE_3D_ICONS,
  use3DInInputs: USE_3D_IN_INPUTS,
  use3DInButtons: USE_3D_IN_BUTTONS,
  use3DInTabs: USE_3D_IN_TABS,
  use3DInDropdowns: USE_3D_IN_DROPDOWNS,
  use3DInMenus: USE_3D_IN_MENUS,
};

export const ICONS_3D_AVAILABLE = [
  'adhesive_bandage',
  'alarmclock',
  'ambulance',
  'analiticas',
  'anatomical_heart',
  'apple',
  'arrowleft',
  'avocado',
  'balance_scale',
  'banana',
  'barchart',
  'battery',
  'bed',
  'bell',
  'bento_box',
  'blood',
  'bolt',
  'bone',
  'book',
  'bookmark',
  'bowl',
  'boxing_glove',
  'brain',
  'bread',
  'broccoli',
  'bulb',
  'busts',
  'butter',
  'calendar',
  'camera',
  'canned_food',
  'card_file_box',
  'card_index',
  'carrot',
  'chart',
  'chart_down',
  'chart_up',
  'chat',
  'check',
  'cheese',
  'chequered_flag',
  'clipboard',
  'cloud',
  'coffee',
  'compass',
  'configuracion',
  'cooking',
  'cookie',
  'corn',
  'cross',
  'crown',
  'cup',
  'dna',
  'document',
  'droplet',
  'edit',
  'egg',
  'envelope',
  'evolucion',
  'eye',
  'fire',
  'first_place',
  'fish',
  'flag',
  'folder',
  'fork_and_knife',
  'gem',
  'glass',
  'goal_net',
  'grapes',
  'gym',
  'handshake',
  'heart',
  'heart_fire',
  'herb',
  'honey',
  'hospital',
  'hourglass',
  'inbox',
  'info',
  'jar',
  'key',
  'knobs',
  'label',
  'laptop',
  'leafy_green',
  'ledger',
  'lemon',
  'link',
  'lock',
  'lungs',
  'meat',
  'medal',
  'megaphone',
  'memo',
  'menu',
  'microscope',
  'milk',
  'mobile',
  'moon',
  'newspaper',
  'numbers',
  'olive',
  'orange',
  'outbox',
  'package',
  'paint_palette',
  'paperclip',
  'pasta',
  'peanuts',
  'petri_dish',
  'picture',
  'pill',
  'pin',
  'pineapple',
  'pizza',
  'plantilla',
  'plate',
  'plus',
  'pot',
  'potato',
  'poultry',
  'printer',
  'refresh',
  'rice',
  'rocket',
  'ruler',
  'running',
  'running_shoe',
  'salad',
  'salt',
  'sandwich',
  'scale',
  'search',
  'seedling',
  'shield',
  'sliders',
  'soccer',
  'sparkles',
  'speech',
  'spiral_notepad',
  'sports_medal',
  'stadium',
  'star',
  'stethoscope',
  'stopwatch',
  'strawberry',
  'sun',
  'suplementacion',
  'syringe',
  'target',
  'tea',
  'testtube',
  'thermometer',
  'timer_clock',
  'tooth',
  'trash',
  'trophy',
  'user',
  'warning',
  'water_bottle',
  'watermelon',
  'xray',
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
  send: 'rocket',
  launch: 'rocket',
  progress: 'chart_up',
  growth: 'chart_up',
  decline: 'chart_down',
  fruit: 'orange',
  vegetable: 'carrot',
  vegetables: 'broccoli',
  protein: 'egg',
  dairy: 'milk',
  carbs: 'pasta',
  fats: 'olive',
  fiber: 'leafy_green',
  hydration: 'water_bottle',
  temperature: 'thermometer',
  injury: 'ambulance',
  heartbeat: 'heart_fire',
  match: 'stadium',
  goal: 'goal_net',
  award: 'first_place',
  premium: 'crown',
  tag: 'label',
  spreadsheet: 'ledger',
  news: 'newspaper',
  announcement: 'megaphone',
  day: 'sun',
  night: 'moon',
  sleep: 'moon',
  growth_plant: 'seedling',
  palette: 'paint_palette',
  image: 'picture',
  photo: 'picture',
  adjust: 'sliders',
  measure: 'ruler',
  lab: 'petri_dish',
  calculator: 'numbers',
  collaboration: 'handshake',
  group: 'busts',
  comment: 'speech',
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
  cookie: TablerIcons.IconCookie,
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
  rocket: TablerIcons.IconRocket,
  chart_up: TablerIcons.IconTrendingUp,
  chart_down: TablerIcons.IconTrendingDown,
  banana: TablerIcons.IconBanana || TablerIcons.IconApple,
  carrot: TablerIcons.IconCarrot,
  broccoli: TablerIcons.IconSalad,
  egg: TablerIcons.IconEgg,
  milk: TablerIcons.IconMilk,
  cheese: TablerIcons.IconCheese,
  fish: TablerIcons.IconFish,
  strawberry: TablerIcons.IconApple,
  orange: TablerIcons.IconApple,
  grapes: TablerIcons.IconApple,
  watermelon: TablerIcons.IconApple,
  lemon: TablerIcons.IconLemon,
  pineapple: TablerIcons.IconApple,
  pasta: TablerIcons.IconSoup,
  pizza: TablerIcons.IconPizza,
  honey: TablerIcons.IconBucketDroplet,
  olive: TablerIcons.IconLeaf,
  peanuts: TablerIcons.IconGrain,
  potato: TablerIcons.IconGrain,
  corn: TablerIcons.IconWheat,
  leafy_green: TablerIcons.IconLeaf,
  salt: TablerIcons.IconSalt,
  poultry: TablerIcons.IconMeat,
  tea: TablerIcons.IconMug,
  water_bottle: TablerIcons.IconBottle,
  thermometer: TablerIcons.IconThermometer,
  lungs: TablerIcons.IconLungs,
  tooth: TablerIcons.IconMoodSmile,
  heart_fire: TablerIcons.IconHeartbeat,
  anatomical_heart: TablerIcons.IconHeartRateMonitor,
  ambulance: TablerIcons.IconAmbulance,
  hospital: TablerIcons.IconBuildingHospital,
  xray: TablerIcons.IconScan,
  goal_net: TablerIcons.IconBallFootball,
  stadium: TablerIcons.IconBuildingStadium,
  chequered_flag: TablerIcons.IconFlag2,
  sports_medal: TablerIcons.IconMedal,
  first_place: TablerIcons.IconAward,
  crown: TablerIcons.IconCrown,
  gem: TablerIcons.IconDiamond,
  laptop: TablerIcons.IconDeviceLaptop,
  mobile: TablerIcons.IconDeviceMobile,
  cloud: TablerIcons.IconCloud,
  paperclip: TablerIcons.IconPaperclip,
  bookmark: TablerIcons.IconBookmark,
  label: TablerIcons.IconTag,
  ledger: TablerIcons.IconFileSpreadsheet,
  newspaper: TablerIcons.IconNews,
  megaphone: TablerIcons.IconSpeakerphone,
  compass: TablerIcons.IconCompass,
  sun: TablerIcons.IconSun,
  moon: TablerIcons.IconMoon,
  seedling: TablerIcons.IconPlant,
  herb: TablerIcons.IconPlant2,
  paint_palette: TablerIcons.IconPalette,
  picture: TablerIcons.IconPhoto,
  balance_scale: TablerIcons.IconScale,
  sliders: TablerIcons.IconAdjustments,
  knobs: TablerIcons.IconAdjustmentsHorizontal,
  ruler: TablerIcons.IconRuler2,
  petri_dish: TablerIcons.IconFlask,
  numbers: TablerIcons.IconCalculator,
  handshake: TablerIcons.IconHeartHandshake,
  busts: TablerIcons.IconUsersGroup,
  speech: TablerIcons.IconMessage,
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
  dropdown = false,
  variant, // 'normal' | '3d' | 'auto'
  tablerComponent,
  ...props
}, ref) {
  if (!name) return null;

  const resolvedName = ALIASES[name] || name;
  const isExplicitNormal = normal || flat || variant === 'normal' || (dropdown && !USE_3D_IN_DROPDOWNS);
  const isExplicit3D = force3d || variant === '3d' || (dropdown && USE_3D_IN_DROPDOWNS);
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
      data-3d-dropdowns={USE_3D_IN_DROPDOWNS ? 'true' : 'false'}
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

export function IconDropdownZone({ children, className = '', ...props }) {
  return (
    <span data-icon-dropdown="true" className={`icon-normal-dropdown ${className}`.trim()} {...props}>
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
export const IconActivity = makeIcon('stopwatch', TablerIcons.IconActivity);
export const IconActivityHeartbeat = makeIcon('heart_fire', TablerIcons.IconActivityHeartbeat);
export const IconHeart = makeIcon('heart', TablerIcons.IconHeart);
export const IconReportMedical = makeIcon('testtube', TablerIcons.IconReportMedical);
export const IconStethoscope = makeIcon('stethoscope', TablerIcons.IconStethoscope);
export const IconDna = makeIcon('dna', TablerIcons.IconDna);
export const IconMicroscope = makeIcon('microscope', TablerIcons.IconMicroscope);
export const IconTestPipe = makeIcon('petri_dish', TablerIcons.IconTestPipe);

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
export const IconWheat = makeIcon('bread', TablerIcons.IconWheat);

// Physical & Metrics
export const IconDroplet = makeIcon('droplet', TablerIcons.IconDroplet);
export const IconFlame = makeIcon('fire', TablerIcons.IconFlame);
export const IconScale = makeIcon('scale', TablerIcons.IconScale);
export const IconRuler2 = makeIcon('ruler', TablerIcons.IconRuler2);
export const IconBed = makeIcon('bed', TablerIcons.IconBed);
export const IconRun = makeIcon('running', TablerIcons.IconRun);
export const IconBarbell = makeIcon('gym', TablerIcons.IconBarbell);
export const IconBatteryCharging = makeIcon('battery', TablerIcons.IconBatteryCharging);
export const IconHourglass = makeIcon('hourglass', TablerIcons.IconHourglass);

// Charts & Analytics
export const IconChartBar = makeIcon('barchart', TablerIcons.IconChartBar);
export const IconChartLine = makeIcon('chart', TablerIcons.IconChartLine);
export const IconReportAnalytics = makeIcon('analiticas', TablerIcons.IconReportAnalytics);
export const IconFileAnalytics = makeIcon('analiticas', TablerIcons.IconFileAnalytics);
export const IconTrendingUp = makeIcon('evolucion', TablerIcons.IconTrendingUp);
export const IconTrophy = makeIcon('trophy', TablerIcons.IconTrophy);

// Users & Squad
export const IconUser = makeIcon('user', TablerIcons.IconUser);
export const IconUserCheck = makeIcon('handshake', TablerIcons.IconUserCheck);
export const IconUserCog = makeIcon('configuracion', TablerIcons.IconUserCog);
export const IconUserPlus = makeIcon('user', TablerIcons.IconUserPlus);
export const IconUserStar = makeIcon('star', TablerIcons.IconUserStar);
export const IconUsers = makeIcon('plantilla', TablerIcons.IconUsers);
export const IconUsersGroup = makeIcon('busts', TablerIcons.IconUsersGroup);

// Calendar & Time
export const IconCalendar = makeIcon('calendar', TablerIcons.IconCalendar);
export const IconCalendarEvent = makeIcon('calendar', TablerIcons.IconCalendarEvent);
export const IconCalendarStats = makeIcon('calendar', TablerIcons.IconCalendarStats);
export const IconClock = makeIcon('alarmclock', TablerIcons.IconClock);
export const IconHistory = makeIcon('hourglass', TablerIcons.IconHistory);

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
export const IconDeviceFloppy = makeIcon('bookmark', TablerIcons.IconDeviceFloppy);
export const IconX = makeIcon('cross', TablerIcons.IconX);
export const IconLogout = makeIcon('cross', TablerIcons.IconLogout);

// Documents & Files
export const IconClipboardList = makeIcon('clipboard', TablerIcons.IconClipboardList);
export const IconDocument = makeIcon('document', TablerIcons.IconFileDescription || TablerIcons.IconFileText);
export const IconFileText = makeIcon('document', TablerIcons.IconFileText);
export const IconFileSpreadsheet = makeIcon('ledger', TablerIcons.IconFileSpreadsheet);
export const IconFileTypePdf = makeIcon('newspaper', TablerIcons.IconFileTypePdf);
export const IconBook = makeIcon('book', TablerIcons.IconBook);
export const IconNotes = makeIcon('spiral_notepad', TablerIcons.IconNotes);
export const IconCardFile = makeIcon('card_file_box', TablerIcons.IconFolders || TablerIcons.IconFolder);
export const IconFolders = makeIcon('card_file_box', TablerIcons.IconFolders);
export const IconCopy = makeIcon('memo', TablerIcons.IconCopy);
export const IconList = makeIcon('menu', TablerIcons.IconList);
export const IconFolderShare = makeIcon('folder', TablerIcons.IconFolderShare);
export const IconDatabase = makeIcon('card_file_box', TablerIcons.IconDatabase);
export const IconDatabaseImport = makeIcon('inbox', TablerIcons.IconDatabaseImport);
export const IconDownload = makeIcon('inbox', TablerIcons.IconDownload);
export const IconInbox = makeIcon('inbox', TablerIcons.IconInbox);
export const IconCloudUpload = makeIcon('outbox', TablerIcons.IconCloudUpload);
export const IconUpload = makeIcon('outbox', TablerIcons.IconUpload);

// Media & Device
export const IconCamera = makeIcon('camera', TablerIcons.IconCamera);
export const IconPhoto = makeIcon('picture', TablerIcons.IconPhoto);
export const IconSearch = makeIcon('search', TablerIcons.IconSearch);
export const IconZoomIn = makeIcon('search', TablerIcons.IconZoomIn);
export const IconZoomOut = makeIcon('search', TablerIcons.IconZoomOut);
export const IconFilter = makeIcon('sliders', TablerIcons.IconFilter);
export const IconSortDescending = makeIcon('chart_down', TablerIcons.IconSortDescending);

// Settings & Security
export const IconSettings = makeIcon('configuracion', TablerIcons.IconSettings);
export const IconLock = makeIcon('lock', TablerIcons.IconLock);
export const IconShield = makeIcon('shield', TablerIcons.IconShield);
export const IconShieldCheck = makeIcon('shield', TablerIcons.IconShieldCheck);
export const IconKey = makeIcon('key', TablerIcons.IconKey);

// Communication & Extras
export const IconMail = makeIcon('envelope', TablerIcons.IconMail);
export const IconSend = makeIcon('rocket', TablerIcons.IconSend);
export const IconBrain = makeIcon('brain', TablerIcons.IconBrain);
export const IconSparkles = makeIcon('sparkles', TablerIcons.IconSparkles);
export const IconPalette = makeIcon('paint_palette', TablerIcons.IconPalette);
export const IconCalculator = makeIcon('numbers', TablerIcons.IconCalculator);
export const IconFlag = makeIcon('flag', TablerIcons.IconFlag);
export const IconExternalLink = makeIcon('link', TablerIcons.IconExternalLink);
export const IconEye = makeIcon('eye', TablerIcons.IconEye);
export const IconBell = makeIcon('bell', TablerIcons.IconBell);
export const IconCookie = makeIcon('cookie', TablerIcons.IconCookie);

// Food (extended)
export const IconBanana = makeIcon('banana', TablerIcons.IconBanana || TablerIcons.IconApple);
export const IconCarrot = makeIcon('carrot', TablerIcons.IconCarrot);
export const IconEgg = makeIcon('egg', TablerIcons.IconEgg);
export const IconMilk = makeIcon('milk', TablerIcons.IconMilk);
export const IconCheese = makeIcon('cheese', TablerIcons.IconCheese);
export const IconFish = makeIcon('fish', TablerIcons.IconFish);
export const IconLemon = makeIcon('lemon', TablerIcons.IconLemon);
export const IconPizza = makeIcon('pizza', TablerIcons.IconPizza);
export const IconLeaf = makeIcon('leafy_green', TablerIcons.IconLeaf);
export const IconPlant = makeIcon('seedling', TablerIcons.IconPlant);
export const IconPlant2 = makeIcon('herb', TablerIcons.IconPlant2);
export const IconSalt = makeIcon('salt', TablerIcons.IconSalt);
export const IconMug = makeIcon('tea', TablerIcons.IconMug);

// Health & Medical (extended)
export const IconThermometer = makeIcon('thermometer', TablerIcons.IconThermometer);
export const IconLungs = makeIcon('lungs', TablerIcons.IconLungs);
export const IconAmbulance = makeIcon('ambulance', TablerIcons.IconAmbulance);
export const IconBuildingHospital = makeIcon('hospital', TablerIcons.IconBuildingHospital);
export const IconScan = makeIcon('xray', TablerIcons.IconScan);
export const IconHeartbeat = makeIcon('heart_fire', TablerIcons.IconHeartbeat);
export const IconHeartRateMonitor = makeIcon('anatomical_heart', TablerIcons.IconHeartRateMonitor);
export const IconFlask = makeIcon('petri_dish', TablerIcons.IconFlask);
export const IconHeartHandshake = makeIcon('handshake', TablerIcons.IconHeartHandshake);

// Sport & Achievements (extended)
export const IconBuildingStadium = makeIcon('stadium', TablerIcons.IconBuildingStadium);
export const IconBallFootball = makeIcon('goal_net', TablerIcons.IconBallFootball);
export const IconFlag2 = makeIcon('chequered_flag', TablerIcons.IconFlag2);
export const IconMedal = makeIcon('sports_medal', TablerIcons.IconMedal);
export const IconAward = makeIcon('first_place', TablerIcons.IconAward);
export const IconCrown = makeIcon('crown', TablerIcons.IconCrown);
export const IconDiamond = makeIcon('gem', TablerIcons.IconDiamond);
export const IconRocket = makeIcon('rocket', TablerIcons.IconRocket);
export const IconTrendingDown = makeIcon('chart_down', TablerIcons.IconTrendingDown);

// Tools, Devices & Misc (extended)
export const IconDeviceLaptop = makeIcon('laptop', TablerIcons.IconDeviceLaptop);
export const IconDeviceMobile = makeIcon('mobile', TablerIcons.IconDeviceMobile);
export const IconCloud = makeIcon('cloud', TablerIcons.IconCloud);
export const IconPaperclip = makeIcon('paperclip', TablerIcons.IconPaperclip);
export const IconBookmark = makeIcon('bookmark', TablerIcons.IconBookmark);
export const IconTag = makeIcon('label', TablerIcons.IconTag);
export const IconNews = makeIcon('newspaper', TablerIcons.IconNews);
export const IconSpeakerphone = makeIcon('megaphone', TablerIcons.IconSpeakerphone);
export const IconMessage = makeIcon('speech', TablerIcons.IconMessage);
export const IconCompass = makeIcon('compass', TablerIcons.IconCompass);
export const IconSun = makeIcon('sun', TablerIcons.IconSun);
export const IconMoon = makeIcon('moon', TablerIcons.IconMoon);
export const IconAdjustments = makeIcon('sliders', TablerIcons.IconAdjustments);
export const IconAdjustmentsHorizontal = makeIcon('knobs', TablerIcons.IconAdjustmentsHorizontal);
