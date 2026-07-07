import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text, Title, Paper, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import TeamConfigClient from './TeamConfigClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamConfigPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const team = await getOwnedTeam(supabase, user, params.teamId);

  if (!team) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="red">No se pudo cargar este equipo o no tienes acceso.</Text>
        <Anchor href="/dashboard">Volver a equipos</Anchor>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Paper p="md" radius="lg" shadow="sm" withBorder>
        <Group gap="md" align="center">
          <Tooltip label="Volver al equipo" withArrow>
            <ActionIcon component={Anchor} href={`/dashboard/equipo/${team.id}`} variant="light" color="gray" radius="xl" size={42}>
              <IconArrowLeft size={20} />
            </ActionIcon>
          </Tooltip>
          <div>
            <Title order={3} fw={700} c="#24291f">Configuración Nutricional: {team.nombre}</Title>
            <Text c="dimmed" size="sm" mt={2}>
              Personaliza los tipos de día y multiplicadores de macros que se usarán en este equipo.
            </Text>
          </div>
        </Group>
      </Paper>
      <TeamConfigClient team={team} />
    </Stack>
  );
}
