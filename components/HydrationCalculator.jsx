'use client';

import { useState, useEffect } from 'react';
import { 
  Paper, 
  Group, 
  Stack, 
  Text, 
  Title, 
  ThemeIcon, 
  RingProgress, 
  Center, 
  ActionIcon,
  Button,
  SegmentedControl,
  Box,
  Badge
} from '@mantine/core';
import { IconDroplet, IconBottle, IconCup, IconCheck, IconRotate } from '@tabler/icons-react';
import { BentoCard } from './Bento/BentoItem';

export default function HydrationCalculator({ jugador }) {
  const [targetType, setTargetType] = useState('descanso');
  const [consumed, setConsumed] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Calcular objetivos
  const peso = Number(jugador?.peso_kg || 75);
  const aguaBase = Math.round(peso * 40); // ml
  const aguaEntreno = Math.round(peso * 6); // ml extra
  const aguaPartido = Math.round(peso * 10); // ml extra

  const TARGETS = {
    descanso: aguaBase,
    entreno: aguaBase + aguaEntreno,
    partido: aguaBase + aguaPartido
  };

  const currentTarget = TARGETS[targetType];
  const percentage = Math.min(100, Math.round((consumed / currentTarget) * 100));
  const isGoalReached = percentage >= 100;

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
        
        <SegmentedControl
          value={targetType}
          onChange={handleTargetChange}
          data={[
            { label: 'Descanso', value: 'descanso' },
            { label: 'Entreno', value: 'entreno' },
            { label: 'Partido', value: 'partido' },
          ]}
          fullWidth
          radius="md"
          color="blue"
        />

        <Group justify="center" wrap="nowrap">
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
