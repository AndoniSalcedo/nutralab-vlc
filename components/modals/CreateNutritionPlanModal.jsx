import React from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Textarea,
  Paper,
  SimpleGrid,
  Button,
  Group,
  Text,
  Switch,
  SegmentedControl,
  Badge,
} from '@mantine/core';
import { IconBrain, IconSparkles, IconTrophy } from '@tabler/icons-react';
import { getUserMeals } from '@/lib/nutrition-day-types';

const MATCH_SCHEDULE_OPTIONS = [
  { label: 'Mañana', value: 'manana' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Noche', value: 'noche' },
];

export default function CreateNutritionPlanModal({
  opened,
  onClose,
  isMobile,
  modalNombre,
  setModalNombre,
  modalSelectedMenuWeek,
  setModalSelectedMenuWeek,
  availableMenus,
  modalContextoAdicional,
  setModalContextoAdicional,
  modalRecomendacionesIngestas,
  setModalRecomendacionesIngestas,
  modalCalendar,
  setModalCalendar,
  modalPreMatchConfig,
  setModalPreMatchConfig,
  dayTypeOptions,
  createEmptyPlan,
  generatePlanFromModal,
  actionType,
  jugador
}) {
  const dayKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  // Find all match days from calendar
  const matchDaysInCalendar = dayKeys.filter((key) => modalCalendar[key] === 'partido');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen={isMobile}
      title={
        <Group gap="xs">
          <IconBrain size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Crear Ficha Nutricional</Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <TextInput
          label="Nombre del plan"
          placeholder="Ej: Semana de 3 partidos"
          value={modalNombre}
          onChange={(e) => setModalNombre(e.target.value)}
          required
        />

        <Select
          label="Menú a utilizar"
          placeholder="Selecciona una semana o Sin Menú..."
          value={modalSelectedMenuWeek}
          onChange={(val) => setModalSelectedMenuWeek(val || 'none')}
          data={[
            { value: 'none', label: 'Sin menú comedor' },
            ...availableMenus.map((m) => ({
              value: m.semana,
              label: `Menú de la semana del ${m.semana}`,
            }))
          ]}
          allowDeselect={false}
        />

        <Textarea
          label="Instrucciones adicionales para la IA"
          placeholder="Ej: Sale de lesión, reduce fibra el día de partido..."
          value={modalContextoAdicional}
          onChange={(e) => setModalContextoAdicional(e.target.value)}
          rows={2}
        />

        <Paper p="sm" radius="md" withBorder bg="gray.0">
          <Text size="sm" fw={700} mb="xs">Recomendaciones para las ingestas del jugador</Text>
          <Stack gap="sm">
            {getUserMeals(jugador).filter((meal) => meal.toLowerCase() !== 'post-entreno').map((meal) => (
              <TextInput
                key={meal}
                label={meal}
                placeholder={`Ej: Tostadas de aguacate con pavo...`}
                value={modalRecomendacionesIngestas[meal] || ''}
                onChange={(e) => setModalRecomendacionesIngestas((prev) => ({ ...prev, [meal]: e.target.value }))}
              />
            ))}
          </Stack>
        </Paper>

        <Paper p="sm" radius="md" withBorder bg="gray.0">
          <Text size="sm" fw={700} mb="xs">Calendario de tipos de día de la semana</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {dayKeys.map((dayKey) => {
              return (
                <Select
                  key={dayKey}
                  label={dayLabels[dayKey]}
                  data={dayTypeOptions}
                  value={modalCalendar[dayKey]}
                  onChange={(val) => {
                    const newType = val || 'entreno';
                    setModalCalendar((prev) => ({ ...prev, [dayKey]: newType }));
                  }}
                  size="xs"
                />
              );
            })}
          </SimpleGrid>
        </Paper>

        {/* 24h Pre-Match Meals Configuration */}
        {setModalPreMatchConfig && (
          <Paper p="sm" radius="md" withBorder bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconTrophy size={18} style={{ color: 'var(--mantine-color-blue-7)' }} />
                <Text size="sm" fw={700} c="blue.9">Comidas 24h Pre-Partido</Text>
              </Group>
              <Switch
                checked={modalPreMatchConfig?.enabled || false}
                onChange={(e) => {
                  const isChecked = Boolean(e?.currentTarget?.checked);
                  setModalPreMatchConfig((prev) => ({
                    ...prev,
                    enabled: isChecked,
                  }));
                }}
                label="Especificar comidas 24h antes"
                size="xs"
              />
            </Group>

            {modalPreMatchConfig?.enabled && (
              <Stack gap="sm" mt="xs">
                {matchDaysInCalendar.length > 0 ? (
                  matchDaysInCalendar.map((dayKey) => {
                    const dayConfig = modalPreMatchConfig?.partidos?.[dayKey] || {
                      horario: modalPreMatchConfig?.horario || 'tarde',
                    };

                    return (
                      <Paper key={dayKey} p="xs" radius="md" withBorder bg="white">
                        <Group justify="space-between" align="center" mb="xs" wrap="wrap">
                          <Badge color="red" variant="filled" size="md">
                            Partido del {dayLabels[dayKey]}
                          </Badge>

                          <Stack gap={2} style={{ flexGrow: 1, maxWidth: '300px', minWidth: '240px' }}>
                            <Text size="xs" fw={600} c="dimmed">Horario del partido</Text>
                            <SegmentedControl
                              size="xs"
                              fullWidth
                              data={MATCH_SCHEDULE_OPTIONS}
                              value={dayConfig.horario || 'tarde'}
                              onChange={(val) =>
                                setModalPreMatchConfig((prev) => ({
                                  ...prev,
                                  partidos: {
                                    ...(prev?.partidos || {}),
                                    [dayKey]: {
                                      ...(prev?.partidos?.[dayKey] || {}),
                                      horario: val,
                                    },
                                  },
                                }))
                              }
                            />
                          </Stack>
                        </Group>

                        <Text size="xs" c="dimmed" mt="xs">
                          Al generar el plan con IA, se aplicarán automáticamente las ingestas, recomendaciones y pauta de 24h previas que este jugador tenga configuradas en su perfil para partidos por la <strong>{dayConfig.horario === 'manana' ? 'Mañana' : dayConfig.horario === 'noche' ? 'Noche' : 'Tarde'}</strong>.
                        </Text>
                      </Paper>
                    );
                  })
                ) : (
                  <Text size="xs" c="orange.8" fw={500} p="xs">
                    Sin días de partido asignados en el calendario superior. Selecciona &quot;Partido&quot; en al menos un día del calendario para configurar su horario pre-partido.
                  </Text>
                )}
              </Stack>
            )}
          </Paper>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="light"
            color="blue"
            onClick={createEmptyPlan}
            disabled={!modalNombre.trim()}
          >
            Crear vacío (Manual)
          </Button>
          <Button
            leftSection={<IconSparkles size={16} />}
            onClick={generatePlanFromModal}
            disabled={!modalNombre.trim() || actionType === 'generate'}
            loading={actionType === 'generate'}
          >
            Generar con IA
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
