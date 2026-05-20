'use client';

import { Stack, Paper, Group, Avatar, Title, Text, Badge } from '@mantine/core';
import PlayerTabs from '@/app/dashboard/jugador/[id]/_tabs/PlayerTabs';

export default function PlayerDashboardContent({ jugador, analiticas = [], evoluciones = [] }) {
  if (!jugador) {
    return <Text c="red">No se pudo cargar la información del jugador.</Text>;
  }

  return (
    <Stack gap="xl">
      {/* HEADER / PERFIL */}
      <Paper radius="xl" p="xl" withBorder shadow="sm" bg="white">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="lg">
            <Avatar size={96} radius="xl" color="blue">
              {jugador.nombre?.[0]}{jugador.apellidos?.[0]}
            </Avatar>

            <Stack gap={4}>
              <Title order={2} c="dark.4" lh={1.1} fz={28}>
                {jugador.nombre} {jugador.apellidos}
              </Title>
              
              <Group gap="xs" align="center">
                <Text c="dimmed" size="md" fw={500}>
                  {jugador.posicion || 'Sin posición'}
                </Text>
                {jugador.club && (
                  <>
                    <Text c="dimmed" size="xs">•</Text>
                    <Text c="dimmed" size="md">{jugador.club}</Text>
                  </>
                )}
              </Group>

              <Group gap="xs" mt={8}>
                {jugador.altura_cm && (
                  <Badge variant="light" color="gray" size="md" radius="sm">
                    {jugador.altura_cm} cm
                  </Badge>
                )}
                {jugador.peso_kg && (
                  <Badge variant="light" color="blue" size="md" radius="sm">
                    {jugador.peso_kg} kg
                  </Badge>
                )}
                {jugador.porcentaje_grasa && (
                  <Badge variant="light" color="orange" size="md" radius="sm">
                    {jugador.porcentaje_grasa}% grasa
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        </Group>
      </Paper>

      <PlayerTabs jugador={jugador} analiticas={analiticas} evoluciones={evoluciones} readOnly={true} />
    </Stack>
  );
}
