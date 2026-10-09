'use client';

import { useMemo } from 'react';
import { Stack, Text } from '@mantine/core';
import { previewPautaGroups } from '@/lib/nutrition/pauta-preview';

const MAX_FOODS_SHOWN = 6;

/** Debajo de una pauta interpretada: qué puede salir de cada grupo y aviso si una toma ligera lleva carne para cocinar. */
export default function PautaGroupsPreview({ tree, jugador, mealName, isMainMeal, isPreMatch = false }) {
  const groups = useMemo(
    () => previewPautaGroups(tree, { jugador, mealName, isMainMeal, isPreMatch }),
    [tree, jugador, mealName, isMainMeal, isPreMatch]
  );
  if (groups.length === 0) return null;

  return (
    <Stack gap={4} mt={6}>
      <Text size="11px" fw={700} c="dimmed" tt="uppercase">
        Qué puede salir de cada grupo
      </Text>
      {groups.map(({ name, foods, cookingInLightMeal }) => {
        const shown = foods.slice(0, MAX_FOODS_SHOWN).join(', ');
        const more = foods.length > MAX_FOODS_SHOWN ? ` y ${foods.length - MAX_FOODS_SHOWN} más` : '';
        return (
          <Stack key={name} gap={0}>
            <Text size="11px">
              <Text span fw={700} c="dark.7">{name}: </Text>
              <Text span c={foods.length ? 'dark.6' : 'red.7'}>
                {foods.length ? `${shown}${more}` : 'ningún alimento apto para el jugador en esta toma'}
              </Text>
            </Text>
            {cookingInLightMeal && (
              <Text size="11px" c="orange.8" fw={600}>
                Es carne o pescado para cocinar. Si querías fiambre o conserva, escríbelo así
                (p. ej. «pavo en lonchas», «atún en lata») y vuelve a interpretar.
              </Text>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
