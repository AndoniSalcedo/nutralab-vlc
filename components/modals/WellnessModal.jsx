'use client';

import { useEffect, useState } from 'react';
import { Button, Group, SimpleGrid, Stack, Text, Textarea, UnstyledButton } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import { WELLNESS_ITEMS, WELLNESS_KEYS, wellnessScoreColor as scoreColor } from '@/config/wellness';
import ResponsiveModal from './ResponsiveModal';

function ScorePicker({ item, value, onChange }) {
  return (
    <Stack gap={6}>
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text fz="sm" fw={700} c="dark.5">{item.label}</Text>
        <Text fz="xs" fw={600} c={value ? scoreColor(value) : 'dimmed'}>
          {value ? item.options[value - 1] : 'Sin valorar'}
        </Text>
      </Group>
      {item.hint && <Text fz="xs" c="dimmed" lh={1.35}>{item.hint}</Text>}
      <SimpleGrid cols={5} spacing={6}>
        {item.options.map((option, idx) => {
          const score = idx + 1;
          const active = value === score;
          return (
            <UnstyledButton
              key={option}
              aria-label={`${item.label}: ${score} - ${option}`}
              aria-pressed={active}
              onClick={() => onChange(score)}
              style={{
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 15,
                border: `1.5px solid var(--mantine-color-${active ? 'teal-6' : 'gray-3'})`,
                background: active ? 'var(--mantine-color-teal-6)' : 'white',
                color: active ? 'white' : 'var(--mantine-color-dark-4)',
                transition: 'all 0.15s ease',
              }}
            >
              {score}
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

export default function WellnessModal({ opened, onClose, initial, onSubmit, saving }) {
  const [values, setValues] = useState({});
  const [molestia, setMolestia] = useState(null);
  const [detalle, setDetalle] = useState('');

  useEffect(() => {
    if (!opened) return;
    const next = {};
    WELLNESS_KEYS.forEach((key) => { next[key] = initial?.[key] ? Number(initial[key]) : null; });
    setValues(next);
    setMolestia(initial ? Boolean(initial.molestia) : null);
    setDetalle(initial?.molestia_detalle || '');
  }, [opened, initial]);

  const modalTitle = (
    <Group gap="xs" align="center" wrap="nowrap">
      <Icon3D name="heart" size={22} />
      <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6">¿Cómo estás hoy?</Text>
    </Group>
  );

  const complete = WELLNESS_KEYS.every((key) => values[key]) && molestia !== null && (!molestia || detalle.trim());

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={modalTitle} size="md" radius="xl">
      <Stack gap="md">
        {WELLNESS_ITEMS.map((item) => (
          <ScorePicker
            key={item.key}
            item={item}
            value={values[item.key]}
            onChange={(score) => setValues((prev) => ({ ...prev, [item.key]: score }))}
          />
        ))}

        <Stack gap={6} pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Text fz="sm" fw={700} c="dark.5" pt="xs">
            ¿Tienes alguna molestia o dolor que pueda afectar al entrenamiento?
          </Text>
          <Group grow gap="xs">
            <Button variant={molestia === false ? 'filled' : 'default'} color="teal" onClick={() => setMolestia(false)}>
              No
            </Button>
            <Button variant={molestia === true ? 'filled' : 'default'} color="red" onClick={() => setMolestia(true)}>
              Sí
            </Button>
          </Group>
          {molestia && (
            <Textarea
              label="¿Dónde y qué intensidad tiene?"
              placeholder="Ej.: gemelo derecho, molestia leve al esprintar"
              value={detalle}
              onChange={(e) => setDetalle(e.currentTarget.value)}
              maxLength={280}
              autosize
              minRows={2}
            />
          )}
        </Stack>

        <Button
          fullWidth
          color="teal"
          radius="md"
          disabled={!complete}
          loading={saving}
          onClick={() => onSubmit({ ...values, molestia, molestia_detalle: molestia ? detalle.trim() : null })}
        >
          Guardar
        </Button>
      </Stack>
    </ResponsiveModal>
  );
}
