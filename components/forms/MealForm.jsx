import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Stack,
  Select,
  Box,
  Text,
  TextInput,
  NumberInput,
  Textarea,
  Group,
  Image,
  Button,
  rem,
  ThemeIcon,
  Paper,
  ActionIcon,
  Badge,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Dropzone } from '@mantine/dropzone';
import {
  IconX,
  IconPlus,
  IconTrash,
  IconFlame,
  IconCalendar,
  IconToolsKitchen2,
  IconNotes,
  IconCamera,
  IconCalculator,
  IconScale,
} from '@tabler/icons-react';

import { savePlayerMeal } from '@/services/meal';
import { compressFoodPhoto } from '@/lib/compress';
import { notifications } from '@mantine/notifications';
import foods from '@/data/foods';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'midMorning', label: 'Almuerzo' },
  { value: 'lunch', label: 'Comida' },
  { value: 'snack', label: 'Merienda' },
  { value: 'dinner', label: 'Cena' },
  { value: 'lateSnack', label: 'Re-cena' },
];

const MAX_MEAL_PHOTO_BYTES = 6 * 1024 * 1024;
const SUPPORTED_MEAL_PHOTO_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const calcNutrient = (food, grams, key) => {
  const value = Number(food?.[key]);
  const qty = Number(grams);

  if (!Number.isFinite(value) || !Number.isFinite(qty)) return 0;
  return (value * qty) / 100;
};

const roundMacro = (value) => Math.round(value * 10) / 10;

const isSupportedMealPhoto = (file) => {
  if (!file) return false;
  return SUPPORTED_MEAL_PHOTO_MIMES.has(file.type) && file.size <= MAX_MEAL_PHOTO_BYTES;
};

const normalizeMealPhoto = async (file) => {
  if (!file) return null;

  try {
    const compressedFile = await compressFoodPhoto(file);
    return isSupportedMealPhoto(compressedFile) ? compressedFile : null;
  } catch (err) {
    console.log(err);

    if (isSupportedMealPhoto(file)) {
      notifications.show({
        title: 'La imagen no se pudo comprimir',
        message: 'Se guardará sin foto para evitar un fallo al enviar la comida.',
        color: 'yellow',
        autoClose: 5000,
      });
      return file;
    }

    notifications.show({
      title: 'Formato de imagen no compatible',
      message: 'Ese archivo no se puede enviar al servidor. Se guardará la comida sin foto.',
      color: 'yellow',
      autoClose: 5000,
    });

    return null;
  }
};

const toValidDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : null;
};

export default function MealForm({ jugadorId, meal, onSuccess, onCancel }) {
  const [saving, setSaving] = useState(false);

  const [takenAt, setTakenAt] = useState(new Date());
  const [dishName, setDishName] = useState('');
  const [mealType, setMealType] = useState('');
  const [calories, setCalories] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [notes, setNotes] = useState('');

  const [foodValue, setFoodValue] = useState(null);
  const [foodGrams, setFoodGrams] = useState(100);
  const [calculatedFoods, setCalculatedFoods] = useState([]);

  const [file, setFile] = useState(null);
  const dzRef = useRef(null);
  const calcIdRef = useRef(0);

  useEffect(() => {
    setSaving(false);
    setTakenAt(meal?.takenAt ? new Date(meal.takenAt) : new Date());
    setDishName(meal?.dishName || '');
    setMealType(meal?.mealType || '');
    setCalories(meal?.calories != null ? String(meal.calories) : '');
    setIngredients(Array.isArray(meal?.ingredients) ? meal.ingredients.join(', ') : '');
    setNotes(meal?.notes || '');
    setFoodValue(null);
    setFoodGrams(100);
    setFile(null);

    // Parse ingredients to restore calculatedFoods
    const initialCalculated = [];
    let nextId = 1;
    if (Array.isArray(meal?.ingredients)) {
      for (const ingredientStr of meal.ingredients) {
        const match = ingredientStr.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*g\)$/i);
        if (match) {
          const foodName = match[1].trim();
          const grams = parseFloat(match[2]);
          const foundFood = foods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
          if (foundFood && !isNaN(grams)) {
            initialCalculated.push({
              id: nextId++,
              food: foundFood,
              grams: roundMacro(grams)
            });
          }
        }
      }
    }
    calcIdRef.current = nextId;
    setCalculatedFoods(initialCalculated);
  }, [meal]);

  const foodOptions = useMemo(
    () => foods.map((food, index) => ({
      value: String(index),
      label: food.name,
    })),
    []
  );

  const calculatedTotals = useMemo(() => calculatedFoods.reduce((acc, item) => ({
    kcal: acc.kcal + calcNutrient(item.food, item.grams, 'kcal'),
    cho: acc.cho + calcNutrient(item.food, item.grams, 'cho'),
    pro: acc.pro + calcNutrient(item.food, item.grams, 'pro'),
    fat: acc.fat + calcNutrient(item.food, item.grams, 'fat'),
  }), { kcal: 0, cho: 0, pro: 0, fat: 0 }), [calculatedFoods]);

  const syncCalculatedFields = (nextFoods) => {
    const nextTotals = nextFoods.reduce((acc, item) => ({
      kcal: acc.kcal + calcNutrient(item.food, item.grams, 'kcal'),
      cho: acc.cho + calcNutrient(item.food, item.grams, 'cho'),
      pro: acc.pro + calcNutrient(item.food, item.grams, 'pro'),
      fat: acc.fat + calcNutrient(item.food, item.grams, 'fat'),
    }), { kcal: 0, cho: 0, pro: 0, fat: 0 });

    setCalories(nextFoods.length ? String(Math.round(nextTotals.kcal)) : '');
    setIngredients(nextFoods.map((item) => `${item.food.name} (${item.grams} g)`).join(', '));
  };

  const handleAddCalculatedFood = () => {
    const food = foods[Number(foodValue)];
    const grams = Number(foodGrams);

    if (!food || !Number.isFinite(grams) || grams <= 0) {
      notifications.show({
        title: 'Completa el ingrediente',
        message: 'Selecciona un alimento de la biblioteca e indica los gramos.',
        color: 'yellow',
      });
      return;
    }

    const nextFoods = [
      ...calculatedFoods,
      { id: calcIdRef.current += 1, food, grams: roundMacro(grams) },
    ];

    setCalculatedFoods(nextFoods);
    syncCalculatedFields(nextFoods);
    setFoodValue(null);
    setFoodGrams(100);
  };

  const updateCalculatedFoodGrams = (id, gramsValue) => {
    const grams = Number(gramsValue);
    const nextFoods = calculatedFoods.map((item) => (
      item.id === id ? { ...item, grams: Number.isFinite(grams) ? grams : 0 } : item
    ));

    setCalculatedFoods(nextFoods);
    syncCalculatedFields(nextFoods);
  };

  const removeCalculatedFood = (id) => {
    const nextFoods = calculatedFoods.filter((item) => item.id !== id);

    setCalculatedFoods(nextFoods);
    syncCalculatedFields(nextFoods);
  };

  const handleFileDrop = async (files) => {
    let droppedFile = files?.[0];
    if (!droppedFile) return;

    droppedFile = await normalizeMealPhoto(droppedFile);
    setFile(droppedFile);
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!mealType) {
      alert('Selecciona el tipo de ingesta');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();

      const takenAtDate = toValidDate(takenAt);
      if (takenAt && !takenAtDate) {
        notifications.show({
          title: 'Fecha no válida',
          message: 'Revisa la fecha y hora de la comida antes de guardarla.',
          color: 'red',
        });
        return;
      }
      if (takenAtDate) fd.append('takenAt', takenAtDate.toISOString());

      const cleanDishName = dishName.trim();
      if (cleanDishName) fd.append('dishName', cleanDishName);
      fd.append('mealType', mealType);

      // Ingredientes
      const txt = (ingredients ?? '').trim();
      let asJson = null;
      if (txt.startsWith('[')) {
        try {
          const arr = JSON.parse(txt);
          if (Array.isArray(arr)) asJson = JSON.stringify(arr);
        } catch { /**/ }
      }
      if (!asJson) {
        const arr = txt.split(/[\n,]/g).map(s => s.trim()).filter(Boolean);
        asJson = JSON.stringify(arr);
      }
      fd.append('ingredients', asJson);

      // Calorías
      if (calories !== '' && calories != null) {
        const val = Number(calories);
        if (Number.isFinite(val) && val > 0) fd.append('calories', String(Math.round(val)));
      }

      if (notes) fd.append('notes', notes);

      if (file && isSupportedMealPhoto(file)) {
        fd.append('photo', file, file.name || 'meal.jpg');
      }

      if (meal?.id) {
        fd.append('id', meal.id);
      }

      await savePlayerMeal(jugadorId, fd);

      notifications.show({
        title: meal?.id ? 'Comida modificada' : 'Comida registrada',
        message: meal?.id ? 'La ingesta se actualizó correctamente.' : 'La ingesta se guardó en el diario.',
        color: 'green',
      });

      onSuccess?.();

    } catch (e) {
      console.error(e);
      alert('No se pudo guardar la comida');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Box>
        <Group justify="space-between" mb={4}>
          <Text fw={600} size="sm">Fotografía del plato (opcional)</Text>
        </Group>

        {file || meal?.photoUrl ? (
          <Paper
            withBorder
            radius="lg"
            shadow="sm"
            style={{ overflow: 'hidden', position: 'relative' }}
            w="100%"
            bg="gray.1"
          >
            <Image
              src={file ? URL.createObjectURL(file) : meal?.photoUrl}
              h={220}
              w="100%"
              fit="cover"
              alt=''
              onLoad={(e) => {
                if (file) URL.revokeObjectURL(e.currentTarget.src);
              }}
            />

            {file && (
              <ActionIcon
                variant="filled"
                color="dark"
                radius="xl"
                size="lg"
                onClick={clearFile}
                style={{ position: 'absolute', top: 10, right: 10, opacity: 0.8 }}
              >
                <IconX size={20} />
              </ActionIcon>
            )}
          </Paper>
        ) : (
          <Dropzone
            openRef={dzRef}
            accept={{ 'image/*': [] }}
            multiple={false}
            onDrop={handleFileDrop}
            maxSize={6 * 1024 ** 2}
            radius="lg"
            styles={{
              root: {
                border: '2px dashed var(--mantine-color-violet-3)',
                backgroundColor: 'var(--mantine-color-violet-0)',
                padding: 0,
                minHeight: rem(140),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'var(--mantine-color-violet-1)',
                }
              },
              inner: { pointerEvents: 'all', width: '100%' }
            }}
          >
            <Stack align="center" gap="xs">
              <ThemeIcon
                size={50}
                radius="xl"
                variant="transparent"
                color="dark"
              >
                <IconCamera size={28} />
              </ThemeIcon>
              <Stack gap={0} align="center">
                <Text size="sm" fw={700} c="dark.4">
                  Sube una foto para tener registro
                </Text>
                <Text size="xs" c="dimmed">
                  La imagen se guardará junto a esta ingesta
                </Text>
              </Stack>
            </Stack>
          </Dropzone>
        )}
      </Box>

      <DateTimePicker
        label="Fecha y hora"
        value={takenAt}
        onChange={setTakenAt}
        variant="filled"
        radius="md"
        leftSection={<IconCalendar size={16} />}
      />

      <Select
        label="Ingesta"
        placeholder="Selecciona"
        data={MEAL_TYPES}
        value={mealType}
        onChange={setMealType}
        variant="filled"
        radius="md"
        leftSection={<IconToolsKitchen2 size={16} />}
        withAsterisk
      />

      <TextInput
        label="Nombre del plato"
        placeholder="Ej: arroz con pollo, tortilla francesa..."
        value={dishName}
        onChange={(e) => setDishName(e.currentTarget.value)}
        variant="filled"
        radius="md"
      />

      <Paper withBorder radius="lg" p="md" bg="gray.0">
        <Stack gap="sm">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <ThemeIcon variant="light" color="green" radius="xl">
                <IconCalculator size={18} />
              </ThemeIcon>
              <Box>
                <Text fw={700} size="sm">Calculadora de ingredientes</Text>
                <Text size="xs" c="dimmed">Valores por 100 g desde la biblioteca</Text>
              </Box>
            </Group>
            {calculatedFoods.length > 0 && (
              <Badge color="orange" variant="light" leftSection={<IconFlame size={12} />}>
                {Math.round(calculatedTotals.kcal)} kcal
              </Badge>
            )}
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Select
              placeholder="Buscar alimento"
              data={foodOptions}
              value={foodValue}
              onChange={setFoodValue}
              searchable
              clearable
              limit={25}
              variant="filled"
              radius="md"
              nothingFoundMessage="No hay alimentos"
            />
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <NumberInput
                placeholder="Gramos"
                value={foodGrams}
                onChange={setFoodGrams}
                min={1}
                step={10}
                variant="filled"
                radius="md"
                leftSection={<IconScale size={16} />}
                rightSection={<Text size="xs" c="dimmed" mr="xs">g</Text>}
                style={{ flex: 1 }}
              />
              <ActionIcon
                size={36}
                radius="xl"
                color="dark"
                variant="filled"
                onClick={handleAddCalculatedFood}
                aria-label="Añadir ingrediente"
              >
                <IconPlus size={18} />
              </ActionIcon>
            </Group>
          </SimpleGrid>

          {calculatedFoods.length > 0 && (
            <>
              <Divider />
              <Stack gap="xs">
                {calculatedFoods.map((item) => {
                  const itemKcal = calcNutrient(item.food, item.grams, 'kcal');

                  return (
                    <Paper key={item.id} withBorder radius="md" p="xs" bg="white">
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text size="sm" fw={600} lineClamp={1}>{item.food.name}</Text>
                          <Text size="xs" c="dimmed">
                            {Math.round(itemKcal)} kcal · P {roundMacro(calcNutrient(item.food, item.grams, 'pro'))} g · C {roundMacro(calcNutrient(item.food, item.grams, 'cho'))} g · G {roundMacro(calcNutrient(item.food, item.grams, 'fat'))} g
                          </Text>
                        </Box>
                        <Group gap={6} wrap="nowrap">
                          <NumberInput
                            value={item.grams}
                            onChange={(value) => updateCalculatedFoodGrams(item.id, value)}
                            min={1}
                            step={10}
                            w={92}
                            size="xs"
                            radius="md"
                            rightSection={<Text size="xs" c="dimmed" mr={4}>g</Text>}
                          />
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            radius="xl"
                            onClick={() => removeCalculatedFood(item.id)}
                            aria-label="Quitar ingrediente"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
              <SimpleGrid cols={3} spacing="xs">
                <Badge variant="light" color="blue">Prot {roundMacro(calculatedTotals.pro)} g</Badge>
                <Badge variant="light" color="orange">Carb {roundMacro(calculatedTotals.cho)} g</Badge>
                <Badge variant="light" color="yellow">Grasa {roundMacro(calculatedTotals.fat)} g</Badge>
              </SimpleGrid>
            </>
          )}
        </Stack>
      </Paper>

      <NumberInput
        label={
          <Group gap={4}>
            Energía estimada
          </Group>
        }
        placeholder="0"
        value={calories}
        onChange={setCalories}
        min={0}
        step={10}
        variant="filled"
        radius="md"
        leftSection={<IconFlame size={16} />}
        rightSection={<Text size="xs" c="dimmed" mr="xs">kcal</Text>}
      />

      <Textarea
        label={
          <Group gap={4}>
            Ingredientes
          </Group>
        }
        description="Puedes editar el resultado si no es correcto"
        placeholder="Ej: 2 huevos, pan integral..."
        autosize
        minRows={2}
        value={ingredients}
        onChange={(e) => setIngredients(e.currentTarget.value)}
        variant="filled"
        radius="md"
      />

      <Textarea
        label="Notas adicionales"
        placeholder="¿Cómo te sentiste? ¿Algo a destacar?"
        autosize
        minRows={2}
        value={notes}
        onChange={(e) => setNotes(e.currentTarget.value)}
        variant="filled"
        radius="md"
        leftSection={<IconNotes size={16} />}
      />

      <Group justify="flex-end" mt="md">
        <Button variant="subtle" color="gray" onClick={onCancel} radius="xl">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving} color="dark" radius="xl" px="xl">
          Guardar
        </Button>
      </Group>
    </Stack>
  );
}
