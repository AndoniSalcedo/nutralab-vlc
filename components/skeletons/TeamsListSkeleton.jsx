'use client';

import { Stack, Group, Paper, ThemeIcon, Box, SimpleGrid, Skeleton } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';

export default function TeamsListSkeleton() {
  return (
    <Stack gap="lg">
      {/* Cabecera del Listado de Equipos */}
      <Paper p={{ base: 'sm', sm: 'md' }} shadow="sm" radius="lg" withBorder bg="white">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm">
            <ThemeIcon color="gray.2" variant="light" radius="md" size={42}>
              <IconUsersGroup size={21} style={{ color: 'var(--mantine-color-gray-4)' }} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Skeleton height={20} width={100} radius="md" mb={6} />
              <Skeleton height={12} width={220} radius="sm" />
            </Box>
          </Group>
          <Skeleton height={30} width={120} radius="xl" />
        </Group>

        {/* Buscador y Filtros */}
        <Group gap="xs" mt="md" wrap="wrap">
          <Skeleton height={36} radius="xl" style={{ flex: 2, minWidth: 220 }} />
          <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 190 }} />
        </Group>
      </Paper>

      {/* Grid de Equipos */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {[...Array(6)].map((_, i) => (
          <Paper
            key={i}
            p="md"
            radius="lg"
            withBorder
            shadow="sm"
            bg="white"
          >
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <ThemeIcon color="gray.1" variant="light" radius="md" size={40}>
                  <IconUsersGroup size={20} style={{ color: 'var(--mantine-color-gray-4)' }} />
                </ThemeIcon>
                <Skeleton height={28} width={28} radius="xl" />
              </Group>

              <Box>
                <Group gap="xs" mb={8} align="center">
                  <Skeleton height={18} width={120} radius="md" />
                  <Skeleton height={18} width={50} radius="sm" />
                </Group>
                <Stack gap={6}>
                  <Skeleton height={12} width="90%" radius="sm" />
                  <Skeleton height={12} width="60%" radius="sm" />
                </Stack>
              </Box>

              <Group justify="space-between" mt="xs">
                <Skeleton height={12} width={70} radius="sm" />
                <Skeleton height={12} width={90} radius="sm" />
              </Group>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
