'use client';

import { useState, useMemo } from 'react';
import { 
  Box, 
  Group, 
  Paper, 
  SimpleGrid, 
  Stack, 
  Text, 
  ThemeIcon, 
  Title,
  SegmentedControl,
  Table,
  Badge,
  Select,
  Button
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClipboardList, IconTargetArrow, IconUser, IconInfoCircle, IconCalendar, IconDownload } from '@tabler/icons-react';
import { cunninghamPlan } from '@/lib/calculations';
import { CampoEditable } from '../editable';
import { latestMetricValue } from '@/lib/player-metrics';

function filenameFromResponse(response, fallback) {
  const header = response.headers.get('Content-Disposition') || '';
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

const NUM_COMIDAS = [
  { value: '3', label: '3 comidas' },
  { value: '4', label: '4 comidas' },
  { value: '5', label: '5 comidas' },
  { value: '6', label: '6 comidas' },
  { value: '7', label: '7 comidas' },
];

function StatCard({ label, value, order = 2, subtext }) {
  return (
    <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm" bg="white">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
      <Title order={order} mt={5} c="dark.4">{value || '-'}</Title>
      {subtext && <Text size="xs" c="dimmed" mt={4}>{subtext}</Text>}
    </Paper>
  );
}

function formatWeek(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export default function PerfilSubtab({ jugador, evoluciones = [], informes = [], readOnly = false }) {
  const [selectedWeek, setSelectedWeek] = useState(informes[0]?.semana || null);
  const [downloading, setDownloading] = useState(false);

  const selectedInforme = useMemo(() => {
    return informes.find((info) => info.semana === selectedWeek) || null;
  }, [informes, selectedWeek]);

  const weekOptions = useMemo(() => {
    return informes.map((info) => ({
      value: info.semana,
      label: `Semana ${formatWeek(info.semana)}`,
    }));
  }, [informes]);

  async function handleDownloadPDF() {
    if (!selectedInforme) return;

    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/weekly-squad?semana=${encodeURIComponent(selectedInforme.semana)}&jugadorId=${jugador.id}&teamId=${jugador.equipo_id}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo descargar el informe PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameFromResponse(
        res,
        `Informe_${selectedInforme.meta?.title || 'Semanal'}_${jugador.nombre || 'Jugador'}.pdf`
      );
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notifications.show({
        color: 'green',
        title: 'Informe PDF listo',
        message: 'El informe individual se ha descargado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error de descarga',
        message: e.message,
      });
    } finally {
      setDownloading(false);
    }
  }
  const pesoActual = latestMetricValue(evoluciones, 'peso_kg', jugador?.peso_kg);
  const grasaActual = latestMetricValue(evoluciones, 'porcentaje_grasa', jugador?.porcentaje_grasa);
  const masaMagraActual = latestMetricValue(evoluciones, 'masa_magra_kg', jugador?.masa_magra_kg);
  const weightKg = Number(pesoActual || 0);

  const dayTypes = [
    { value: 'descanso', label: 'Descanso', factor: 1.2, color: 'blue' },
    { value: 'recuperacion', label: 'Recuperación', factor: 1.4, color: 'teal' },
    { value: 'entreno', label: 'Entrenamiento', factor: 1.6, color: 'green' },
    { value: 'doble', label: 'Doble sesión', factor: 1.75, color: 'orange' },
    { value: 'partido', label: 'Partido', factor: 1.9, color: 'red' },
  ];

  // Map configured factor_actividad to nearest dayType segment
  const defaultDiaType = useMemo(() => {
    const f = Number(jugador.factor_actividad || 1.6);
    if (f <= 1.3) return 'descanso';
    if (f <= 1.5) return 'recuperacion';
    if (f <= 1.7) return 'entreno';
    if (f <= 1.8) return 'doble';
    return 'partido';
  }, [jugador.factor_actividad]);

  const [activeDayType, setActiveDayType] = useState(defaultDiaType);

  // Pre-calculate plans for all day types using Cunningham formula
  const plans = useMemo(() => {
    const out = {};
    dayTypes.forEach(dt => {
      out[dt.value] = weightKg ? cunninghamPlan({
        weightKg,
        bodyFatPct: grasaActual ? Number(grasaActual) : null,
        leanMassKg: masaMagraActual ? Number(masaMagraActual) : null,
        activityFactor: dt.factor,
      }) : null;
    });
    return out;
  }, [weightKg, grasaActual, masaMagraActual]);

  const currentPlan = plans[activeDayType];
  const isDefaultFactorType = activeDayType === defaultDiaType;

  // Use manual override if it exists and we are looking at the default factor day type
  const hasManualOverride = Boolean(
    isDefaultFactorType && 
    (jugador.kcal_objetivo || jugador.proteina_objetivo_g || jugador.cho_objetivo_g || jugador.grasa_objetivo_g)
  );

  const kcal = (isDefaultFactorType && jugador.kcal_objetivo) || currentPlan?.kcal || '-';
  const protein = (isDefaultFactorType && jugador.proteina_objetivo_g) || currentPlan?.protein || null;
  const cho = (isDefaultFactorType && jugador.cho_objetivo_g) || currentPlan?.cho || null;
  const fat = (isDefaultFactorType && jugador.grasa_objetivo_g) || currentPlan?.fat || null;

  return (
    <Stack gap={0}>
      {/* Tab Header Banner */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        bg="white"
        shadow="xs"
        radius="lg"
        withBorder
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
              <IconUser size={20} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={800} c="dark.4">Perfil del jugador</Title>
              <Text size="sm" c="dimmed">
                {readOnly ? 'Objetivos y pautas semanales.' : 'Objetivos, preferencias y ajustes individuales.'}
              </Text>
            </Box>
          </Group>

          {informes.length > 0 && (
            <Group gap="xs" align="center">
              <Select
                placeholder="Selecciona una semana"
                leftSection={<IconCalendar size={14} style={{ opacity: 0.7 }} />}
                data={weekOptions}
                value={selectedWeek}
                onChange={setSelectedWeek}
                variant="filled"
                radius="xl"
                size="xs"
                allowDeselect={false}
                style={{ width: 220 }}
              />
              <Button
                leftSection={<IconDownload size={14} />}
                radius="xl"
                size="xs"
                onClick={handleDownloadPDF}
                loading={downloading}
              >
                Descargar informe PDF
              </Button>
            </Group>
          )}
        </Group>
      </Paper>
 
      {/* Content wrapper */}
      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap="md">
          {/* Nutritional Objectives Card */}
          <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start" wrap="wrap" mb="md" gap="md">
              <Group gap="xs">
                <ThemeIcon color="green" variant="light" radius="xl" size="lg">
                  <IconTargetArrow size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={3} fw={800} c="dark.4">Objetivos nutricionales</Title>
                  <Text size="sm" c="dimmed">
                    Cálculo dinámico de requerimientos de acuerdo a la exigencia de cada día.
                  </Text>
                </Box>
              </Group>

              {hasManualOverride && (
                <Badge color="yellow" variant="light" size="md" leftSection={<IconInfoCircle size={14} />}>
                  Objetivo manual activo para este día
                </Badge>
              )}
            </Group>

            {/* Day Type selector Segmented Control */}
            <Box mb="md" bg="gray.0" p="xs" style={{ borderRadius: '12px' }}>
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">Tipo de Día (Factor de actividad)</Text>
              <SegmentedControl
                value={activeDayType}
                onChange={setActiveDayType}
                data={dayTypes.map(dt => ({
                  value: dt.value,
                  label: `${dt.label} (${dt.factor})`
                }))}
                fullWidth
                radius="md"
                color="blue"
                styles={{
                  root: { backgroundColor: 'var(--mantine-color-gray-1)' }
                }}
              />
            </Box>
 
            {/* Macro Objectives Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <StatCard 
                label="Kcal objetivo" 
                value={kcal ? `${kcal} kcal` : '-'} 
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
              <StatCard 
                label="Proteína" 
                value={protein ? `${protein}g` : '-'} 
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
              <StatCard 
                label="Carbohidratos (CHO)" 
                value={cho ? `${cho}g` : '-'} 
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
              <StatCard 
                label="Grasa" 
                value={fat ? `${fat}g` : '-'} 
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
            </SimpleGrid>
          </Paper>
 
          {/* Preferences and Context card (Only visible to professionals, unless player is readOnly) */}
          {!readOnly && (
            <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
              <Group gap="xs" mb="md">
                <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
                  <IconClipboardList size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={3} fw={800} c="dark.4">Preferencias y contexto</Title>
                  <Text size="sm" c="dimmed">
                    Información que condiciona el plan nutricional.
                  </Text>
                </Box>
              </Group>
 
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <CampoEditable label="Número de comidas diarias" campo="num_comidas" valor={String(jugador.num_comidas || '5')} jugadorId={jugador.id} tipo="select" opciones={NUM_COMIDAS} readOnly={readOnly} />
                <CampoEditable label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="text" readOnly={readOnly} />
                <CampoEditable label="Gustos y preferencias" campo="gustos_preferencias" valor={jugador.gustos_preferencias || ''} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable label="Aversiones" campo="aversiones" valor={jugador.aversiones || ''} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable label="Intolerancias" campo="intolerancias" valor={jugador.intolerancias || ''} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable label="Alergias" campo="alergias" valor={jugador.alergias || ''} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable label="Contexto clínico" campo="contexto_clinico" valor={jugador.contexto_clinico || ''} jugadorId={jugador.id} readOnly={readOnly} />
              </SimpleGrid>
            </Paper>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
