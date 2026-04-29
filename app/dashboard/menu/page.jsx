import { getSupabaseAdmin } from '@/lib/supabase-server';
import MenuSemanal from '@/components/MenuSemanal';
import { Anchor, Group, Stack, Text, Title } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const supabase = getSupabaseAdmin();
  let menus = [];

  try {
    const { data, error } = await supabase
      .from('menu_semanal')
      .select('*')
      .order('semana', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    menus = data || [];
  } catch (err) {
    console.error('Error fetching menus:', err);
    menus = [];
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Anchor href="/dashboard" size="xs" c="dimmed">← Panel</Anchor>
          <Title order={2} mt={4}>Menú Ciudad Deportiva</Title>
          <Text c="dimmed" size="sm">Comedor del primer equipo · Comida y cena</Text>
        </div>
      </Group>
      <MenuSemanal menusIniciales={menus || []} />
    </Stack>
  );
}