'use client';

import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Anchor,
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Button,
  FileButton,
  TextInput,
  Badge,
  Box,
  Divider,
  Select,
  ThemeIcon,
  Tooltip,
  Grid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendar,
  IconChefHat,
  IconFlame,
  IconToolsKitchen,
  IconUpload,
  IconList,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';
import { BentoCard } from '@/components/Bento/BentoItem';

// Standard Spanish weekday names to match database records
const WEEKDAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatWeek(value) {
  if (!value) return 'Sin semana';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function getDayDate(weekStr, dayName) {
  if (!weekStr) return null;
  try {
    const date = new Date(`${weekStr}T00:00:00`);
    const offset = WEEKDAY_ORDER.indexOf(dayName);
    if (offset === -1) return null;
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch (e) {
    return null;
  }
}

function isToday(dayName) {
  try {
    const todayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
    const cleanStr = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return cleanStr(dayName) === cleanStr(todayName);
  } catch (e) {
    return false;
  }
}

function getTodayIndex() {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  return day === 0 ? 6 : day - 1; // Map Lunes to 0, Domingo to 6
}

function AgendaDishLine({ label, value }) {
  if (!value || value.toLowerCase() === 'sin registrar') return null;
  const options = value.split(/\s*\/\s*/);
  return (
    <Group gap={6} align="flex-start" wrap="nowrap">
      <Text size="xs" c="dimmed" fw={850} style={{ flex: '0 0 16px', fontSize: '9px', paddingTop: '2px' }}>
        {label}
      </Text>
      <Stack gap={2} style={{ flex: 1 }}>
        {options.map((opt, idx) => (
          <Text key={idx} size="xs" fw={600} c="dark.4" style={{ lineHeight: 1.3 }}>
            {opt}
          </Text>
        ))}
      </Stack>
    </Group>
  );
}

function AgendaDayRow({ dayData, weekStr }) {
  const isDayToday = isToday(dayData.dia);
  const dayCalendarDate = getDayDate(weekStr, dayData.dia);

  return (
    <Paper
      p="md"
      radius="md"
      bg={isDayToday ? 'teal.0' : 'gray.0'}
      withBorder
      style={{
        borderColor: isDayToday ? 'var(--mantine-color-teal-2)' : 'var(--mantine-color-gray-2)',
        transition: 'all 0.2s ease',
      }}
    >
      <Grid gutter="md" align="flex-start">
        {/* Day Column */}
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Stack gap={2}>
            <Group gap="xs" align="center" wrap="nowrap">
              {isDayToday && (
                <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--mantine-color-teal-5)', flexShrink: 0 }} />
              )}
              <Text fw={800} size="sm" c={isDayToday ? 'teal.8' : 'dark.4'} lh={1.1}>
                {dayData.dia}
              </Text>
              {isDayToday && (
                <Badge color="teal" variant="filled" size="xs" radius="xl" ml="auto">
                  HOY
                </Badge>
              )}
            </Group>
            {dayCalendarDate && (
              <Text size="xs" c="dimmed" fw={600} pl={isDayToday ? 14 : 0}>
                {dayCalendarDate}
              </Text>
            )}
          </Stack>
        </Grid.Col>

        {/* Comida Column */}
        <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
          <Stack gap={4}>
            <Text size="xs" fw={700} c="orange.7" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
              Comida
            </Text>
            <Stack gap={4}>
              {dayData.comida?.primero && <AgendaDishLine label="1º" value={dayData.comida.primero} />}
              {dayData.comida?.segundo && <AgendaDishLine label="2º" value={dayData.comida.segundo} />}
              {dayData.comida?.postre && <AgendaDishLine label="P" value={dayData.comida.postre} />}
              {!dayData.comida?.primero && !dayData.comida?.segundo && (
                <Text size="xs" c="gray.4" italic>Sin registrar</Text>
              )}
            </Stack>
          </Stack>
        </Grid.Col>

        {/* Cena Column */}
        <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
          <Stack gap={4}>
            <Text size="xs" fw={700} c="blue.7" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
              Cena
            </Text>
            <Stack gap={4}>
              {dayData.cena?.primero && <AgendaDishLine label="1º" value={dayData.cena.primero} />}
              {dayData.cena?.segundo && <AgendaDishLine label="2º" value={dayData.cena.segundo} />}
              {dayData.cena?.postre && <AgendaDishLine label="P" value={dayData.cena.postre} />}
              {!dayData.cena?.primero && !dayData.cena?.segundo && (
                <Text size="xs" c="gray.4" italic>Sin registrar</Text>
              )}
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}

function HeroDishSection({ title, label, value, color }) {
  if (!value || value.toLowerCase() === 'sin registrar') {
    return (
      <Stack gap={2}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
          {title}
        </Text>
        <Text size="sm" c="gray.4" italic fw={400}>
          Sin registrar
        </Text>
      </Stack>
    );
  }

  const options = value.split(/\s*\/\s*/);

  return (
    <Stack gap={6}>
      <Group gap="xs" align="center">
        <ThemeIcon color={color} variant="light" size={18} radius="md">
          <Text size="xs" fw={800} style={{ fontSize: '9px' }}>{label}</Text>
        </ThemeIcon>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
          {title}
        </Text>
      </Group>

      <Stack gap={4} pl={26}>
        {options.map((opt, idx) => (
          <Group key={idx} gap="xs" align="flex-start" wrap="nowrap">
            <Text size="sm" fw={600} c="dark.4" style={{ overflowWrap: 'anywhere', lineHeight: 1.4 }}>
              {opt}
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

function DaySelectorButton({ dayName, isSelected, isHoy, dateStr, onClick }) {
  return (
    <Paper
      onClick={onClick}
      radius="md"
      p="xs"
      withBorder
      style={{
        flex: 1,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
        borderColor: isSelected
          ? 'var(--mantine-color-dark-8)'
          : isHoy
            ? 'var(--mantine-color-teal-3)'
            : 'var(--mantine-color-gray-2)',
        boxShadow: isSelected ? '0 4px 10px rgba(0, 0, 0, 0.08)' : 'none',
        transform: isSelected ? 'translateY(-1px)' : 'none',
      }}
    >
      <Stack gap={2} align="center">
        {isHoy && (
          <Box style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: isSelected ? 'var(--mantine-color-teal-3)' : 'var(--mantine-color-teal-5)'
          }} />
        )}
        {!isHoy && <Box style={{ height: 4 }} />}

        <Text
          size="xs"
          fw={700}
          tt="uppercase"
          c={isSelected ? 'gray.3' : 'dimmed'}
          style={{ letterSpacing: '0.5px', fontSize: '9px' }}
        >
          {dayName.slice(0, 3)}
        </Text>
        <Text
          size="md"
          fw={900}
          lh={1.1}
          c={isSelected ? 'white' : 'dark.4'}
        >
          {dateStr ? dateStr.split(' ')[0] : ''}
        </Text>
        <Text
          size="xs"
          fw={600}
          c={isSelected ? 'gray.4' : 'dimmed'}
          style={{ fontSize: '9px' }}
        >
          {dateStr ? dateStr.split(' ')[1] : ''}
        </Text>
      </Stack>
    </Paper>
  );
}

export default function MenuSemanal({ menusIniciales, isSubtab = false, readOnly = false }) {
  const [menus, setMenus] = useState(menusIniciales);
  const [selectedMenu, setSelectedMenu] = useState(menusIniciales[0] || null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('diaria'); // 'diaria' or 'semanal'
  const [activeDay, setActiveDay] = useState('');
  const [weekDate, setWeekDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const orderedDays = selectedMenu ? [...selectedMenu.dias].sort((a, b) => WEEKDAY_ORDER.indexOf(a.dia) - WEEKDAY_ORDER.indexOf(b.dia)) : [];
  const weekOptions = menus.map((menu) => ({
    value: menu.semana,
    label: `Semana del ${formatWeek(menu.semana)}`,
  }));

  useEffect(() => {
    setMenus(menusIniciales);
    setSelectedMenu(prev => {
      const updated = prev && menusIniciales.some(m => m.semana === prev.semana)
        ? menusIniciales.find(m => m.semana === prev.semana)
        : menusIniciales[0] || null;
      return updated;
    });
  }, [menusIniciales]);

  useEffect(() => {
    if (orderedDays.length > 0) {
      const todayIdx = getTodayIndex();
      const todayName = WEEKDAY_ORDER[todayIdx];
      const hasToday = orderedDays.some(d => d.dia === todayName);
      if (hasToday) {
        setActiveDay(todayName);
      } else {
        setActiveDay(orderedDays[0].dia);
      }
    }
  }, [selectedMenu]);

  async function handleUploadFile(file) {
    if (!file) return;
    setUploading(true);
    const notificationId = 'menu-semanal-upload';
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'IA procesando',
      message: 'La IA está leyendo e indexando el menú.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('semana', weekDate);

      const res = await fetch('/api/menu-semanal', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');

      setMenus(prev => {
        const filtered = prev.filter(m => m.semana !== data.menu.semana);
        return [data.menu, ...filtered].sort((a, b) => b.semana.localeCompare(a.semana));
      });
      setSelectedMenu(data.menu);
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Menú actualizado',
        message: 'El menú semanal se ha procesado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'Error al subir menú',
        message: e.message,
        loading: false,
        autoClose: 5000,
        withCloseButton: true,
      });
    } finally {
      setUploading(false);
    }
  }

  const activeDayData = orderedDays.find((d) => d.dia === activeDay) || null;

  // Render hero view for selected day using BentoCard
  const renderHeroDay = (dayData) => {
    if (!dayData) return null;

    return (
      <Grid gutter="md" align="stretch" mt="xs">
        {/* Comida Bento Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <BentoCard title="Almuerzo / Comida" icon={IconToolsKitchen} color="orange">
            <Stack gap="md" mt="xs">
              <HeroDishSection title="Primer Plato" label="1º" value={dayData.comida?.primero} color="orange" />
              <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
              <HeroDishSection title="Segundo Plato" label="2º" value={dayData.comida?.segundo} color="orange" />
              {dayData.comida?.postre && (
                <>
                  <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
                  <HeroDishSection title="Postre / Fruta" label="P" value={dayData.comida.postre} color="orange" />
                </>
              )}
            </Stack>
          </BentoCard>
        </Grid.Col>

        {/* Cena Bento Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <BentoCard title="Cena del Equipo" icon={IconFlame} color="blue">
            <Stack gap="md" mt="xs">
              <HeroDishSection title="Primer Plato" label="1º" value={dayData.cena?.primero} color="blue" />
              <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
              <HeroDishSection title="Segundo Plato" label="2º" value={dayData.cena?.segundo} color="blue" />
              {dayData.cena?.postre && (
                <>
                  <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
                  <HeroDishSection title="Postre / Fruta" label="P" value={dayData.cena.postre} color="blue" />
                </>
              )}
            </Stack>
          </BentoCard>
        </Grid.Col>
      </Grid>
    );
  };

  const renderCompactHeader = () => (
    <Paper
      p={{ base: 'sm', sm: 'md' }}
      shadow="xs"
      radius="lg"
      withBorder
      style={{
        borderTop: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      }}
      bg="white"
    >
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Group gap="xs">
          <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
            <IconChefHat size={20} />
          </ThemeIcon>
          <Stack gap={2}>
            <Title order={3} fw={800} c="dark.4">Menú comedor</Title>
            <Text size="sm" c="dimmed">
              Comedor del primer equipo, comida y cena.
            </Text>
          </Stack>
        </Group>

        <Group gap="xs" align="center">
          <Select
            placeholder="Selecciona una semana"
            leftSection={<IconCalendar size={14} style={{ opacity: 0.7 }} />}
            data={weekOptions}
            value={selectedMenu?.semana || null}
            onChange={(value) => {
              const next = menus.find((menu) => menu.semana === value);
              if (next) setSelectedMenu(next);
            }}
            disabled={menus.length === 0}
            variant="filled"
            radius="xl"
            size="xs"
            allowDeselect={false}
            style={{ width: 180 }}
          />

          {/* Premium Micro-segmented Pill Switcher */}
          <Group gap={4} p={3} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-xl)', border: '1px solid var(--mantine-color-gray-2)' }}>
            <Tooltip label="Día a Día (Vista diaria)" withArrow>
              <ActionIcon
                onClick={() => setViewMode('diaria')}
                variant={viewMode === 'diaria' ? 'filled' : 'transparent'}
                color={viewMode === 'diaria' ? 'dark' : 'gray'}
                radius="xl"
                size="sm"
                style={{ width: 28, height: 28 }}
              >
                <IconCalendar size={14} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Semana completa (Vista general)" withArrow>
              <ActionIcon
                onClick={() => setViewMode('semanal')}
                variant={viewMode === 'semanal' ? 'filled' : 'transparent'}
                color={viewMode === 'semanal' ? 'dark' : 'gray'}
                radius="xl"
                size="sm"
                style={{ width: 28, height: 28 }}
              >
                <IconList size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Group>
    </Paper>
  );

  return (
    <Stack gap={0}>
      {isSubtab ? (
        renderCompactHeader()
      ) : (
        <Paper
          p={{ base: 'sm', sm: 'md' }}
          shadow="sm"
          radius="xl"
          withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
            zIndex: 10,
            position: 'relative',
          }}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
              <Group gap="sm" wrap="nowrap">
                <Tooltip label="Volver al panel" withArrow>
                  <ActionIcon component={Anchor} href="/dashboard" variant="light" color="gray" radius="xl" size={42}>
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                </Tooltip>
                <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
                  <IconChefHat size={20} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Title order={3} fw={800} c="dark.4">Menú comedor</Title>
                  <Text size="sm" c="dimmed">
                    Comedor del primer equipo, comida y cena.
                  </Text>
                </Stack>
              </Group>

              <Group align="center" gap="xs" wrap="wrap">
                <Select
                  placeholder="Selecciona una semana"
                  leftSection={<IconCalendar size={14} style={{ opacity: 0.7 }} />}
                  data={weekOptions}
                  value={selectedMenu?.semana || null}
                  onChange={(value) => {
                    const next = menus.find((menu) => menu.semana === value);
                    if (next) setSelectedMenu(next);
                  }}
                  disabled={menus.length === 0}
                  variant="filled"
                  radius="xl"
                  size="xs"
                  allowDeselect={false}
                  style={{ width: 180 }}
                />

                {/* Premium Micro-segmented Pill Switcher */}
                <Group gap={4} p={3} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-xl)', border: '1px solid var(--mantine-color-gray-2)' }}>
                  <Tooltip label="Día a Día (Vista diaria)" withArrow>
                    <ActionIcon
                      onClick={() => setViewMode('diaria')}
                      variant={viewMode === 'diaria' ? 'filled' : 'transparent'}
                      color={viewMode === 'diaria' ? 'dark' : 'gray'}
                      radius="xl"
                      size="sm"
                      style={{ width: 28, height: 28 }}
                    >
                      <IconCalendar size={14} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Semana completa (Vista general)" withArrow>
                    <ActionIcon
                      onClick={() => setViewMode('semanal')}
                      variant={viewMode === 'semanal' ? 'filled' : 'transparent'}
                      color={viewMode === 'semanal' ? 'dark' : 'gray'}
                      radius="xl"
                      size="sm"
                      style={{ width: 28, height: 28 }}
                    >
                      <IconList size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Group>
          </Stack>
        </Paper>
      )}

      <Box py={{ base: 'sm', sm: 'md' }} px={isSubtab ? { base: 'sm', sm: 0 } : undefined}>
        <Stack gap="md">
          {/* Admin Coach Upload Bar (Only shown on the main weekly menu page /dashboard/menu, never in the player's profile subtab) */}
          {!readOnly && !isSubtab && (
            <Paper p="sm" radius="md" bg="gray.0" withBorder style={{ borderStyle: 'dashed' }}>
              <Group justify="space-between" align="center" gap="xs" wrap="wrap">
                <Text size="xs" fw={700} c="dimmed">
                  SUBIR O ACTUALIZAR PLANIFICACIÓN DE MENÚ:
                </Text>
                <Group gap="xs">
                  <TextInput
                    type="date"
                    value={weekDate}
                    onChange={(e) => setWeekDate(e.target.value)}
                    leftSection={<IconCalendar size={14} />}
                    size="xs"
                    radius="xl"
                    variant="filled"
                    style={{ width: 135 }}
                  />
                  <FileButton onChange={handleUploadFile} accept="image/*,.pdf" disabled={uploading}>
                    {(props) => (
                      <Button
                        {...props}
                        loading={uploading}
                        radius="xl"
                        leftSection={<IconUpload size={12} />}
                        color="blue"
                        radius="xl"
                        size="xs"
                      >
                        Subir PDF / Imagen
                      </Button>
                    )}
                  </FileButton>
                </Group>
              </Group>
            </Paper>
          )}

          {selectedMenu ? (
            <Stack gap="md">
              {!isSubtab && viewMode === 'semanal' && (
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                  <Box>
                    <Title order={4} fw={800} c="dark.4">
                      Semana del {formatWeek(selectedMenu.semana)}
                    </Title>
                    <Text size="xs" c="dimmed">
                      Platos extraídos y estructurados para planificación nutritional.
                    </Text>
                  </Box>
                </Group>
              )}

              {viewMode === 'diaria' ? (
                <Stack gap="md">
                  {/* Timeline Selector */}
                  <Group gap="xs" justify="stretch" wrap="nowrap" style={{ width: '100%', overflowX: 'auto' }}>
                    {orderedDays.map((dia) => (
                      <DaySelectorButton
                        key={dia.dia}
                        dayName={dia.dia}
                        isSelected={activeDay === dia.dia}
                        isHoy={isToday(dia.dia)}
                        dateStr={getDayDate(selectedMenu.semana, dia.dia)}
                        onClick={() => setActiveDay(dia.dia)}
                      />
                    ))}
                  </Group>

                  {/* Hero Active Day Menu using native BentoCard */}
                  {renderHeroDay(activeDayData)}
                </Stack>
              ) : (
                /* Weekly Agenda View in Native App Style */
                <Stack gap="sm">
                  {orderedDays.map(dia => (
                    <AgendaDayRow key={dia.dia} dayData={dia} weekStr={selectedMenu.semana} />
                  ))}
                </Stack>
              )}
            </Stack>
          ) : (
            <NothingFound
              withPaper
              icon={IconToolsKitchen}
              title="Sin menús"
              description="No hay menús registrados. Sube la foto o PDF del menú de esta semana para empezar."
            />
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
