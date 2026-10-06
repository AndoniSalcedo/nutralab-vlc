'use client';

import { useMemo, useState } from 'react';
import { Box, Button, Collapse, ColorInput, Group, Paper, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconChevronDown, IconDeviceFloppy, IconPalette } from '@/components/icons3d';
import PlanFicha from '@/components/plan/PlanFicha';
import { PLAN_THEME_PRESETS, findMatchingPreset, getContrastIssues, resolvePlanColors } from '@/config/plan-themes';

const COLOR_GROUPS = [
  {
    title: 'Fondo y cabecera',
    fields: [
      ['cardBodyBg', 'Fondo de la ficha'],
      ['cardTopBg', 'Fondo de la barra superior'],
      ['cardTopText', 'Texto de la barra superior'],
    ],
  },
  {
    title: 'Tarjetas',
    fields: [
      ['boxBg', 'Fondo de tarjetas (días, notas)'],
      ['boxBorder', 'Borde de tarjetas'],
      ['itemBg', 'Fondo de comidas y suplementos'],
    ],
  },
  {
    title: 'Textos',
    fields: [
      ['cardBodyText', 'Nombre y títulos principales'],
      ['accentText', 'Acento (comidas, secciones)'],
      ['itemText', 'Detalle de menús y notas'],
    ],
  },
];

const SAMPLE_MEALS = [
  { nombre: 'Desayuno', detalle: '80 g de avena con 250 ml de leche, 1 plátano y 20 g de crema de cacahuete.' },
  { nombre: 'Comida', detalle: '120 g de arroz, 180 g de pechuga de pollo a la plancha y ensalada con AOVE.' },
  { nombre: 'Cena', detalle: '200 g de salmón al horno con patata asada y verduras salteadas.' },
];

const SAMPLE_KCAL = [2600, 3200, 3200, 3300, 3400, 3600, 2600];
const DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function buildSamplePlan(dayTypes) {
  const types = dayTypes.length ? dayTypes : [{ key: 'descanso' }];
  const dias = {};
  DAY_KEYS.forEach((key, i) => {
    const kcal = SAMPLE_KCAL[i];
    dias[key] = {
      tipoDia: types[i % types.length].key,
      kcal,
      proteina: 165,
      hidratos: Math.round((kcal - 165 * 4 - 85 * 9) / 4),
      grasa: 85,
      ingestas: SAMPLE_MEALS,
      macrosReales: { kcal: kcal - 30, proteina: 163, hidratos: Math.round((kcal - 165 * 4 - 85 * 9) / 4) + 4, grasa: 84 },
      desviacionMacros: { kcal: -30, proteina: -2, hidratos: 4, grasa: -1 },
    };
  });
  return {
    meta: { nombre: 'Semana tipo' },
    jugador: { nombre: 'Jugador Ejemplo', posicion: 'Centrocampista' },
    metricas: { peso: 77.4, grasa: 9.8, pesoMuscular: 48.2 },
    dias,
    notas: ['Mantener una buena hidratación durante todo el día.', 'Pesar antes y después del partido.'],
    suplementacion: [{ nombre: 'Cafeína', dosis: '200 mg', timing: '45 min antes del partido' }],
    protocolos: [
      {
        id: 'sample',
        name: 'Protocolo de partido',
        timeline: [
          { id: '1', timeLabel: '-3h', title: 'Comida pre-partido', description: 'Pasta blanca + pollo magro', icon: 'IconApple' },
          { id: '2', timeLabel: '-90m', title: 'Hidratación', description: '500 ml de bebida isotónica', icon: 'IconDroplet' },
        ],
        checklist: [{ id: 'c1', title: 'Hidratación previa', description: 'Orina clara en las 3 horas previas' }],
      },
    ],
  };
}

function PresetCard({ preset, selected, disabled, onSelect }) {
  const c = preset.colors;
  return (
    <UnstyledButton
      onClick={() => onSelect(preset)}
      disabled={disabled}
      aria-pressed={selected}
      style={{
        borderRadius: 8,
        padding: 8,
        border: `1px solid ${selected ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-3)'}`,
        boxShadow: selected ? '0 0 0 1px var(--mantine-color-dark-8)' : 'none',
        backgroundColor: 'white',
        textAlign: 'left',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s ease, transform 0.15s ease',
      }}
    >
      <Box style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: c.cardBodyBg, border: `1px solid ${c.boxBorder}` }}>
        <Box style={{ height: 9, backgroundColor: c.cardTopBg }} />
        <Box p={6}>
          <Box style={{ height: 5, width: '55%', borderRadius: 3, backgroundColor: c.cardBodyText, marginBottom: 3 }} />
          <Box style={{ height: 3, width: '28%', borderRadius: 2, backgroundColor: c.accentText, marginBottom: 6 }} />
          <Box style={{ borderRadius: 5, backgroundColor: c.boxBg, border: `1px solid ${c.boxBorder}`, padding: 4 }}>
            <Box style={{ borderRadius: 3, backgroundColor: c.itemBg, padding: '3px 4px' }}>
              <Box style={{ height: 3, width: '40%', borderRadius: 2, backgroundColor: c.accentText, marginBottom: 2 }} />
              <Box style={{ height: 3, width: '80%', borderRadius: 2, backgroundColor: c.itemText, opacity: 0.8 }} />
            </Box>
          </Box>
        </Box>
      </Box>
      <Group justify="space-between" gap={4} mt={6} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Text size="xs" fw={700} c="dark.5" truncate>{preset.name}</Text>
          <Text size="10px" c="dimmed" lh={1.2}>{preset.mode === 'light' ? 'Claro' : 'Oscuro'}</Text>
        </Box>
        {selected && <IconCheck size={14} style={{ flexShrink: 0 }} />}
      </Group>
    </UnstyledButton>
  );
}

export default function PlanThemeEditor({ colors, onChange, readOnly, hasChanges, saving, onSave, clubName, dayTypes }) {
  const [customOpen, setCustomOpen] = useState(false);
  const matched = useMemo(() => findMatchingPreset(colors), [colors]);
  const issues = useMemo(() => getContrastIssues(colors), [colors]);

  const samplePlan = useMemo(() => buildSamplePlan(dayTypes || []), [dayTypes]);
  const previewPlayer = useMemo(
    () => ({ equipos: { nombre: clubName || 'Club', configuracion_nutricional: { dayTypes: dayTypes?.length ? dayTypes : undefined } } }),
    [clubName, dayTypes]
  );

  return (
    <Paper p="md" radius={24} shadow="xs">
      <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm">
        <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
          <IconPalette size={20} style={{ flexShrink: 0 }} />
          <Box style={{ minWidth: 0 }}>
            <Group gap="xs" align="center" wrap="wrap">
              <Text fz={13} fw={700} c="dark.5">Aspecto de la ficha nutricional</Text>
              {hasChanges && (
                <Group gap={4} align="center" wrap="nowrap">
                  <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                  <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                </Group>
              )}
            </Group>
            <Text size="xs" c="dimmed">Se aplica a la ficha en pantalla y al PDF exportado.</Text>
          </Box>
        </Group>
        {!readOnly && hasChanges && (
          <Button size="xs" radius="xl" color="nutralabColor.8" loading={saving} leftSection={<IconDeviceFloppy size={14} />} onClick={onSave}>
            Guardar colores
          </Button>
        )}
      </Group>

      <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: '0.5px' }}>Temas</Text>
      <SimpleGrid cols={{ base: 2, xs: 3, md: 4 }} spacing="sm" mb="md">
        {PLAN_THEME_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            selected={matched?.id === preset.id}
            disabled={readOnly}
            onSelect={(p) => onChange({ ...p.colors })}
          />
        ))}
      </SimpleGrid>

      <Group gap="xs" mb={customOpen ? 'sm' : 'md'}>
        <Button
          size="xs"
          radius="xl"
          variant="default"
          onClick={() => setCustomOpen((o) => !o)}
          rightSection={<IconChevronDown size={14} style={{ transform: customOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />}
        >
          {matched ? 'Personalizar colores' : 'Colores personalizados'}
        </Button>
        {!matched && <Text size="xs" c="dimmed">Combinación propia (no coincide con ningún tema).</Text>}
      </Group>

      <Collapse expanded={customOpen}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
          {COLOR_GROUPS.map((group) => (
            <Box key={group.title}>
              <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: '0.5px' }}>{group.title}</Text>
              <Stack gap="xs">
                {group.fields.map(([key, label]) => (
                  <ColorInput
                    key={key}
                    label={label}
                    value={colors[key]}
                    onChange={(v) => onChange({ ...colors, [key]: v })}
                    readOnly={readOnly}
                    format="hex"
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Collapse>

      {issues.length > 0 && (
        <Group gap={8} align="flex-start" wrap="nowrap" mb="md" p="xs" style={{ borderRadius: 10, backgroundColor: 'var(--mantine-color-orange-0)', border: '1px solid var(--mantine-color-orange-2)' }}>
          <IconAlertTriangle size={16} color="var(--mantine-color-orange-7)" style={{ flexShrink: 0, marginTop: 2 }} />
          <Box>
            <Text size="xs" fw={700} c="orange.8">Algunos textos se leen con dificultad</Text>
            {issues.map((issue) => (
              <Text key={`${issue.fg}-${issue.bg}`} size="xs" c="orange.9">
                {issue.label} (contraste {issue.ratio.toFixed(1)}:1, mínimo {issue.min}:1)
              </Text>
            ))}
          </Box>
        </Group>
      )}

      <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: '0.5px' }}>Vista previa</Text>
      <Box style={{ maxHeight: 620, overflowY: 'auto', borderRadius: 18 }}>
        <PlanFicha data={samplePlan} jugador={previewPlayer} themeColors={resolvePlanColors(colors)} />
      </Box>
    </Paper>
  );
}
