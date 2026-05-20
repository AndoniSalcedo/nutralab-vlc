'use client';

import { Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { CampoEditable } from '../editable';

const NUM_COMIDAS = [
  { value: '3', label: '3 comidas' },
  { value: '4', label: '4 comidas' },
  { value: '5', label: '5 comidas' },
  { value: '6', label: '6 comidas' },
  { value: '7', label: '7 comidas' },
];

export default function ObjetivosSubtab({ jugador, readOnly = false }) {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Kcal objetivo</Text>
          <Title order={2} mt={5}>{jugador.kcal_objetivo ?? '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Proteína</Text>
          <Title order={2} mt={5}>{jugador.proteina_objetivo_g ? `${jugador.proteina_objetivo_g}g` : '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>CHO</Text>
          <Title order={2} mt={5}>{jugador.cho_objetivo_g ? `${jugador.cho_objetivo_g}g` : '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Grasa</Text>
          <Title order={2} mt={5}>{jugador.grasa_objetivo_g ? `${jugador.grasa_objetivo_g}g` : '-'}</Title>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <CampoEditable label="Número de comidas diarias" campo="num_comidas" valor={String(jugador.num_comidas || '5')} jugadorId={jugador.id} tipo="select" opciones={NUM_COMIDAS} readOnly={readOnly} />
        <CampoEditable label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="text" readOnly={readOnly} />
        <CampoEditable label="Gustos y preferencias" campo="gustos_preferencias" valor={jugador.gustos_preferencias || ''} jugadorId={jugador.id} readOnly={readOnly} />
        <CampoEditable label="Aversiones" campo="aversiones" valor={jugador.aversiones || ''} jugadorId={jugador.id} readOnly={readOnly} />
        <CampoEditable label="Intolerancias" campo="intolerancias" valor={jugador.intolerancias || ''} jugadorId={jugador.id} readOnly={readOnly} />
        <CampoEditable label="Alergias" campo="alergias" valor={jugador.alergias || ''} jugadorId={jugador.id} readOnly={readOnly} />
        <CampoEditable label="Contexto clínico" campo="contexto_clinico" valor={jugador.contexto_clinico || ''} jugadorId={jugador.id} readOnly={readOnly} />
      </SimpleGrid>
    </Stack>
  );
}
