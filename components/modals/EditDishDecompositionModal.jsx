'use client';

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Textarea,
  Alert,
} from '@mantine/core';
import { IconCheck, IconX, IconCooking, IconSparkles, IconAlertCircle } from '@/components/icons3d';
import ResponsiveModal from './ResponsiveModal';
import { interpretDishTree } from '@/actions/menuActions';
import { formatAstToText } from '@/lib/engine/meal-ast';

/**
 * Edita el AST de un plato del comedor: descripción libre → IA → AST (allOf / oneOf / food).
 */
export default function EditDishDecompositionModal({
  opened,
  onClose,
  dish, // { nombre, tree }
  onSave,
}) {
  const [aiText, setAiText] = useState('');
  const [tree, setTree] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (dish) {
      setTree(dish.tree || null);
      setAiText(dish.tree ? formatAstToText({ tree: dish.tree }) : dish.nombre || '');
      setAiError(null);
    }
  }, [dish]);

  async function handleInterpretWithAI() {
    if (!aiText.trim()) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const data = await interpretDishTree({ nombre: dish?.nombre, text: aiText });
      if (!data?.success) {
        setAiError(data?.error || 'No se pudo interpretar el plato.');
        return;
      }
      setTree(data.tree);
    } catch (err) {
      setAiError(err.message || 'Error al conectar con el servicio de IA.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSave() {
    if (!tree) return;
    onSave({ nombre: dish?.nombre || tree.label || 'Plato', tree });
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
            Ajustar ingredientes del plato
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
            {dish?.nombre}
          </Text>
        </Paper>

        <Paper p="sm" withBorder radius="sm" bg="blue.0">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Group gap={6}>
                <IconSparkles size={16} color="#1c7ed6" />
                <Text size="xs" fw={700} c="blue.9">
                  Asistente de Clasificación con IA
                </Text>
              </Group>
              <Button
                size="compact-xs"
                variant="filled"
                color="blue"
                radius="xl"
                leftSection={<IconSparkles size={13} />}
                onClick={handleInterpretWithAI}
                loading={isAnalyzing}
              >
                Interpretar con IA
              </Button>
            </Group>

            <Textarea
              placeholder="Describe los ingredientes del plato... Ej: Pechuga de pollo con arroz o patata y ensalada"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              minRows={2}
              maxRows={3}
              size="xs"
            />

            {aiError && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Aviso de interpretación"
                color="red"
                variant="light"
                p="xs"
              >
                <Text size="xs">{aiError}</Text>
              </Alert>
            )}
          </Stack>
        </Paper>

        <Paper p="sm" withBorder radius="md" bg="gray.0">
          <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={4}>
            Estructura del plato
          </Text>
          <Text size="xs" fw={700} c="dark.8">
            {tree ? formatAstToText({ tree }) : 'Sin estructurar'}
          </Text>
        </Paper>

        <Group justify="flex-end" gap="xs" mt="xs">
          <Button variant="light" color="gray" size="xs" radius="xl" onClick={onClose} leftSection={<IconX size={14} />}>
            Cancelar
          </Button>
          <Button color="teal" size="xs" radius="xl" onClick={handleSave} disabled={!tree} leftSection={<IconCheck size={14} />}>
            Guardar cambios
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}
