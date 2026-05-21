'use client';

import { Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import FoodCalculator from '@/components/FoodCalculator';
import HydrationCalculator from '@/components/HydrationCalculator';

export default function HerramientasSubtab({ jugador }) {
  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Group gap="xs">
          <ThemeIcon color="orange" variant="light" radius="xl" size="lg">
            <IconCalculator size={20} />
          </ThemeIcon>
          <Stack gap={2}>
            <Title order={3} fw={800} c="dark.4">Herramientas</Title>
            <Text size="sm" c="dimmed">
              Calculadoras para apoyar el trabajo nutricional.
            </Text>
          </Stack>
        </Group>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'md', sm: 'lg' }}>
          <HydrationCalculator jugador={jugador} />
          <FoodCalculator />
        </SimpleGrid>
      </Box>
    </Stack>
  );
}
