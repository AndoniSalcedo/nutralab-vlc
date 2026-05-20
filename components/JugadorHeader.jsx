'use client';

import { useState } from 'react';
import { Paper, Group, Anchor, ActionIcon, Avatar, Stack, Title, Text, Badge, Button, Modal } from '@mantine/core';
import { IconChevronLeft, IconEdit } from '@tabler/icons-react';
import PlayerForm from './PlayerForm';

export default function JugadorHeader({ jugador }) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Paper radius="lg" p="lg" withBorder shadow="sm" bg="white">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="md">
            <Anchor href="/dashboard" style={{ textDecoration: 'none' }}>
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <IconChevronLeft size={24} />
              </ActionIcon>
            </Anchor>

            <Avatar size={84} radius="xl" color="blue">
              {jugador.nombre?.[0]}{jugador.apellidos?.[0]}
            </Avatar>

            <Stack gap={4}>
              <Title order={2} c="dark.4" lh={1.1} fz={26}>
                {jugador.nombre} {jugador.apellidos}
              </Title>
              
              <Group gap="xs" align="center">
                <Text c="dimmed" size="sm">
                  {jugador.posicion || 'Sin posición'}
                </Text>
                {jugador.club && (
                  <>
                    <Text c="dimmed" size="xs">•</Text>
                    <Text c="dimmed" size="sm">{jugador.club}</Text>
                  </>
                )}
              </Group>

              <Group gap="xs" mt={4}>
                {jugador.altura_cm && (
                  <Badge variant="light" color="gray" size="sm" radius="sm">
                    {jugador.altura_cm} cm
                  </Badge>
                )}
                {jugador.peso_kg && (
                  <Badge variant="light" color="blue" size="sm" radius="sm">
                    {jugador.peso_kg} kg
                  </Badge>
                )}
                {jugador.porcentaje_grasa && (
                  <Badge variant="light" color="orange" size="sm" radius="sm">
                    {jugador.porcentaje_grasa}% grasa
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          <Group gap="xs">
            <Button 
              variant="default" 
              radius="xl" 
              size="xs" 
              leftSection={<IconEdit size={16} />}
              onClick={() => setOpened(true)}
            >
              Editar Ficha
            </Button>
          </Group>
        </Group>
      </Paper>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Editar Ficha de Jugador" size="xl">
        <PlayerForm initial={jugador} />
      </Modal>
    </>
  );
}
