'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { IconCheck, IconPill } from '@tabler/icons-react';

const DEFAULT_SUPPLEMENTS = [
  { id: 'cafeina', name: 'Cafeína Anhidra', dose: '200 mg', timing: '45m pre-partido / sesión intensa' },
  { id: 'creatina', name: 'Creatina Creapure', dose: '5 g', timing: 'Post-sesión con carbohidratos' },
  { id: 'beta_alanina', name: 'Beta-Alanina', dose: '3.2 g', timing: 'Comida principal (tampón láctico)' },
  { id: 'whey', name: 'Whey Protein Isolate', dose: '30 g', timing: 'Ventana de recuperación muscular' },
  { id: 'omega3_d3', name: 'Omega 3 + Vitamina D3', dose: '2 cáp + 2000 UI', timing: 'Desayuno (inmunidad y articulaciones)' },
];

export default function SuplementacionWidget({
  jugadorId,
  supplementList = DEFAULT_SUPPLEMENTS,
}) {
  const router = useRouter();
  const list = supplementList && supplementList.length > 0 ? supplementList : DEFAULT_SUPPLEMENTS;
  const [suppChecks, setSuppChecks] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined' || !jugadorId) return;
    try {
      const todayKey = new Date().toDateString();
      const saved = localStorage.getItem(`vlc_supp_checklist_${jugadorId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayKey) {
          setSuppChecks(parsed.checks || {});
        } else {
          localStorage.removeItem(`vlc_supp_checklist_${jugadorId}`);
        }
      }
    } catch (e) {
      console.error('Error cargando suplementos guardados:', e);
    }
  }, [jugadorId]);

  const handleToggle = (id) => {
    setSuppChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(
          `vlc_supp_checklist_${jugadorId}`,
          JSON.stringify({
            date: new Date().toDateString(),
            checks: next,
          })
        );
      } catch { }
      return next;
    });
  };

  const completedCount = useMemo(() => {
    return list.filter((s) => Boolean(suppChecks[s.id])).length;
  }, [suppChecks, list]);

  const totalCount = list.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <Paper shadow="xs" radius="lg" p="md" bg="white" withBorder style={{ height: '100%' }}>
      {/* Cabecera del widget */}
      <Group justify="space-between" align="center" mb={6}>
        <Group gap="xs" align="center">
          <ThemeIcon color="grape" variant="light" size="sm" radius="md">
            <IconPill size={14} />
          </ThemeIcon>
          <Text fw={700} fz="sm" c="dark.5">
            Suplementación diaria
          </Text>
        </Group>
        <Text fz="xs" fw={750} c={isAllDone ? 'teal.7' : 'grape.7'}>
          {isAllDone ? '¡Todos completados!' : `${completedCount}/${totalCount} listos`}
        </Text>
      </Group>

      {/* Barra de progreso de tomas diarias */}
      <Progress
        value={progressPct}
        color={isAllDone ? 'teal' : 'grape'}
        size="xs"
        radius="xl"
        mb="sm"
        bg="gray.1"
      />

      {/* Lista de tomas interactivas */}
      <Stack gap={6}>
        {list.map((item) => {
          const isChecked = Boolean(suppChecks[item.id]);
          return (
            <UnstyledButton
              key={item.id}
              onClick={() => handleToggle(item.id)}
              p="xs"
              style={{
                borderRadius: '8px',
                backgroundColor: isChecked ? 'var(--mantine-color-gray-0)' : 'transparent',
                transition: 'background-color 0.15s ease',
                display: 'block',
                width: '100%',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  <Box
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '6px',
                      border: `1.5px solid ${
                        isChecked ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-4)'
                      }`,
                      backgroundColor: isChecked ? 'var(--mantine-color-teal-6)' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && <IconCheck size={13} stroke={3} />}
                  </Box>
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      fz="xs"
                      fw={650}
                      c={isChecked ? 'dimmed' : 'dark.6'}
                      td={isChecked ? 'line-through' : undefined}
                      truncate
                    >
                      {item.name}
                    </Text>
                    <Text fz="10px" c="dimmed" truncate>
                      {item.timing}
                    </Text>
                  </Box>
                </Group>

                <Text
                  fz="xs"
                  fw={700}
                  c={isChecked ? 'dimmed' : 'dark.4'}
                  td={isChecked ? 'line-through' : undefined}
                  style={{ flexShrink: 0, paddingLeft: 8 }}
                >
                  {item.dose}
                </Text>
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>

      {/* Footer */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="10px" c="dimmed" fw={500}>
          Toca cada suplemento para marcarlo
        </Text>
        <Text
          fz="10px"
          fw={700}
          c="grape.7"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/nutricion/suplementacion`)}
        >
          Protocolo completo →
        </Text>
      </Group>
    </Paper>
  );
}
