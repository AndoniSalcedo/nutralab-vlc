'use client';

import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import MealCard from '@/components/MealCard';
import { mockMeals } from '@/lib/boneyardMockData';
import { SimpleGrid, Stack, Text, Box } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardDiarioComidas() {
  return (
    <BoneyardSkeleton name="diario-comidas" loading={false}>
      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text
              c="dimmed"
              size="sm"
              fw={700}
              tt="uppercase"
              style={{ paddingLeft: 4, letterSpacing: 0.5 }}
            >
              Hoy
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {mockMeals.slice(0, 6).map((m) => (
                <MealCard key={m.id} m={m} readOnly />
              ))}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Box>
    </BoneyardSkeleton>
  );
}
