'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  MultiSelect,
  Select,
  Box,
} from '@mantine/core';
import { IconCheck, IconX, IconCooking } from '@/components/icons3d';
import ResponsiveModal from './ResponsiveModal';
import {
  getTreeProteinaOptions,
  getTreeHidratoOptions,
} from '@/config/food-tree-options';
import { formatAstToText } from '@/lib/engine/meal-ast';

function ensureOptionsContain(options, currentValues) {
  if (!currentValues) return options;
  const valuesArray = Array.isArray(currentValues) ? currentValues : [currentValues];
  const allExistingValues = new Set();
  options.forEach((group) => {
    if (group.items) {
      group.items.forEach((it) => allExistingValues.add(typeof it === 'string' ? it : it.value));
    } else if (group.value) {
      allExistingValues.add(group.value);
    }
  });

  const missing = valuesArray.filter((v) => v && !allExistingValues.has(v));
  if (missing.length === 0) return options;

  return [
    {
      group: 'Valores Actuales Registrados',
      items: missing.map((m) => ({ value: m, label: m })),
    },
    ...options,
  ];
}

export default function EditDishDecompositionModal({
  opened,
  onClose,
  dish, // { nombre, tree }
  onSave,
}) {
  const [nombre, setNombre] = useState('');
  const [proteina, setProteina] = useState([]);
  const [hidrato, setHidrato] = useState(null);

  useEffect(() => {
    if (dish) {
      setNombre(dish.nombre || '');
      const items = [];
      const visit = (node) => {
        if (!node) return;
        if (node.type === 'food') {
          items.push(node);
          return;
        }
        (node.children || []).forEach(visit);
      };
      visit(dish.tree);
      setProteina(items.filter((item) => item.category === 'proteina').map((item) => item.name));
      setHidrato(items.find((item) => item.category === 'hidratos')?.name || null);
    }
  }, [dish]);

  const baseProteinaOptions = useMemo(() => getTreeProteinaOptions(), []);
  const baseHidratoOptions = useMemo(() => getTreeHidratoOptions(), []);

  const proteinaOptions = useMemo(() => ensureOptionsContain(baseProteinaOptions, proteina), [baseProteinaOptions, proteina]);
  const hidratoOptions = useMemo(() => ensureOptionsContain(baseHidratoOptions, hidrato), [baseHidratoOptions, hidrato]);
  function handleSave() {
    const children = [
      ...(hidrato ? [{ type: 'food', category: 'hidratos', name: hidrato }] : []),
      ...proteina.map((name) => ({ type: 'food', category: 'proteina', name })),
    ];
    const updated = {
      nombre: nombre.trim(),
      tree: { type: 'allOf', label: nombre.trim() || 'Plato', children },
    };

    onSave(updated);
    onClose();
  }

  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCooking size={18} />
          <Text fw={700} size="sm" c="dark.5">
            Ajustar desglose taxonómico del plato
          </Text>
        </Group>
      }
      centered
      radius="lg"
      size="lg"
      styles={{
        header: {
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          paddingBottom: 'var(--mantine-spacing-xs)',
          marginBottom: 'var(--mantine-spacing-sm)',
        },
      }}
    >
      <Stack gap="md">
        <Paper p="xs" radius="md" bg="gray.0" withBorder style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
            Plato del Comedor
          </Text>
          <Text size="sm" fw={700} c="dark.4">{formatAstToText(dish?.tree) || nombre}</Text>
        </Paper>

        <Stack gap="sm">
          {/* Proteína */}
          <Box>
            <Group gap={6} mb={4}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-6)' }} />
              <Text size="xs" fw={600} c="dark.4">
                Proteína (Corte específico o concepto genérico)
              </Text>
            </Group>
            <MultiSelect
              data={proteinaOptions}
              value={proteina}
              onChange={setProteina}
              placeholder="Seleccionar proteínas (ej. Pechuga de pollo, Solomillo, Merluza...)"
              searchable
              clearable
              nothingFoundMessage="No se encontró ningún alimento"
              radius="md"
              size="xs"
            />
          </Box>

          {/* Hidrato de Carbono */}
          <Box>
            <Group gap={6} mb={4}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-6)' }} />
              <Text size="xs" fw={600} c="dark.4">
                Hidrato / Cereal base (Genérico adaptable o específico)
              </Text>
            </Group>
            <Select
              data={hidratoOptions}
              value={hidrato}
              onChange={setHidrato}
              placeholder="Seleccionar hidrato (ej. Pasta genérica, Arroz, Patata, Quinoa...)"
              searchable
              clearable
              nothingFoundMessage="No se encontró ningún hidrato"
              radius="md"
              size="xs"
            />
          </Box>

          <Text size="xs" c="dimmed">
            Para editar este plato completo o representar alternativas, utiliza el AST generado y revisa la pauta en lugar de simplificarlo a un formulario de dos campos.
          </Text>

        </Stack>

        <Group justify="flex-end" gap="xs" mt="xs">
          <Button variant="light" color="gray" size="xs" radius="xl" onClick={onClose} leftSection={<IconX size={14} />}>
            Cancelar
          </Button>
          <Button color="teal" size="xs" radius="xl" onClick={handleSave} leftSection={<IconCheck size={14} />}>
            Guardar cambios
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}
