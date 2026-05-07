'use client';

import { useMemo, useState } from 'react';
import { Card, Text, Group, Select, NumberInput, Grid, ThemeIcon, Stack, Title, Badge, Paper } from '@mantine/core';
import { IconFlame, IconMeat, IconWheat, IconDroplet, IconScale } from '@tabler/icons-react';
import foods from '@/data/foods';

export default function FoodCalculator() {
  const foodOptions = useMemo(
    () => foods.map((food, index) => ({ value: String(index), label: food.name })),
    []
  );

  const [foodId, setFoodId] = useState('0');
  const [grams, setGrams] = useState(100);

  const food = foods[Number(foodId)] || foods[0];
  
  const result = useMemo(() => {
    const g = Number(grams || 0) / 100;
    return {
      kcal: Math.round(food.kcal * g),
      cho: +(food.cho * g).toFixed(1),
      pro: +(food.pro * g).toFixed(1),
      fat: +(food.fat * g).toFixed(1),
    };
  }, [food, grams]);

  return (
    <Card shadow="sm" padding="xl" radius="xl" withBorder>
      <Stack gap="xl">
        <div>
          <Group justify="space-between" align="center" mb="xs">
            <Title order={3}>Calculadora de Alimentos</Title>
            <Badge color="blue" variant="light" size="lg" radius="sm">BEDCA</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Selecciona un alimento frecuente para calcular sus macros y calorías al instante.
          </Text>
        </div>

        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Select
              label="Alimento"
              placeholder="Escribe para buscar un alimento o plato"
              data={foodOptions}
              value={foodId}
              onChange={(value) => setFoodId(value || '0')}
              searchable
              limit={50}
              nothingFoundMessage="No hay alimentos con ese nombre"
              radius="md"
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              label="Cantidad (g/ml)"
              value={grams}
              onChange={(val) => setGrams(val === '' ? 0 : val)}
              min={0}
              radius="md"
              size="md"
              rightSection={<IconScale size={18} stroke={1.5} color="gray" />}
            />
          </Grid.Col>
        </Grid>

        <Grid gutter="md">
          {/* Bento Box: Kcal */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Paper withBorder p="md" radius="xl" h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                  Energía
                </Text>
                <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
                  <IconFlame size={20} />
                </ThemeIcon>
              </Group>
              <Group align="flex-end" gap="xs" mt="sm">
                <Text fz={36} fw={800} lh={1}>
                  {result.kcal}
                </Text>
                <Text size="md" c="dimmed" fw={500} pb={2}>
                  kcal
                </Text>
              </Group>
            </Paper>
          </Grid.Col>

          {/* Bento Box: Macros */}
          <Grid.Col span={{ base: 4, sm: 2 }}>
            <Paper withBorder p="sm" radius="xl" ta="center" h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'center' }}>
              <ThemeIcon color="blue" variant="light" size="lg" radius="xl" mx="auto" mb="xs">
                <IconWheat size={18} />
              </ThemeIcon>
              <Text fz={20} fw={800}>{result.cho}g</Text>
              <Text fz={10} c="dimmed" tt="uppercase" fw={600}>Carbos</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 4, sm: 2 }}>
            <Paper withBorder p="sm" radius="xl" ta="center" h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'center' }}>
              <ThemeIcon color="green" variant="light" size="lg" radius="xl" mx="auto" mb="xs">
                <IconMeat size={18} />
              </ThemeIcon>
              <Text fz={20} fw={800}>{result.pro}g</Text>
              <Text fz={10} c="dimmed" tt="uppercase" fw={600}>Proteína</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 4, sm: 2 }}>
            <Paper withBorder p="sm" radius="xl" ta="center" h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'center' }}>
              <ThemeIcon color="yellow" variant="light" size="lg" radius="xl" mx="auto" mb="xs">
                <IconDroplet size={18} />
              </ThemeIcon>
              <Text fz={20} fw={800}>{result.fat}g</Text>
              <Text fz={10} c="dimmed" tt="uppercase" fw={600}>Grasas</Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
