'use client';

import { useMemo, useState } from 'react';
import { Card, Text, Group, Select, NumberInput, Grid, Stack, Title, Badge, Paper, Box } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import { useFoods } from '@/hooks/use-foods';

const EMPTY_FOOD = { kcal: 0, cho: 0, pro: 0, fat: 0 };

export default function FoodCalculator() {
  const { foods } = useFoods();
  const foodOptions = useMemo(
    () => foods.map((food) => ({ value: food.id, label: food.name })),
    [foods]
  );

  const [foodId, setFoodId] = useState(null);
  const [grams, setGrams] = useState(100);

  const food = useMemo(
    () => foods.find((item) => item.id === foodId) || foods[0] || EMPTY_FOOD,
    [foods, foodId]
  );
  
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
            <Group gap="xs" align="center">
              <Icon3D name="apple" size={30} />
              <Title order={3}>Calculadora de Alimentos</Title>
            </Group>
            <Badge color="blue" variant="light" size="lg" radius="sm">BEDCA</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Selecciona un alimento frecuente para calcular sus macros y calorías al instante.
          </Text>
        </div>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Select
              label="Alimento"
              placeholder="Buscar un alimento..."
              data={foodOptions}
              value={foodId}
              onChange={setFoodId}
              searchable
              clearable
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
              rightSection={<Icon3D name="scale" size={18} />}
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
                <Icon3D name="fire" size={34} />
              </Group>
              <Group align="flex-end" gap="xs" mt="sm">
                <Text fz={32} fw={700} lh={1} c="dark.5">
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
              <Box mx="auto" mb="xs">
                <Icon3D name="bread" size={32} />
              </Box>
              <Text fz={18} fw={700} c="dark.5">{result.cho}g</Text>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>Carbos</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 4, sm: 2 }}>
            <Paper withBorder p="sm" radius="xl" ta="center" h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'center' }}>
              <Box mx="auto" mb="xs">
                <Icon3D name="meat" size={32} />
              </Box>
              <Text fz={18} fw={700} c="dark.5">{result.pro}g</Text>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>Proteína</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 4, sm: 2 }}>
            <Paper withBorder p="sm" radius="xl" ta="center" h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'center' }}>
              <Box mx="auto" mb="xs">
                <Icon3D name="avocado" size={32} />
              </Box>
              <Text fz={18} fw={700} c="dark.5">{result.fat}g</Text>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>Grasas</Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
