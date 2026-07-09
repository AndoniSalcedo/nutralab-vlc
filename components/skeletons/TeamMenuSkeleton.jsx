'use client';

import { Stack, Group, Paper, Skeleton, Grid, Box, ActionIcon, ThemeIcon, Title, Text } from '@mantine/core';
import { IconArrowLeft, IconChefHat } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TeamMenuSkeleton() {
  const params = useParams();
  const teamId = params?.teamId;

  return (
    <Stack gap={0}>
      {/* Header Paper */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <ActionIcon 
                component={Link} 
                href={teamId ? `/dashboard/equipo/${teamId}` : '/dashboard'} 
                variant="light" 
                color="gray" 
                radius="xl" 
                size={42}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
                <IconChefHat size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={3} fw={800} c="dark.4">Menú comedor</Title>
                <Text size="sm" c="dimmed">
                  Comedor del equipo, comida y cena.
                </Text>
              </Stack>
            </Group>
            {/* Switcher button group layout mockup */}
            <Group gap={4} p={3} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-xl)', border: '1px solid var(--mantine-color-gray-2)', height: 38, width: 72 }}>
              <Skeleton height={32} width={32} radius="xl" />
              <Skeleton height={32} width={32} radius="xl" />
            </Group>
          </Group>

          {/* Selector/Buttons Paper */}
          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 260 }} />
              <Group gap={8}>
                <Skeleton height={36} width={110} radius="xl" />
                <Skeleton height={36} width={110} radius="xl" />
                <Skeleton height={36} width={110} radius="xl" />
              </Group>
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {/* Menu Cards Wrapper matching Box py */}
      <Box py={{ base: 'sm', sm: 'md' }}>
        <Paper p="lg" bg="white" shadow="xs" radius="lg" withBorder>
          <Stack gap="md">
            {/* Day selection tabs */}
            <Group gap="xs" justify="center" mb="md">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={42} width={90} radius="xl" />
              ))}
            </Group>

            {/* Comida / Cena grid */}
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" radius="md" bg="gray.0" withBorder>
                  <Stack gap="sm">
                    <Group gap="xs">
                      <Skeleton circle height={28} width={28} />
                      <Skeleton height={16} width={100} radius="sm" />
                    </Group>
                    <Skeleton height={14} width="85%" radius="sm" />
                    <Skeleton height={14} width="75%" radius="sm" />
                    <Skeleton height={14} width="60%" radius="sm" />
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" radius="md" bg="gray.0" withBorder>
                  <Stack gap="sm">
                    <Group gap="xs">
                      <Skeleton circle height={28} width={28} />
                      <Skeleton height={16} width={100} radius="sm" />
                    </Group>
                    <Skeleton height={14} width="80%" radius="sm" />
                    <Skeleton height={14} width="70%" radius="sm" />
                    <Skeleton height={14} width="55%" radius="sm" />
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}
