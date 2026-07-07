'use client';

import { Stack, Group, Paper, Box, Text, SimpleGrid, Skeleton, Tabs, rem } from '@mantine/core';
import { IconInfoCircle, IconChartBar, IconSalad } from '@tabler/icons-react';

export default function PlayerDashboardSkeleton() {
  return (
    <Stack gap="md">
      {/* 1. CABECERA DEL JUGADOR SKELETON (JugadorHeader) */}
      <Paper radius="lg" p="lg" withBorder shadow="sm" bg="white">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="md">
            {/* Botón volver atrás mock */}
            <Skeleton height={42} width={42} radius="xl" />
            
            {/* Avatar circular */}
            <Skeleton circle height={84} width={84} />

            {/* Identidad del jugador */}
            <Stack gap={6} style={{ minWidth: 150 }}>
              <Skeleton height={26} width={200} radius="md" />
              <Group gap="xs" align="center">
                <Skeleton height={14} width={80} radius="sm" />
                <Text c="gray.3" size="xs">•</Text>
                <Skeleton height={14} width={60} radius="sm" />
              </Group>
            </Stack>
          </Group>

          {/* Acciones de Cabecera */}
          <Group gap="xs" wrap="wrap">
            <Skeleton height={30} width={130} radius="xl" />
            <Skeleton height={30} width={90} radius="xl" />
          </Group>
        </Group>
      </Paper>

      {/* 2. PESTAÑAS (Tabs) SKELETON */}
      <Tabs
        value="resumen"
        variant="outline"
        radius="md"
        color="dark"
        styles={{
          list: { backgroundColor: 'transparent', borderBottomColor: 'var(--mantine-color-gray-3)' },
          tab: {
            fontSize: rem(15),
            fontWeight: 600,
            padding: `${rem(10)} ${rem(16)}`,
          },
        }}
      >
        <Tabs.List grow>
          <Tabs.Tab value="resumen" leftSection={<IconInfoCircle size={18} />}>
            Resumen
          </Tabs.Tab>
          <Tabs.Tab value="metricas" leftSection={<IconChartBar size={18} />}>
            Métricas
          </Tabs.Tab>
          <Tabs.Tab value="nutricion" leftSection={<IconSalad size={18} />}>
            Nutrición
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* 3. CONTENIDO DE PESTAÑA PERFIL SKELETON */}
      <Stack gap={0}>
        {/* Banner de Cabecera de la Subpestaña */}
        <Paper
          p={{ base: 'sm', sm: 'md' }}
          bg="white"
          shadow="xs"
          radius="lg"
          withBorder
          style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          <Group gap="xs">
            <Skeleton circle height={38} width={38} />
            <Box style={{ flex: 1 }}>
              <Skeleton height={20} width={150} radius="md" mb={6} />
              <Skeleton height={12} width={280} radius="sm" />
            </Box>
          </Group>
        </Paper>

        {/* Envoltorio del contenido */}
        <Box py="md">
          <Stack gap="md">
            {/* Tarjeta de Objetivos Nutricionales */}
            <Paper p="lg" bg="white" shadow="xs" radius="lg" withBorder>
              <Group justify="space-between" align="flex-start" wrap="wrap" mb="md" gap="md">
                <Group gap="xs">
                  <Skeleton circle height={38} width={38} />
                  <Box>
                    <Skeleton height={18} width={180} radius="md" mb={6} />
                    <Skeleton height={12} width={320} radius="sm" />
                  </Box>
                </Group>
                <Skeleton height={24} width={140} radius="sm" />
              </Group>

              {/* Selector del tipo de día mock */}
              <Box mb="md" bg="gray.0" p="xs" style={{ borderRadius: '12px' }}>
                <Skeleton height={12} width={80} radius="sm" mb="xs" />
                <Skeleton height={36} radius="md" />
              </Box>

              {/* Grid de macros (StatCard) */}
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                {[...Array(4)].map((_, idx) => (
                  <Paper key={idx} p="md" radius="lg" withBorder shadow="sm" bg="white">
                    <Skeleton height={10} width={80} radius="sm" mb={8} />
                    <Skeleton height={24} width={110} radius="md" mb={8} />
                    <Skeleton height={10} width={130} radius="sm" />
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>

            {/* Tarjeta de Preferencias y Contexto */}
            <Paper p="lg" bg="white" shadow="xs" radius="lg" withBorder>
              <Group gap="xs" mb="md">
                <Skeleton circle height={38} width={38} />
                <Box>
                  <Skeleton height={18} width={180} radius="md" mb={6} />
                  <Skeleton height={12} width={260} radius="sm" />
                </Box>
              </Group>

              {/* Grid de campos editables */}
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {[...Array(6)].map((_, idx) => (
                  <Paper key={idx} p="md" radius="lg" withBorder bg="gray.0" style={{ borderColor: 'var(--mantine-color-gray-1)' }}>
                    <Skeleton height={12} width={120} radius="sm" mb="xs" />
                    <Skeleton height={24} radius="sm" />
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
