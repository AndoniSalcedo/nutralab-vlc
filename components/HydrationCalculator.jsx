'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Group,
  Stack,
  Text,
  Title,
  ThemeIcon,
  RingProgress,
  Center,
  ActionIcon,
  Button,
  Box,
  Badge,
  Paper
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconDroplet, IconBottle, IconCup, IconCheck, IconRotate, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { BentoCard } from './BentoItem';
import { calculateHydration, getTeamNutritionDayTypes } from '@/lib/calculations';


export default function HydrationCalculator({ jugador }) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const teamConfig = jugador?.equipos?.configuracion_nutricional;
  const dayTypes = useMemo(() => getTeamNutritionDayTypes(teamConfig), [teamConfig]);

  const [targetType, setTargetType] = useState('descanso');
  const [consumed, setConsumed] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // If targetType is not in dayTypes, reset it to the first valid one when dayTypes changes
  useEffect(() => {
    if (dayTypes.length && !dayTypes.some(d => d.key === targetType)) {
      setTargetType(dayTypes[0].key);
    }
  }, [dayTypes]);

  // Calcular objetivos
  const peso = Number(jugador?.peso_kg || 75);
  const targets = useMemo(() => {
    const out = {};
    dayTypes.forEach(d => {
      out[d.key] = calculateHydration(peso, d.key);
    });
    return out;
  }, [peso, dayTypes]);

  const currentTarget = targets[targetType] || 3000;
  const percentage = Math.min(100, Math.round((consumed / currentTarget) * 100));
  const isGoalReached = percentage >= 100;

  const activeIdx = Math.max(0, dayTypes.findIndex(d => d.key === targetType));
  const activeDay = dayTypes[activeIdx] || { label: '', color: 'blue' };



  useEffect(() => {
    setIsClient(true);
    const today = new Date().toISOString().split('T')[0];
    const key = `hydration_${jugador?.id}_${today}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConsumed(parsed.consumed || 0);
        if (parsed.targetType) setTargetType(parsed.targetType);
      } catch (e) {
        console.error('Error parseando hydration', e);
      }
    } else {
      // Limpiar datos antiguos
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(`hydration_${jugador?.id}_`) && k !== key) {
          localStorage.removeItem(k);
        }
      });
    }
  }, [jugador?.id]);

  const saveToStorage = (newConsumed, newTargetType) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `hydration_${jugador?.id}_${today}`;
    localStorage.setItem(key, JSON.stringify({ consumed: newConsumed, targetType: newTargetType }));
  };

  const addWater = (amount) => {
    const newConsumed = consumed + amount;
    setConsumed(newConsumed);
    saveToStorage(newConsumed, targetType);
  };

  const handleTargetChange = (val) => {
    setTargetType(val);
    saveToStorage(consumed, val);
  };

  const reset = () => {
    setConsumed(0);
    saveToStorage(0, targetType);
  };

  if (!isClient) return null; // Evitar hydration mismatch (Next.js SSR)

  return (
    <BentoCard title="Control de Hidratación" icon={IconDroplet} color="blue">
      <Stack gap="lg" mt="sm">

        <Paper withBorder p="md" radius="xl" bg="var(--mantine-color-white)">
          <Group justify="space-between" align="center" wrap="nowrap">
            {/* Left arrow */}
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="lg"
              onClick={() => {
                const prevIdx = (activeIdx - 1 + dayTypes.length) % dayTypes.length;
                handleTargetChange(dayTypes[prevIdx].key);
              }}
              style={{ transition: 'transform 0.1s ease' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <IconChevronLeft size={22} stroke={2} />
            </ActionIcon>

            {/* Active Day Type & Indicator Dots Wrapper */}
            <Stack gap="xs" style={{ flex: 1 }} align="center">
              <Badge
                variant="light"
                color={activeDay.color || 'blue'}
                size="lg"
                radius="xl"
                py="md"
                px="xl"
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  textTransform: 'none',
                }}
              >
                {activeDay.label} · {(currentTarget / 1000).toFixed(2)} L
              </Badge>

              {/* Indicator Dots */}
              <Group gap={6} justify="center" mt={4}>
                {dayTypes.map((dt, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <Box
                      key={dt.key}
                      onClick={() => handleTargetChange(dt.key)}
                      style={{
                        width: isActive ? '20px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: isActive
                          ? `var(--mantine-color-${activeDay.color || 'blue'}-6)`
                          : 'var(--mantine-color-gray-3)',
                        cursor: 'pointer',
                        transition: 'width 0.2s ease, background-color 0.2s ease',
                      }}
                    />
                  );
                })}
              </Group>
            </Stack>

            {/* Right arrow */}
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="lg"
              onClick={() => {
                const nextIdx = (activeIdx + 1) % dayTypes.length;
                handleTargetChange(dayTypes[nextIdx].key);
              }}
              style={{ transition: 'transform 0.1s ease' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <IconChevronRight size={22} stroke={2} />
            </ActionIcon>
          </Group>
        </Paper>

        <Group justify="center" wrap={isMobile ? 'wrap' : 'nowrap'} align="center">
          <RingProgress
            size={180}
            thickness={16}
            roundCaps
            sections={[{ value: percentage, color: isGoalReached ? 'green' : 'blue' }]}
            label={
              <Center>
                <Stack gap={0} align="center">
                  {isGoalReached ? (
                    <ThemeIcon color="green" variant="light" radius="xl" size="xl">
                      <IconCheck size={26} />
                    </ThemeIcon>
                  ) : (
                    <>
                      <Title order={2} c="blue" lh={1}>{percentage}%</Title>
                      <Text size="xs" c="dimmed" fw={600} tt="uppercase">Completado</Text>
                    </>
                  )}
                </Stack>
              </Center>
            }
          />

          <Stack gap={4} justify="center">
            <Text size="xl" fw={800} c={isGoalReached ? 'green' : 'dark'}>
              {(consumed / 1000).toFixed(2)} L
            </Text>
            <Text size="sm" c="dimmed" fw={500} lh={1}>
              de {(currentTarget / 1000).toFixed(2)} L objetivo
            </Text>

            {isGoalReached && (
              <Badge color="green" variant="light" mt="xs">¡Objetivo Diario Cumplido!</Badge>
            )}
          </Stack>
        </Group>

        <Box bg="gray.0" p="md" style={{ borderRadius: '12px' }}>
          <Group justify="space-between" align="center" mb="xs">
            <Text size="sm" fw={600} c="dark.4">Añadir consumo rápido</Text>
            <ActionIcon variant="subtle" color="gray" onClick={reset} size="sm" title="Reiniciar contador">
              <IconRotate size={16} />
            </ActionIcon>
          </Group>

          <Group gap="sm" grow>
            <Button
              variant="white"
              color="blue"
              size="xs"
              radius="xl"
              onClick={() => addWater(250)}
              leftSection={<IconCup size={16} />}
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              +250 ml
            </Button>
            <Button
              variant="white"
              color="blue"
              size="xs"
              radius="xl"
              onClick={() => addWater(500)}
              leftSection={<IconBottle size={16} />}
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              +500 ml
            </Button>
            <Button
              variant="white"
              color="blue"
              size="xs"
              radius="xl"
              onClick={() => addWater(1000)}
              leftSection={<IconBottle size={18} />}
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              +1 L
            </Button>
          </Group>
        </Box>
      </Stack>
    </BentoCard>
  );
}
