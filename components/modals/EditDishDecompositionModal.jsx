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
  getTreeVerduraOptions,
  getTreeFrutaOptions,
  getTreeLacteoOptions,
  getTreeGrasaOptions,
} from '@/config/food-tree-options';
import { convertDishToAst } from '@/lib/engine/meal-ast';
import { getCanonicalFoodLabel } from '@/lib/engine';

function ensureOptionsContain(options, currentValues) {
  if (!options) return [];
  const valuesArray = Array.isArray(currentValues) ? currentValues : currentValues ? [currentValues] : [];
  const allExistingValues = new Set();
  options.forEach((group) => {
    if (group.items) {
      group.items.forEach((it) => allExistingValues.add(typeof it === 'string' ? it : it.value));
    } else if (group.value) {
      allExistingValues.add(group.value);
    }
  });

  const missing = valuesArray.filter((v) => v && !allExistingValues.has(v));
  const combined = missing.length > 0
    ? [
      {
        group: 'Valores Actuales Registrados',
        items: missing.map((m) => ({ value: m, label: m })),
      },
      ...options,
    ]
    : options;

  // Defensive deduplication across all groups to guarantee Mantine receives unique option values
  const seenValues = new Set();
  return combined
    .map((group) => {
      if (group.items) {
        const uniqueItems = group.items.filter((it) => {
          const val = typeof it === 'string' ? it : it.value;
          if (!val || seenValues.has(val)) return false;
          seenValues.add(val);
          return true;
        });
        return { ...group, items: uniqueItems };
      }
      const val = typeof group === 'string' ? group : group.value;
      if (!val || seenValues.has(val)) return null;
      seenValues.add(val);
      return group;
    })
    .filter((g) => g && (!g.items || g.items.length > 0));
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
  const [verdura, setVerdura] = useState([]);
  const [fruta, setFruta] = useState([]);
  const [lacteo, setLacteo] = useState([]);
  const [grasa, setGrasa] = useState(null);

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

      setProteina(items.filter((item) => ['proteina', 'proteinas'].includes(item.category)).map((item) => getCanonicalFoodLabel(item.name)));
      setHidrato(getCanonicalFoodLabel(items.find((item) => ['hidratos', 'hidrato'].includes(item.category))?.name) || null);
      setVerdura(items.filter((item) => ['verduras', 'verdura'].includes(item.category)).map((item) => getCanonicalFoodLabel(item.name)));
      setFruta(items.filter((item) => ['frutas', 'fruta'].includes(item.category)).map((item) => getCanonicalFoodLabel(item.name)));
      setLacteo(items.filter((item) => ['lacteos', 'lacteo'].includes(item.category)).map((item) => getCanonicalFoodLabel(item.name)));
      setGrasa(getCanonicalFoodLabel(items.find((item) => ['grasas', 'grasa'].includes(item.category))?.name) || null);
    }
  }, [dish]);

  const baseProteinaOptions = useMemo(() => getTreeProteinaOptions(), []);
  const baseHidratoOptions = useMemo(() => getTreeHidratoOptions(), []);
  const baseVerduraOptions = useMemo(() => getTreeVerduraOptions(), []);
  const baseFrutaOptions = useMemo(() => getTreeFrutaOptions(), []);
  const baseLacteoOptions = useMemo(() => getTreeLacteoOptions(), []);
  const baseGrasaOptions = useMemo(() => getTreeGrasaOptions(), []);

  const proteinaOptions = useMemo(() => ensureOptionsContain(baseProteinaOptions, proteina), [baseProteinaOptions, proteina]);
  const hidratoOptions = useMemo(() => ensureOptionsContain(baseHidratoOptions, hidrato), [baseHidratoOptions, hidrato]);
  const verduraOptions = useMemo(() => ensureOptionsContain(baseVerduraOptions, verdura), [baseVerduraOptions, verdura]);
  const frutaOptions = useMemo(() => ensureOptionsContain(baseFrutaOptions, fruta), [baseFrutaOptions, fruta]);
  const lacteoOptions = useMemo(() => ensureOptionsContain(baseLacteoOptions, lacteo), [baseLacteoOptions, lacteo]);
  const grasaOptions = useMemo(() => ensureOptionsContain(baseGrasaOptions, grasa), [baseGrasaOptions, grasa]);

  function handleSave() {
    const dishLabel = (nombre || dish?.nombre || 'Plato').trim();
    const updated = {
      nombre: dishLabel,
      tree: convertDishToAst({
        nombre: dishLabel,
        hidrato,
        proteina,
        verdura,
        fruta,
        lacteo,
        grasa,
      }),
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
            Ajustar ingredientes y desglose del plato
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
          <Text size="sm" fw={700} c="dark.5">
            {dish?.nombre || nombre}
          </Text>
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
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
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
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
            />
          </Box>

          {/* Verduras y Hortalizas */}
          <Box>
            <Group gap={6} mb={4}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-teal-6)' }} />
              <Text size="xs" fw={600} c="dark.4">
                Verduras y Hortalizas
              </Text>
            </Group>
            <MultiSelect
              data={verduraOptions}
              value={verdura}
              onChange={setVerdura}
              placeholder="Seleccionar verduras (ej. Tomate, Calabacín, Espinacas, Brócoli...)"
              searchable
              clearable
              nothingFoundMessage="No se encontró ninguna verdura"
              radius="md"
              size="xs"
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
            />
          </Box>

          {/* Frutas */}
          <Box>
            <Group gap={6} mb={4}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-orange-6)' }} />
              <Text size="xs" fw={600} c="dark.4">
                Fruta (Postres o fresca)
              </Text>
            </Group>
            <MultiSelect
              data={frutaOptions}
              value={fruta}
              onChange={setFruta}
              placeholder="Seleccionar fruta (ej. Fruta fresca genérica, Plátano, Manzana...)"
              searchable
              clearable
              nothingFoundMessage="No se encontró ninguna fruta"
              radius="md"
              size="xs"
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
            />
          </Box>

          {/* Lácteos y Yogures */}
          <Box>
            <Group gap={6} mb={4}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-cyan-6)' }} />
              <Text size="xs" fw={600} c="dark.4">
                Lácteos y Yogures (Postres o complementos)
              </Text>
            </Group>
            <MultiSelect
              data={lacteoOptions}
              value={lacteo}
              onChange={setLacteo}
              placeholder="Seleccionar lácteo (ej. Yogur proteico natural, Kéfir, Queso fresco...)"
              searchable
              clearable
              nothingFoundMessage="No se encontró ningún lácteo"
              radius="md"
              size="xs"
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
            />
          </Box>

          {/* Grasa saludable */}
          <Box>
            <Group gap={6} mb={4}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-yellow-6)' }} />
              <Text size="xs" fw={600} c="dark.4">
                Grasa de cocinado / aliño
              </Text>
            </Group>
            <Select
              data={grasaOptions}
              value={grasa}
              onChange={setGrasa}
              placeholder="AOVE, Aguacate, Frutos secos o sin grasa"
              clearable
              radius="md"
              size="xs"
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
            />
          </Box>
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
