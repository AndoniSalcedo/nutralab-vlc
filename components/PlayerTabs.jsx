'use client';

import { useState } from 'react';
import { 
  Tabs, 
  SimpleGrid, 
  Paper, 
  Text, 
  Group, 
  Stack, 
  Title, 
  Button, 
  Select, 
  TextInput, 
  Textarea,
  ThemeIcon,
  rem,
  Badge,
  Box
} from '@mantine/core';
import { 
  IconUser, 
  IconChartBar, 
  IconDroplet, 
  IconBottle, 
  IconClipboardList, 
  IconBrain,
  IconCheck,
  IconEdit
} from '@tabler/icons-react';
import { BentoCard } from './Bento/BentoItem';
import PlanIATab from './PlanIATab';

const NUM_COMIDAS = [
  { value: '3', label: '3 comidas' },
  { value: '4', label: '4 comidas' },
  { value: '5', label: '5 comidas' },
  { value: '6', label: '6 comidas' },
  { value: '7', label: '7 comidas' },
];

function CampoEditable({ label, campo, valor, jugadorId, tipo = 'textarea', opciones }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(valor || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/update-player', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id: jugadorId, field: campo, value: val }) 
    });
    setSaving(false); setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <BentoCard title={label} icon={IconEdit} color="gray" style={{ height: 'auto' }}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Box style={{ flex: 1 }}>
            {editing ? (
              tipo === 'select' ? (
                <Select 
                  data={opciones} 
                  value={val} 
                  onChange={setVal} 
                  size="sm"
                />
              ) : tipo === 'text' ? (
                <TextInput 
                  value={val} 
                  onChange={e => setVal(e.target.value)} 
                  size="sm"
                />
              ) : (
                <Textarea 
                  value={val} 
                  onChange={e => setVal(e.target.value)} 
                  rows={3} 
                  size="sm"
                />
              )
            ) : (
              <Text size="sm" c={val ? 'dark' : 'dimmed'}>
                {val || 'Sin especificar'}
              </Text>
            )}
          </Box>
          <Group gap={6}>
            {saved && <IconCheck size={16} color="green" />}
            {!editing ? (
              <Button variant="subtle" size="compact-xs" onClick={() => setEditing(true)}>
                Editar
              </Button>
            ) : (
              <>
                <Button variant="subtle" color="gray" size="compact-xs" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button variant="filled" size="compact-xs" onClick={save} loading={saving}>
                  Guardar
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Stack>
    </BentoCard>
  );
}

function EditableSection({ title, defaultValue, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true); await onSave(value); setSaving(false);
    setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Paper radius="lg" p="md" withBorder shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
          <Group gap="xs">
            {saved && <Badge color="green" variant="light">Guardado</Badge>}
            {!editing ? (
              <Button variant="light" size="xs" onClick={() => setEditing(true)} leftSection={<IconEdit size={14} />}>
                Editar
              </Button>
            ) : (
              <>
                <Button variant="subtle" color="gray" size="xs" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button variant="filled" size="xs" onClick={handleSave} loading={saving}>
                  Guardar
                </Button>
              </>
            )}
          </Group>
        </Group>
        {editing ? (
          <Textarea 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            minRows={10} 
            size="sm"
            styles={{ input: { lineHeight: 1.6 } }}
          />
        ) : (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {value || 'Sin notas. Haz clic en Editar para personalizar.'}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export default function PlayerTabs({ jugador }) {
  const [activeTab, setActiveTab] = useState('resumen');

  async function saveField(field, value) {
    await fetch('/api/update-player', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id: jugador.id, field, value }) 
    });
  }

  const peso = Number(jugador.peso_kg || 0);
  const aguaBase = peso ? Math.round(peso * 40) : 0;
  const aguaEntreno = peso ? Math.round(peso * 6) : 0;
  const aguaPartido = peso ? Math.round(peso * 10) : 0;
  const cafMin = peso ? Math.round(peso * 3) : 200;
  const cafMax = peso ? Math.round(peso * 6) : 400;

  const hidDef = [
    'HIDRATACION - '+jugador.nombre+' '+jugador.apellidos,
    '',
    'Descanso: '+aguaBase+' ml | Entreno: '+(aguaBase+aguaEntreno)+' ml | Partido: '+(aguaBase+aguaPartido)+' ml',
    '',
    'TIMING:',
    '- Al despertar: 500 ml',
    '- Pre-entreno: 500 ml + electrolitos',
    '- Durante entreno: 150-200 ml / 15 min',
    '- Post-entreno: 150% perdida',
    '- Con comidas: 300 ml',
    '',
    'NOTAS:',
    ''
  ].join('\n');

  const supDef = [
    'SUPLEMENTACION - '+jugador.nombre+' '+jugador.apellidos,
    '',
    'EVIDENCIA A:',
    '- Creatina: 3-5 g/dia post-entreno',
    '- Cafeina: '+cafMin+'-'+cafMax+' mg x 60 min pre-partido',
    '- Beta-alanina: 3.2-6.4 g/dia',
    '',
    'MICRONUTRIENTES:',
    '- Vitamina D3: 2000-4000 UI/dia',
    '- Omega-3: 2-4 g EPA+DHA',
    '- Magnesio: 300-400 mg noche',
    '',
    'NOTAS ANALITICA:',
    ''
  ].join('\n');

  const protDef = [
    'PROTOCOLO PREPARTIDO - '+jugador.nombre+' '+jugador.apellidos,
    '',
    '-3/-4h | COMIDA PRINCIPAL:',
    '- CHO: arroz/pasta/patata',
    '- Proteina: 100-150g',
    '',
    '-90 min | SNACK: platano o gel',
    '',
    '-60 min | CAFEINA: '+cafMin+'-'+cafMax+' mg',
    '',
    'MEDIO TIEMPO: 300-500 ml isotonica',
    '',
    'POST +30min: proteina + CHO rapidos',
    '',
    'NOTAS:',
    ''
  ].join('\n');

  return (
    <Tabs 
      value={activeTab} 
      onChange={setActiveTab} 
      variant="outline" 
      radius="md" 
      color="blue"
      styles={{
        list: { backgroundColor: 'transparent', borderBottomColor: 'var(--mantine-color-gray-3)' },
        tab: { fontSize: rem(14), fontWeight: 600, padding: `${rem(10)} ${rem(16)}` }
      }}
    >
      <Tabs.List grow mb="md">
        <Tabs.Tab value="resumen" leftSection={<IconUser size={18} />}>Resumen</Tabs.Tab>
        <Tabs.Tab value="plan-ia" leftSection={<IconBrain size={18} />}>Plan IA</Tabs.Tab>
        <Tabs.Tab value="hidratacion" leftSection={<IconDroplet size={18} />}>Hidratación</Tabs.Tab>
        <Tabs.Tab value="suplementacion" leftSection={<IconBottle size={18} />}>Suplementación</Tabs.Tab>
        <Tabs.Tab value="protocolos" leftSection={<IconClipboardList size={18} />}>Protocolos</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="resumen">
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Kcal objetivo</Text>
              <Title order={2} mt={5}>{jugador.kcal_objetivo ?? '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Proteína</Text>
              <Title order={2} mt={5}>{jugador.proteina_objetivo_g ? jugador.proteina_objetivo_g+'g' : '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>CHO</Text>
              <Title order={2} mt={5}>{jugador.cho_objetivo_g ? jugador.cho_objetivo_g+'g' : '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Grasa</Text>
              <Title order={2} mt={5}>{jugador.grasa_objetivo_g ? jugador.grasa_objetivo_g+'g' : '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Masa magra</Text>
              <Title order={2} mt={5}>{jugador.masa_magra_kg ? jugador.masa_magra_kg+' kg' : '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>% Grasa</Text>
              <Title order={2} mt={5}>{jugador.porcentaje_grasa ? jugador.porcentaje_grasa+'%' : '-'}</Title>
            </Paper>
          </SimpleGrid>

          {(jugador.endomorfia || jugador.mesomorfia || jugador.ectomorfia) && (
            <BentoCard title="Somatotipo" icon={IconChartBar} color="violet">
              <SimpleGrid cols={3}>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Endomorfia</Text>
                  <Text fw={700}>{jugador.endomorfia}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Mesomorfia</Text>
                  <Text fw={700}>{jugador.mesomorfia}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Ectomorfia</Text>
                  <Text fw={700}>{jugador.ectomorfia}</Text>
                </Stack>
              </SimpleGrid>
            </BentoCard>
          )}

          <Title order={3} mt="md">Perfil Nutricional</Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <CampoEditable label='Número de comidas diarias' campo='num_comidas' valor={String(jugador.num_comidas||'5')} jugadorId={jugador.id} tipo='select' opciones={NUM_COMIDAS} />
            <CampoEditable label='Objetivo nutricional' campo='objetivo' valor={jugador.objetivo||''} jugadorId={jugador.id} tipo='text' />
            <CampoEditable label='Gustos y preferencias' campo='gustos_preferencias' valor={jugador.gustos_preferencias||''} jugadorId={jugador.id} />
            <CampoEditable label='Aversiones' campo='aversiones' valor={jugador.aversiones||''} jugadorId={jugador.id} />
            <CampoEditable label='Intolerancias' campo='intolerancias' valor={jugador.intolerancias||''} jugadorId={jugador.id} />
            <CampoEditable label='Alergias' campo='alergias' valor={jugador.alergias||''} jugadorId={jugador.id} />
            <CampoEditable label='Contexto clínico' campo='contexto_clinico' valor={jugador.contexto_clinico||''} jugadorId={jugador.id} />
          </SimpleGrid>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="plan-ia">
        <PlanIATab jugador={jugador} />
      </Tabs.Panel>

      <Tabs.Panel value="hidratacion">
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder shadow="sm" style={{ borderTop: '4px solid #3b82f6' }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Descanso</Text>
              <Title order={2} c="blue">{aguaBase ? aguaBase+' ml' : '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm" style={{ borderTop: '4px solid #f59e0b' }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Entreno</Text>
              <Title order={2} c="orange">{(aguaBase+aguaEntreno) ? (aguaBase+aguaEntreno)+' ml' : '-'}</Title>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm" style={{ borderTop: '4px solid #ef4444' }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Partido</Text>
              <Title order={2} c="red">{(aguaBase+aguaPartido) ? (aguaBase+aguaPartido)+' ml' : '-'}</Title>
            </Paper>
          </SimpleGrid>
          <EditableSection title='Protocolo personalizado' defaultValue={jugador.notas_hidratacion || hidDef} onSave={v => saveField('notas_hidratacion', v)} />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="suplementacion">
        <EditableSection title='Protocolo de suplementación' defaultValue={jugador.notas_suplementacion || supDef} onSave={v => saveField('notas_suplementacion', v)} />
      </Tabs.Panel>

      <Tabs.Panel value="protocolos">
        <EditableSection title='Protocolo prepartido' defaultValue={jugador.notas_protocolos || protDef} onSave={v => saveField('notas_protocolos', v)} />
      </Tabs.Panel>
    </Tabs>
  );
}