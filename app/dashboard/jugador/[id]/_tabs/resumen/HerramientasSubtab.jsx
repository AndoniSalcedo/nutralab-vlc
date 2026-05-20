'use client';

import { SimpleGrid } from '@mantine/core';
import FoodCalculator from '@/components/FoodCalculator';
import HydrationCalculator from '@/components/HydrationCalculator';

export default function HerramientasSubtab({ jugador }) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <HydrationCalculator jugador={jugador} />
      <FoodCalculator />
    </SimpleGrid>
  );
}
