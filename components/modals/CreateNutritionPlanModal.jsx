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
  Text
} from '@mantine/core';
import { IconBrain, IconSparkles } from '@tabler/icons-react';
import { getUserMeals } from '@/lib/nutrition-day-types';

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
  dayTypeOptions,
  createEmptyPlan,
  generatePlanFromModal,
  actionType,
  jugador
}) {
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
            {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dayKey) => {
              const labels = {
                lunes: 'Lunes',
                martes: 'Martes',
                miercoles: 'Miércoles',
                jueves: 'Jueves',
                viernes: 'Viernes',
                sabado: 'Sábado',
                domingo: 'Domingo',
              };
              return (
                <Select
                  key={dayKey}
                  label={labels[dayKey]}
                  data={dayTypeOptions}
                  value={modalCalendar[dayKey]}
                  onChange={(val) => setModalCalendar((prev) => ({ ...prev, [dayKey]: val || 'entreno' }))}
                  size="xs"
                />
              );
            })}
          </SimpleGrid>
        </Paper>

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
