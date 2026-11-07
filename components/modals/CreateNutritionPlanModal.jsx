import React from 'react';
import {
  Stack,
  TextInput,
  Select,
  Paper,
  SimpleGrid,
  Button,
  Group,
  Text,
  Badge,
} from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import ResponsiveModal from './ResponsiveModal';
import ModalFooter from './ModalFooter';
import MatchKickoffControl from '@/components/plan/MatchKickoffControl';
import { getMatchSchedule } from '@/config/nutrition-days';


export default function CreateNutritionPlanModal({
  opened,
  onClose,
  modalNombre,
  setModalNombre,
  modalSelectedMenuWeek,
  setModalSelectedMenuWeek,
  availableMenus,
  modalCalendar,
  setModalCalendar,
  modalPreMatchConfig,
  setModalPreMatchConfig,
  dayTypeOptions,
  createEmptyPlan,
  generatePlanFromModal,
  actionType,
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
    <ResponsiveModal
      // Formulario de captura: un clic fuera no debe descartar lo escrito
      closeOnClickOutside={false}
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="brain" size={26} />
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
          <Paper p="sm" radius="md" withBorder bg="gray.0" style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <Icon3D name="trophy" size={22} />
                <Text size="sm" fw={700} c="dark.5">Comidas 24h Pre-Partido</Text>
              </Group>
            </Group>

            <Stack gap="sm" mt="xs">
                {matchDaysInCalendar.length > 0 ? (
                  matchDaysInCalendar.map((dayKey) => {
                    const dayHorario = getMatchSchedule(modalPreMatchConfig, dayKey);

                    return (
                      <Paper key={dayKey} p="xs" radius="md" withBorder bg="white">
                        <Group justify="space-between" align="center" mb="xs" wrap="wrap">
                          <Badge color="red" variant="filled" size="md">
                            Partido del {dayLabels[dayKey]}
                          </Badge>

                          <MatchKickoffControl
                            value={modalPreMatchConfig?.partidos?.[dayKey]}
                            fallbackHorario={modalPreMatchConfig?.horario || 'tarde'}
                            onChange={(nextDay) =>
                              setModalPreMatchConfig((prev) => ({
                                ...prev,
                                partidos: { ...(prev?.partidos || {}), [dayKey]: nextDay },
                              }))
                            }
                          />
                        </Group>

                        <Text size="xs" c="dimmed" mt="xs">
                          Se aplica el protocolo de partido del jugador por la <strong>{dayHorario === 'manana' ? 'Mañana' : dayHorario === 'noche' ? 'Noche' : 'Tarde'}</strong>: lo que tenga pautado a mano y, en el resto de tomas, sus comidas habituales con las reglas del protocolo. Con la hora de inicio, el jugador ve ese día su plan por horas y recibe los avisos a la hora real.
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
          </Paper>
        )}

        <ModalFooter>
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
            leftSection={<Icon3D name="sparkles" size={20} />}
            onClick={generatePlanFromModal}
            disabled={!modalNombre.trim() || actionType === 'generate'}
            loading={actionType === 'generate'}
          >
            Generar Plan
          </Button>
        </ModalFooter>
      </Stack>
    </ResponsiveModal>
  );
}
