import React, { useMemo, useState } from 'react';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconRefresh,
  IconShieldCheck,
  IconUserCheck,
} from '@tabler/icons-react';

const DAYS_OF_WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function formatMacro(value, suffix = '') {
  return value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
}

export default function SquadReportReviewModal({
  opened,
  preview,
  index,
  total,
  loading,
  onValidate,
  onRegenerate,
  onCancel,
}) {
  const [confirmed, setConfirmed] = useState(false);
  const playerName = `${preview?.nombre || 'Jugador'} ${preview?.apellidos || ''}`.trim();
  const plan = preview?.plan;
  const activeDays = useMemo(
    () => DAYS_OF_WEEK.filter((dayKey) => plan?.dias?.[dayKey]),
    [plan]
  );
  const weeklyNotes = plan?.notas || plan?.notes || [];

  React.useEffect(() => {
    setConfirmed(false);
  }, [preview?.id, index]);

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={
        <Group gap="xs">
          <ThemeIcon color="teal" variant="light" radius="xl">
            <IconShieldCheck size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={800} size="md">Validación previa del informe</Text>
            <Text size="xs" c="dimmed">Jugador {Math.min(index + 1, total)} de {total}</Text>
          </Stack>
        </Group>
      }
      size="1000px"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
    >
      <Stack gap="md">
        <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #e6fcf5, #f3f0ff)', borderColor: '#96f2d7' }}>
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon color="teal" size="lg" radius="xl">
                <IconUserCheck size={20} />
              </ThemeIcon>
              <Box>
                <Text fw={800} size="lg">{playerName}</Text>
                <Text size="sm" c="dimmed">{preview?.posicion || 'Jugador'} · Plan semanal generado</Text>
              </Box>
            </Group>
            <Badge color="teal" variant="light" size="lg">Borrador sin guardar</Badge>
          </Group>
        </Paper>

        <Paper p="sm" radius="md" withBorder>
          <Group gap="xs" mb="xs">
            <ThemeIcon color="orange" variant="light" size="sm" radius="xl">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
            <Text size="sm" fw={700}>Revisa las ingestas y las indicaciones de los siete días</Text>
          </Group>
          <Text size="xs" c="dimmed">
            Este contenido todavía no se ha guardado. Debes marcar la confirmación para pasar al siguiente jugador.
          </Text>
        </Paper>

        <ScrollArea h="min(55vh, 560px)" offsetScrollbars>
          <Stack gap="sm" pr="xs">
            <Group grow align="stretch">
              <Paper p="xs" withBorder radius="md">
                <Text size="xs" c="dimmed">Peso</Text>
                <Text fw={700}>{formatMacro(plan?.metricas?.peso, ' kg')}</Text>
              </Paper>
              <Paper p="xs" withBorder radius="md">
                <Text size="xs" c="dimmed">Grasa</Text>
                <Text fw={700}>{formatMacro(plan?.metricas?.grasa, '%')}</Text>
              </Paper>
              <Paper p="xs" withBorder radius="md">
                <Text size="xs" c="dimmed">Masa magra</Text>
                <Text fw={700}>{formatMacro(plan?.metricas?.masaMagra, ' kg')}</Text>
              </Paper>
            </Group>

            <Accordion multiple defaultValue={activeDays.slice(0, 1)} variant="separated">
              {activeDays.map((dayKey) => {
                const day = plan.dias[dayKey];
                return (
                  <Accordion.Item key={dayKey} value={dayKey}>
                    <Accordion.Control>
                      <Group justify="space-between" pr="sm" wrap="nowrap">
                        <Text fw={700}>{day.label}</Text>
                        <Text size="xs" c="dimmed" ta="right">
                          {formatMacro(day.kcal, ' kcal')} · P {formatMacro(day.proteina, 'g')} · HC {formatMacro(day.hidratos, 'g')} · G {formatMacro(day.grasa, 'g')}
                        </Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        {(day.ingestas || []).map((meal, mealIndex) => (
                          <Box key={`${dayKey}-${mealIndex}`}>
                            <Text size="xs" fw={800} c="orange.8" tt="uppercase">{meal.nombre}</Text>
                            <Text size="sm" lh={1.35}>{meal.detalle || 'Sin detalle generado'}</Text>
                            {mealIndex < day.ingestas.length - 1 && <Divider mt="xs" />}
                          </Box>
                        ))}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>

            {Array.isArray(weeklyNotes) && weeklyNotes.length > 0 && (
              <Paper p="sm" radius="md" withBorder bg="blue.0">
                <Text size="xs" fw={800} c="blue.8" tt="uppercase" mb={4}>Indicaciones semanales</Text>
                {weeklyNotes.map((note, noteIndex) => (
                  <Text key={noteIndex} size="sm">• {note}</Text>
                ))}
              </Paper>
            )}
          </Stack>
        </ScrollArea>

        <Checkbox
          checked={confirmed}
          onChange={(event) => setConfirmed(event.currentTarget.checked)}
          label="He revisado este plan y confirmo que es correcto para este jugador."
          disabled={loading}
        />

        <Group justify="space-between" align="center" wrap="wrap">
          <Button variant="subtle" color="red" onClick={onCancel} disabled={loading}>
            Cancelar generación
          </Button>
          <Group gap="xs">
            <Button
              variant="light"
              color="orange"
              leftSection={<IconRefresh size={16} />}
              onClick={onRegenerate}
              loading={loading}
              disabled={loading}
            >
              No es correcto, regenerar
            </Button>
            <Button
              color="teal"
              leftSection={<IconCheck size={16} />}
              onClick={() => onValidate()}
              loading={loading}
              disabled={!confirmed || loading}
            >
              {index + 1 < total ? 'Validar y continuar' : 'Validar y guardar informe'}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
