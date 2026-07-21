import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Stack,
  Group,
  Text,
  Paper,
  ThemeIcon,
  SimpleGrid,
  TextInput,
  Select,
  Button,
  Textarea,
  Checkbox,
  ScrollArea,
  Switch,
  SegmentedControl,
  Badge,
} from '@mantine/core';
import {
  IconFileText,
  IconCalendar,
  IconChefHat,
  IconCalendarEvent,
  IconUsers,
  IconBook,
  IconDownload,
  IconSettings,
  IconSparkles,
  IconTrophy,
} from '@tabler/icons-react';

const SQUAD_GENERATION_MESSAGES = [
  "Iniciando procesamiento de plantilla...",
  "Cargando métricas físicas y composición corporal...",
  "Analizando hábitos de hidratación y osmolaridad...",
  "Obteniendo asignaciones del catálogo de suplementación...",
  "Sincronizando menú semanal del buffet del club...",
  "Generando recomendaciones nutricionales adaptadas...",
  "Optimizando distribución de macronutrientes por tipo de día...",
  "Diseñando maquetación y reglas del PDF final...",
  "Compilando informe completo en formato A4..."
];

const DAYS_OF_WEEK = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

function getWeekRangeLabel(mondayInput) {
  if (!mondayInput) return '';
  const monday = mondayInput instanceof Date ? mondayInput : new Date(`${mondayInput}T00:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const mondayDay = monday.getDate();
  const mondayMonth = months[monday.getMonth()];
  const sundayDay = sunday.getDate();
  const sundayMonth = months[sunday.getMonth()];

  if (monday.getMonth() === sunday.getMonth()) {
    return `Semana ${mondayDay}-${sundayDay} ${sundayMonth}`;
  } else {
    return `Semana ${mondayDay} ${mondayMonth} - ${sundayDay} ${sundayMonth}`;
  }
}

function AiGenerationOverlay({ opened, messages = [], progress }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!opened) {
      setIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [opened, messages.length]);

  if (!opened) return null;

  const hasProgress = progress && typeof progress.current === 'number';
  const percentage = hasProgress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      borderRadius: 'var(--mantine-radius-lg)',
      display: 'block',
    }}>
      <div style={{
        position: 'sticky',
        top: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(34, 139, 230, 0.35)',
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}>
            <IconSparkles size={32} color="white" style={{ animation: 'spinSlow 6s infinite linear' }} />
          </div>
        </div>

        <Text fw={800} size="lg" variant="gradient" gradient={{ from: 'blue.6', to: 'grape.6', deg: 135 }} mb="xs">
          Generando Planificación Inteligente
        </Text>

        {hasProgress ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '380px', marginTop: '0.5rem' }}>
            <Text size="sm" fw={650} c="gray.7" mb="xs" style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              Procesando: <span style={{ color: 'var(--mantine-color-blue-6)', fontWeight: 800 }}>{progress.currentPlayerName}</span>
            </Text>
            <Text size="md" fw={800} c="dark" mb="sm">
              {progress.current} de {progress.total} jugadores ({percentage}%)
            </Text>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: '4px', overflow: 'hidden', position: 'relative', marginBottom: '1rem' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))',
                width: `${percentage}%`,
                transition: 'width 0.4s ease-in-out',
              }} />
            </div>
            <Text size="xs" c="dimmed" fw={500} style={{ minHeight: '24px', fontStyle: 'italic' }}>
              {messages[index]}
            </Text>
          </div>
        ) : (
          <>
            <Text size="sm" c="dimmed" fw={500} style={{ minHeight: '24px' }}>
              {messages[index]}
            </Text>

            <div style={{ width: '150px', height: '4px', backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: '2px', marginTop: '1.5rem', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))',
                width: '100%',
                animation: 'loadingProgress 2s infinite ease-in-out',
              }} />
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 20px rgba(34, 139, 230, 0.35); }
          50% { transform: scale(1.08); box-shadow: 0 8px 30px rgba(156, 54, 181, 0.5); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loadingProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      ` }} />
    </div>
  );
}

export default function SquadReportModal({
  opened,
  onClose,
  reportModal,
  generatingReport,
  reportProgress,
  reportForm,
  updateReportField,
  availableMenus,
  selectedMenuWeek,
  setSelectedMenuWeek,
  showAdvanced,
  setShowAdvanced,
  dayTypeOptions,
  updateCalendarioDay,
  selectedPlayerIds,
  setSelectedPlayerIds,
  playersState,
  generateReport
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFileText size={22} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Stack gap={0}>
            <Text fw={800} size="md">
              {reportModal.player ? `Informe de ${reportModal.player.nombre}` : 'Informe semanal de plantilla'}
            </Text>
            <Text size="xs" c="dimmed">
              Configuración del plan y la estructura de la semana
            </Text>
          </Stack>
        </Group>
      }
      size="1000px"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Box style={{ position: 'relative', minHeight: generatingReport ? '450px' : 'auto' }}>
        <AiGenerationOverlay opened={generatingReport} messages={SQUAD_GENERATION_MESSAGES} progress={reportProgress} />
        <Stack gap="md">
          {/* Panel 1: Datos de la Semana */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(231, 245, 255, 0.35)', borderColor: '#a5d8ff' }}>
            <Group gap="xs" mb="xs">
              <ThemeIcon color="blue" size="sm" radius="xl" variant="light">
                <IconCalendar size={14} />
              </ThemeIcon>
              <Text fw={700} size="sm" c="blue.9">Configuración de la Semana</Text>
            </Group>

            <Stack gap="sm">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <TextInput
                  type="date"
                  label="Fecha de la semana (Lunes)"
                  value={reportForm.semana}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    updateReportField('semana', val);
                    if (val) {
                      updateReportField('title', getWeekRangeLabel(val));
                    }
                    const match = availableMenus.find((m) => m.semana === val);
                    if (match) {
                      setSelectedMenuWeek(match.semana);
                      updateReportField('semanaMenu', match.semana);
                    }
                  }}
                />
                <TextInput
                  label="Título de semana"
                  value={reportForm.title}
                  onChange={(event) => updateReportField('title', event.currentTarget.value)}
                />
              </SimpleGrid>

              <Box>
                <Button
                  variant="subtle"
                  size="xs"
                  color="blue"
                  leftSection={<IconSettings size={14} />}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ paddingLeft: 0 }}
                >
                  {showAdvanced ? 'Ocultar configuración avanzada ▲' : 'Mostrar configuración avanzada ▼'}
                </Button>

                {showAdvanced && (
                  <Paper withBorder p="md" radius="md" mt="xs" style={{ background: '#ffffff', borderColor: '#e9ecef' }}>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                      <TextInput
                        label="Subtítulo"
                        value={reportForm.subtitle}
                        onChange={(event) => updateReportField('subtitle', event.currentTarget.value)}
                      />
                      <TextInput
                        label="Club / equipo"
                        value={reportForm.team}
                        onChange={(event) => updateReportField('team', event.currentTarget.value)}
                      />
                      <TextInput
                        label="Autor / firma"
                        value={reportForm.author}
                        onChange={(event) => updateReportField('author', event.currentTarget.value)}
                      />
                      <TextInput
                        label="Handle / contacto"
                        value={reportForm.handle}
                        onChange={(event) => updateReportField('handle', event.currentTarget.value)}
                      />
                    </SimpleGrid>
                  </Paper>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* Panel 2: Menú del Buffet Comedor */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(230, 252, 245, 0.35)', borderColor: '#96f2d7' }}>
            <Group gap="xs" mb="xs">
              <ThemeIcon color="teal" size="sm" radius="xl" variant="light">
                <IconChefHat size={14} />
              </ThemeIcon>
              <Text fw={700} size="sm" c="teal.9">Menú del Buffet Comedor</Text>
            </Group>

            <Box>
              <Select
                label="Menú del comedor a sincronizar"
                placeholder="Selecciona una semana..."
                value={selectedMenuWeek}
                onChange={(val) => {
                  setSelectedMenuWeek(val || '');
                  updateReportField('semanaMenu', val || '');
                }}
                data={[
                  { value: 'none', label: 'Sin menú comedor (Libertad total para la IA)' },
                  ...availableMenus.map((m) => ({
                    value: m.semana,
                    label: `Menú de la semana del ${m.semana}`,
                  }))
                ]}
                allowDeselect={false}
              />
            </Box>
          </Paper>

          {/* Panel 3: Tipos de Día */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(243, 240, 246, 0.4)', borderColor: '#e1dbec' }}>
            <Group gap="xs" mb="xs">
              <ThemeIcon color="grape" size="sm" radius="xl" variant="light">
                <IconCalendarEvent size={14} />
              </ThemeIcon>
              <Text fw={700} size="sm" c="grape.9">Planificación del Tipo de Día</Text>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {DAYS_OF_WEEK.map((day) => (
                <Select
                  key={day.key}
                  label={day.label}
                  value={reportForm.calendario?.[day.key] || 'entreno'}
                  onChange={(val) => updateCalendarioDay(day.key, val)}
                  data={dayTypeOptions}
                  size="sm"
                />
              ))}
            </SimpleGrid>
          </Paper>

          {/* Panel 3.5: Comidas 24h Pre-Partido */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(231, 245, 255, 0.4)', borderColor: '#74c0fc' }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <ThemeIcon color="blue" size="sm" radius="xl" variant="light">
                  <IconTrophy size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="blue.9">Comidas 24h Pre-Partido</Text>
              </Group>
              <Switch
                checked={reportForm.preMatchConfig?.enabled || false}
                onChange={(e) => {
                  const isChecked = Boolean(e?.currentTarget?.checked);
                  updateReportField('preMatchConfig', {
                    ...(reportForm.preMatchConfig || {}),
                    enabled: isChecked,
                    horario: reportForm.preMatchConfig?.horario || 'tarde',
                    texto: reportForm.preMatchConfig?.texto || '',
                  });
                }}
                label="Especificar comidas 24h antes para la plantilla"
                size="xs"
              />
            </Group>

            {reportForm.preMatchConfig?.enabled && (
              <Stack gap="sm" mt="xs">
                {DAYS_OF_WEEK.filter((d) => reportForm.calendario?.[d.key] === 'partido').length > 0 ? (
                  DAYS_OF_WEEK.filter((d) => reportForm.calendario?.[d.key] === 'partido').map((d) => {
                    const dayKey = d.key;
                    const dayConfig = reportForm.preMatchConfig?.partidos?.[dayKey] || {
                      horario: reportForm.preMatchConfig?.horario || 'tarde',
                      texto: reportForm.preMatchConfig?.texto || '',
                    };

                    return (
                      <Paper key={dayKey} p="xs" radius="md" withBorder bg="white">
                        <Group justify="space-between" align="center" mb="xs">
                          <Badge color="red" variant="filled" size="md">
                            Partido del {d.label}
                          </Badge>

                          <Stack gap={2} style={{ maxWidth: '220px' }}>
                            <Text size="xs" fw={600} c="dimmed">Horario del partido</Text>
                            <SegmentedControl
                              size="xs"
                              fullWidth
                              data={[
                                { label: 'Tarde / Noche', value: 'tarde' },
                                { label: 'Mañana', value: 'manana' },
                              ]}
                              value={dayConfig.horario || 'tarde'}
                              onChange={(val) =>
                                updateReportField('preMatchConfig', {
                                  ...(reportForm.preMatchConfig || {}),
                                  partidos: {
                                    ...(reportForm.preMatchConfig?.partidos || {}),
                                    [dayKey]: {
                                      ...(reportForm.preMatchConfig?.partidos?.[dayKey] || {}),
                                      horario: val,
                                      texto: dayConfig.texto || '',
                                    },
                                  },
                                })
                              }
                            />
                          </Stack>
                        </Group>

                        <Textarea
                          label={`Indicaciones de menú 24h previas al partido del ${d.label}`}
                          placeholder={
                            dayConfig.horario === 'manana'
                              ? 'Ej:\nComida (día anterior): Arroz con pechuga de pollo.\nMerienda: Yogur con frutos secos.\nCena (día anterior): Salmón con patata cocida.\nDesayuno pre-partido: Tortitas de avena y plátano...'
                              : 'Ej:\nCena (día anterior): Arroz blanco con pavo a la plancha.\nDesayuno: Tostadas de pan con mermelada y zumo.\nComida pre-partido: Pasta blanca con pechuga de pollo...'
                          }
                          value={dayConfig.texto || ''}
                          onChange={(event) => {
                            const textVal = event.currentTarget.value;
                            updateReportField('preMatchConfig', {
                              ...(reportForm.preMatchConfig || {}),
                              partidos: {
                                ...(reportForm.preMatchConfig?.partidos || {}),
                                [dayKey]: {
                                  ...(reportForm.preMatchConfig?.partidos?.[dayKey] || {}),
                                  horario: dayConfig.horario || 'tarde',
                                  texto: textVal,
                                },
                              },
                            });
                          }}
                          rows={3}
                          size="xs"
                          description={`Estas comidas sobreescribirán el menú del comedor para las 24h previas al partido del ${d.label} en la plantilla.`}
                        />
                      </Paper>
                    );
                  })
                ) : (
                  <Text size="xs" c="orange.8" fw={500} p="xs">
                    Sin días de partido asignados en la plantilla. Selecciona &quot;Partido&quot; en al menos un día del calendario superior para configurar sus 24h previas.
                  </Text>
                )}
              </Stack>
            )}
          </Paper>

          {/* Panel 4: Seleccionar Jugadores */}
          {!reportModal.player && (
            <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(237, 242, 255, 0.35)', borderColor: '#bac8ff' }}>
              <Group justify="space-between" mb="xs" align="center">
                <Group gap="xs">
                  <ThemeIcon color="indigo" size="sm" radius="xl" variant="light">
                    <IconUsers size={14} />
                  </ThemeIcon>
                  <Text fw={700} size="sm" c="indigo.9">
                    Destinatarios ({selectedPlayerIds.length} de {playersState.length})
                  </Text>
                </Group>
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    color="indigo"
                    onClick={() => setSelectedPlayerIds(playersState.map((p) => p.id))}
                  >
                    Seleccionar todos
                  </Button>
                  <Button
                    variant="subtle"
                    color="red"
                    size="compact-xs"
                    onClick={() => setSelectedPlayerIds([])}
                  >
                    Deseleccionar todos
                  </Button>
                </Group>
              </Group>
              <ScrollArea h={140} offsetScrollbars style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-md)', padding: '8px', backgroundColor: '#ffffff' }}>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                  {playersState.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    return (
                      <Checkbox
                        key={player.id}
                        label={`${player.nombre} ${player.apellidos || ''}`.trim()}
                        checked={isSelected}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          setSelectedPlayerIds((prev) =>
                            checked
                              ? [...prev, player.id]
                              : prev.filter((id) => id !== player.id)
                          );
                        }}
                        size="sm"
                      />
                    );
                  })}
                </SimpleGrid>
              </ScrollArea>
            </Paper>
          )}

          {/* Panel 5: Textos e Indicaciones */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(248, 249, 250, 0.5)', borderColor: '#e9ecef' }}>
            <Group gap="xs" mb="xs">
              <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={700} size="sm" c="gray.9">Contenido e Indicaciones del PDF</Text>
            </Group>

            <Stack gap="sm">
              <Textarea
                label="Microciclo / calendario"
                placeholder="Ej. Partido Domingo vs Barcelona. Lunes y Martes entreno normal..."
                minRows={3}
                autosize
                value={reportForm.microcycle}
                onChange={(event) => updateReportField('microcycle', event.currentTarget.value)}
              />
              <Textarea
                label="Reglas de la semana"
                placeholder="Ej. Hidratación regular, suplementación básica..."
                minRows={3}
                autosize
                value={reportForm.rules}
                onChange={(event) => updateReportField('rules', event.currentTarget.value)}
              />
              <Textarea
                label="Equipamiento del buffet"
                placeholder="Ej. Indicaciones de cómo servirse según día de entreno/partido..."
                minRows={3}
                autosize
                value={reportForm.buffet}
                onChange={(event) => updateReportField('buffet', event.currentTarget.value)}
              />
            </Stack>
          </Paper>

          <Group justify="space-between" align="center" mt="xs">
            <Text size="sm" c="dimmed">
              {reportModal.player
                ? 'Se generará un PDF individual en una sola página A4.'
                : `Se generará un PDF con portada y ${selectedPlayerIds.length} fichas individuales.`}
            </Text>
            <Button
              leftSection={<IconDownload size={16} />}
              radius="xl"
              color="blue"
              loading={generatingReport}
              onClick={generateReport}
            >
              Generar PDF
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
