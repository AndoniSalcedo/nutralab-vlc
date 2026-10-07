'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import WidgetCard from './WidgetCard';

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
    const next = { ...suppChecks, [id]: !suppChecks[id] };
    setSuppChecks(next);
    try {
      localStorage.setItem(
        `vlc_supp_checklist_${jugadorId}`,
        JSON.stringify({
          date: new Date().toDateString(),
          checks: next,
        })
      );
    } catch { }
  };

  const completedCount = useMemo(() => {
    return list.filter((s) => Boolean(suppChecks[s.id])).length;
  }, [suppChecks, list]);

  const totalCount = list.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <WidgetCard
      id="widget-suplementacion"
      color="salvia"
      icon="suplementacion"
      title="Suplementos diarios"
      footer={isAllDone ? '¡Todo tomado!' : `${completedCount}/${totalCount} tomas`}
      footerAction="Suplementación"
      onFooterAction={() => router.push(`/dashboard/jugador/${jugadorId}/nutricion/suplementacion`)}
    >
      {/* Lista de tomas interactivas */}
      <Stack gap={6}>
        {list.map((item) => {
          const isChecked = Boolean(suppChecks[item.id]);
          return (
            <UnstyledButton
              key={item.id}
              onClick={() => handleToggle(item.id)}
              px={4}
              py={6}
              style={{
                borderRadius: '8px',
                backgroundColor: isChecked ? 'rgba(108, 112, 90, 0.08)' : 'transparent',
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
                        isChecked ? 'var(--nutra-lima-dark, #4a6813)' : 'rgba(108, 112, 90, 0.25)'
                      }`,
                      backgroundColor: isChecked ? 'var(--nutra-lima, #C1F080)' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--nutra-bosque, #1F2A24)',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && <IconCheck size={13} stroke={3} />}
                  </Box>
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      fz="xs"
                      fw={600}
                      c={isChecked ? 'dimmed' : 'dark.5'}
                      td={isChecked ? 'line-through' : undefined}
                      truncate
                    >
                      {item.name}
                    </Text>
                    <Text fz={11} c="dimmed" truncate>
                      {item.dose}
                    </Text>
                  </Box>
                </Group>

              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>

    </WidgetCard>
  );
}
