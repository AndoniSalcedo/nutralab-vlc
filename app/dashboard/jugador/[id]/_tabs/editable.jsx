'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  MultiSelect,
  Checkbox,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';
import { updatePlayerField } from '@/services/player';
import { useRouter } from 'next/navigation';
import { AVAILABLE_MEALS, STANDARD_MEALS } from '@/lib/nutrition-day-types';

export function CampoEditable({ label, campo, valor, jugadorId, tipo = 'textarea', opciones, readOnly = false }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(valor || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVal(valor || '');
  }, [valor]);

  async function save() {
    setSaving(true);
    try {
      await updatePlayerField(jugadorId, campo, val);
      setEditing(false);
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Campo guardado',
        message: `${label} se ha actualizado correctamente.`,
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <BentoCard title={label} icon={IconEdit} color="gray" style={{ height: 'auto' }}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Box style={{ flex: 1 }}>
            {editing ? (
              tipo === 'select' ? (
                <Select data={opciones} value={val} onChange={setVal} size="sm" />
              ) : tipo === 'text' ? (
                <TextInput value={val} onChange={(e) => setVal(e.target.value)} size="sm" />
              ) : (
                <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={3} size="sm" />
              )
            ) : (
              <Text size="sm" c={val ? 'dark' : 'dimmed'}>
                {tipo === 'select' && val && opciones
                  ? (opciones.find((o) => (o.value || o) === val)?.label || val)
                  : (val || 'Sin especificar')}
              </Text>
            )}
          </Box>

          {!readOnly && (
            <Group gap={6}>
              {!editing ? (
                <Button variant="subtle" size="xs" radius="xl" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                  <Button variant="filled" size="xs" radius="xl" onClick={save} loading={saving}>
                    Guardar
                  </Button>
                </>
              )}
            </Group>
          )}
        </Group>
      </Stack>
    </BentoCard>
  );
}

function parseMeals(val) {
  if (!val) return [];
  if (!isNaN(Number(val))) {
    const count = Number(val);
    return STANDARD_MEALS.slice(0, Math.min(count, 5));
  }
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

export function ComidasEditable({ label, numComidas, postentreno, jugadorId, recomendacionesDefecto = {}, readOnly = false }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [meals, setMeals] = useState(() => parseMeals(numComidas));
  const [hasPost, setHasPost] = useState(Boolean(postentreno));
  const [recsDefecto, setRecsDefecto] = useState(() => recomendacionesDefecto || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMeals(parseMeals(numComidas));
    setHasPost(Boolean(postentreno));
    setRecsDefecto(recomendacionesDefecto || {});
  }, [numComidas, postentreno, recomendacionesDefecto]);

  const MEAL_OPTIONS = AVAILABLE_MEALS;

  async function save() {
    setSaving(true);
    try {
      const mealsValue = meals.join(', ');
      await updatePlayerField(jugadorId, 'num_comidas', mealsValue);
      await updatePlayerField(jugadorId, 'postentreno', hasPost);
      await updatePlayerField(jugadorId, 'recomendaciones_defecto', recsDefecto);
      setEditing(false);
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Comidas guardadas',
        message: 'Las comidas, la opción de post-entreno y las recomendaciones por defecto se han actualizado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setMeals(parseMeals(numComidas));
    setHasPost(Boolean(postentreno));
    setRecsDefecto(recomendacionesDefecto || {});
    setEditing(false);
  }

  const displayMeals = meals.length > 0 ? meals.join(', ') : 'Ninguna seleccionada';

  return (
    <BentoCard title={label} icon={IconEdit} color="gray" style={{ height: 'auto' }}>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1 }}>
            {editing ? (
              <Stack gap="xs">
                <MultiSelect
                  label="Distribución de comidas"
                  placeholder="Ej. Desayuno, Merienda, Cena"
                  data={MEAL_OPTIONS}
                  value={meals}
                  onChange={(val) => {
                    setMeals(val);
                    // Also clean up any recommendations for meals that are deselected
                    setRecsDefecto((prev) => {
                      const clean = { ...prev };
                      Object.keys(clean).forEach((k) => {
                        if (!val.includes(k)) delete clean[k];
                      });
                      return clean;
                    });
                  }}
                  size="sm"
                  searchable
                  clearable
                />
                <Checkbox
                  label="Post-entreno"
                  checked={hasPost}
                  onChange={(event) => setHasPost(event.currentTarget.checked)}
                  mt="xs"
                  size="sm"
                />
              </Stack>
            ) : (
              <Stack gap="xs">
                <Text size="sm">
                  <Text span fw={600} c="dimmed">Comidas: </Text>
                  {displayMeals}
                </Text>
                <Text size="sm">
                  <Text span fw={600} c="dimmed">Post-entreno: </Text>
                  {hasPost ? 'Sí' : 'No'}
                </Text>
              </Stack>
            )}
          </Box>

          {!readOnly && (
            <Box style={{ minWidth: editing ? '90px' : 'auto', marginTop: editing ? '20px' : '0' }}>
              {!editing ? (
                <Button variant="subtle" size="xs" radius="xl" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              ) : (
                <Stack gap={6} align="stretch">
                  <Button variant="filled" size="xs" radius="xl" onClick={save} loading={saving}>
                    Guardar
                  </Button>
                  <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </Group>

        {editing ? (
          meals.filter((m) => m.toLowerCase() !== 'post-entreno').length > 0 && (
            <Paper p="xs" withBorder bg="gray.0" mt="xs">
              <Text size="xs" fw={700} mb="xs">Recomendaciones por defecto:</Text>
              <Stack gap="xs">
                {meals.filter((m) => m.toLowerCase() !== 'post-entreno').map((meal) => (
                  <TextInput
                    key={meal}
                    label={meal}
                    placeholder={`Ej. Tostadas de aguacate con pavo...`}
                    value={recsDefecto[meal] || ''}
                    onChange={(e) => setRecsDefecto((prev) => ({ ...prev, [meal]: e.target.value }))}
                    size="xs"
                  />
                ))}
              </Stack>
            </Paper>
          )
        ) : (
          Object.values(recsDefecto).some((v) => v) && (
            <Box mt="xs">
              <Text size="sm" fw={600} c="dimmed" mb={4}>Recomendaciones por defecto:</Text>
              <Stack gap={4}>
                {Object.entries(recsDefecto).filter((entry) => entry[1]).map(([m, val]) => (
                  <Text key={m} size="xs">
                    <Text span fw={600}>{m}: </Text>
                    {val}
                  </Text>
                ))}
              </Stack>
            </Box>
          )
        )}
      </Stack>
    </BentoCard>
  );
}

export function EditableSection({ title, defaultValue, onSave, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
      setEditing(false);
      notifications.show({
        color: 'green',
        title: 'Sección guardada',
        message: `${title} se ha actualizado correctamente.`,
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper radius="lg" p="md" withBorder shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
          <Group gap="xs">
            {!readOnly && (
              !editing ? (
                <Button variant="light" size="xs" radius="xl" onClick={() => setEditing(true)} leftSection={<IconEdit size={14} />}>
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                  <Button variant="filled" size="xs" radius="xl" onClick={handleSave} loading={saving}>
                    Guardar
                  </Button>
                </>
              )
            )}
          </Group>
        </Group>

        {editing ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={15}
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
