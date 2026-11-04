import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconChevronDown } from '@tabler/icons-react';
import { IconCalendar, IconNotes, IconPlus, IconTrash } from '@/components/icons3d';

import ModalFooter from '@/components/modals/ModalFooter';
import { savePlayerMeal } from '@/actions/mealActions';
import { getFoods } from '@/actions/foodActions';
import { compressFoodPhoto } from '@/lib/utils/compress';
import {
  DISH_PHOTO_PREFIX,
  MAX_MEAL_DISHES,
  hasDishContent,
  parseIngredients,
  roundMacro,
  rowsFromIngredients,
  suggestMealType,
  summarizeDishes,
} from '@/lib/nutrition/mealDishes';
import { notifications } from '@mantine/notifications';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';
import MealDishFields from './MealDishFields';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'midMorning', label: 'Almuerzo' },
  { value: 'lunch', label: 'Comida' },
  { value: 'snack', label: 'Merienda' },
  { value: 'dinner', label: 'Cena' },
  { value: 'lateSnack', label: 'Re-cena' },
  { value: 'extra', label: 'Snack' },
];

const COLLAPSE_MS = 220;
const FOOTER_PADDING = 'calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom, 0px))';
const MAX_MEAL_PHOTO_BYTES = 6 * 1024 * 1024;
// Por debajo de `serverActions.bodySizeLimit` (8 MB): el resto del formulario también viaja
const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;
const SUPPORTED_MEAL_PHOTO_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const macroToField = (value) => (value != null && Number.isFinite(Number(value)) ? String(roundMacro(Number(value))) : '');
const numberToField = (value) => (value != null ? String(value) : '');

let idSequence = 0;
const nextId = () => {
  idSequence += 1;
  return idSequence;
};

const newDish = (data = {}) => ({
  key: nextId(),
  id: null,
  dishName: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  ingredients: '',
  rows: [],
  file: null,
  photoUrl: null,
  removePhoto: false,
  legacyPhoto: false,
  ...data,
});

const savedDishFields = (source) => ({
  dishName: source?.dishName || '',
  calories: numberToField(source?.calories),
  protein: macroToField(source?.protein),
  carbs: macroToField(source?.carbs),
  fat: macroToField(source?.fat),
  ingredients: Array.isArray(source?.ingredients) ? source.ingredients.join('\n') : '',
  photoUrl: source?.photoUrl || null,
});

// Los registros sin platos (anteriores o precargados del plan) se editan como un único plato
function dishesFromMeal(meal) {
  if (meal?.dishes?.length) {
    return meal.dishes.map((dish) => newDish({ id: dish.id, ...savedDishFields(dish) }));
  }
  return [newDish({ ...savedDishFields(meal), legacyPhoto: Boolean(meal?.id && meal?.photoUrl) })];
}

const isSupportedMealPhoto = (file) => {
  if (!file) return false;
  return SUPPORTED_MEAL_PHOTO_MIMES.has(file.type) && file.size <= MAX_MEAL_PHOTO_BYTES;
};

const normalizeMealPhoto = async (file) => {
  if (!file) return null;

  try {
    const compressedFile = await compressFoodPhoto(file);
    if (isSupportedMealPhoto(compressedFile)) return compressedFile;

    notifications.show({
      title: 'Formato de imagen no compatible',
      message: 'Prueba con una foto JPG, PNG o WebP.',
      color: 'yellow',
    });
    return null;
  } catch (err) {
    console.log(err);

    if (isSupportedMealPhoto(file)) {
      notifications.show({
        title: 'La imagen no se pudo comprimir',
        message: 'Se enviará tal cual; si pesa mucho, prueba con una más pequeña.',
        color: 'yellow',
        autoClose: 5000,
      });
      return file;
    }

    notifications.show({
      title: 'Formato de imagen no compatible',
      message: 'Ese archivo no se puede enviar al servidor. Prueba con una foto JPG, PNG o WebP.',
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
  const [foods, setFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getFoods()
      .then((items) => {
        if (active) setFoods(items || []);
      })
      .catch((err) => console.error('Error cargando alimentos:', err))
      .finally(() => {
        if (active) setFoodsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const [takenAt, setTakenAt] = useState(new Date());
  const [mealType, setMealType] = useState('');
  const [notes, setNotes] = useState('');
  const [dishes, setDishes] = useState(() => [newDish()]);
  const [openDishKey, setOpenDishKey] = useState(null);
  const addedDishKey = useRef(null);

  useEffect(() => {
    const date = meal?.takenAt ? new Date(meal.takenAt) : new Date();
    const nextDishes = dishesFromMeal(meal);
    setSaving(false);
    setTakenAt(date);
    setMealType(meal?.mealType || suggestMealType(date));
    setNotes(meal?.notes || '');
    setDishes(nextDishes);
    setOpenDishKey(nextDishes[0].key);
  }, [meal]);

  // Los alimentos llegan después que el formulario: en un efecto aparte para no pisar lo escrito
  useEffect(() => {
    if (!foods.length) return;
    setDishes((current) => current.map((dish) => (
      dish.rows.length
        ? dish
        : { ...dish, rows: rowsFromIngredients(parseIngredients(dish.ingredients), foods, nextId) }
    )));
  }, [foods, meal]);

  const foodOptions = useMemo(
    () => foods.map((food) => ({ value: food.id, label: food.name })),
    [foods]
  );

  const total = useMemo(
    () => summarizeDishes(dishes.map((dish) => ({ ...dish, ingredients: [] }))),
    [dishes]
  );

  const multipleDishes = dishes.length > 1;

  const updateDish = (key, change) => {
    setDishes((current) => current.map((dish) => (dish.key === key ? change(dish) : dish)));
  };

  const addDish = () => {
    const dish = newDish();
    addedDishKey.current = dish.key;
    setDishes((current) => [...current, dish]);
    setOpenDishKey(dish.key);
  };

  // Al plegarse el plato anterior, el nuevo podría quedar fuera de la vista
  const revealAddedDish = (key) => (node) => {
    if (!node || addedDishKey.current !== key) return;
    addedDishKey.current = null;
    setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'start' }), COLLAPSE_MS);
  };

  const removeDish = (key) => {
    const remaining = dishes.filter((dish) => dish.key !== key);
    setDishes(remaining);
    if (openDishKey === key) setOpenDishKey(remaining[remaining.length - 1]?.key ?? null);
  };

  const handlePhoto = async (key, files) => {
    const photo = await normalizeMealPhoto(files?.[0]);
    if (photo) updateDish(key, (dish) => ({ ...dish, file: photo, removePhoto: false }));
  };

  const removePhoto = (key) => {
    updateDish(key, (dish) => ({
      ...dish,
      file: null,
      photoUrl: null,
      removePhoto: Boolean(dish.id),
      legacyPhoto: false,
    }));
  };

  const handleSubmit = async () => {
    if (!mealType) {
      notifications.show({
        title: 'Falta el tipo de ingesta',
        message: 'Indica si es desayuno, comida, snack...',
        color: 'yellow',
      });
      return;
    }

    const filledDishes = dishes.filter(hasDishContent);
    const dishesToSave = filledDishes.length ? filledDishes : dishes.slice(0, 1);
    const photos = dishesToSave.map((dish) => (isSupportedMealPhoto(dish.file) ? dish.file : null));

    if (photos.reduce((sum, photo) => sum + (photo?.size || 0), 0) > MAX_UPLOAD_BYTES) {
      notifications.show({
        title: 'Las fotos pesan demasiado',
        message: 'Quita alguna foto o usa imágenes más pequeñas.',
        color: 'yellow',
      });
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
      fd.append('mealType', mealType);
      fd.append('notes', notes);

      fd.append('dishes', JSON.stringify(dishesToSave.map((dish) => ({
        id: dish.id,
        dishName: dish.dishName,
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat,
        ingredients: parseIngredients(dish.ingredients),
        removePhoto: dish.removePhoto,
        legacyPhoto: dish.legacyPhoto,
      }))));
      photos.forEach((photo, index) => {
        if (photo) fd.append(`${DISH_PHOTO_PREFIX}${index}`, photo, photo.name || 'meal.jpg');
      });

      if (meal?.id) fd.append('id', meal.id);

      await savePlayerMeal(jugadorId, fd);

      notifySaved({
        title: meal?.id ? 'Comida modificada' : 'Comida registrada',
        message: total.calories ? `${total.calories} kcal en el diario.` : 'La ingesta se guardó en el diario.',
        color: 'green',
      });
      onSuccess?.();

    } catch (e) {
      console.error(e);
      notifications.show({
        title: 'No se pudo guardar la comida',
        message: errorMessage(e, 'Ha ocurrido un error al guardar la comida.'),
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Stack gap={6}>
        <Text fw={500} size="sm">
          Ingesta{' '}
          <Text span c="red">*</Text>
        </Text>
        <SimpleGrid cols={{ base: 4, sm: 7 }} spacing={6} verticalSpacing={6}>
          {MEAL_TYPES.map((type) => {
            const selected = mealType === type.value;
            return (
              <Button
                key={type.value}
                size="sm"
                radius="xl"
                px={2}
                fz={{ base: 11, xs: 'xs' }}
                variant={selected ? 'filled' : 'light'}
                color={selected ? 'dark' : 'gray'}
                aria-pressed={selected}
                onClick={() => setMealType(type.value)}
              >
                {type.label}
              </Button>
            );
          })}
        </SimpleGrid>
        {mealType === 'extra' && (
          <Text size="xs" c="dimmed">Para lo que tomes entre horas: un café, una pieza de fruta...</Text>
        )}
      </Stack>

      <DateTimePicker
        label="Fecha y hora"
        value={takenAt}
        onChange={setTakenAt}
        variant="filled"
        radius="md"
        leftSection={<IconCalendar size={16} />}
      />

      {multipleDishes ? (
        <Stack gap="sm">
          {dishes.map((dish, index) => {
            const isOpen = openDishKey === dish.key;
            return (
              <Paper key={dish.key} ref={revealAddedDish(dish.key)} withBorder radius="lg" p="sm">
                <Group gap="xs" wrap="nowrap">
                  <UnstyledButton
                    onClick={() => setOpenDishKey(isOpen ? null : dish.key)}
                    aria-expanded={isOpen}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <IconChevronDown
                        size={16}
                        color="var(--mantine-color-gray-6)"
                        style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
                      />
                      <Text size="sm" fw={700} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                        {dish.dishName.trim() || `Plato ${index + 1}`}
                      </Text>
                      {Number(dish.calories) > 0 && (
                        <Text size="xs" fw={700} c="orange.7" style={{ flexShrink: 0 }}>
                          {dish.calories} kcal
                        </Text>
                      )}
                    </Group>
                  </UnstyledButton>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    radius="xl"
                    onClick={() => removeDish(dish.key)}
                    aria-label={`Quitar plato ${index + 1}`}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <Collapse expanded={isOpen}>
                  <Box pt="sm">
                    <MealDishFields
                      dish={dish}
                      foods={foods}
                      foodsLoading={foodsLoading}
                      foodOptions={foodOptions}
                      nextId={nextId}
                      onChange={(change) => updateDish(dish.key, change)}
                      onPhoto={(files) => handlePhoto(dish.key, files)}
                      onRemovePhoto={() => removePhoto(dish.key)}
                    />
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <MealDishFields
          dish={dishes[0]}
          foods={foods}
          foodsLoading={foodsLoading}
          foodOptions={foodOptions}
          nextId={nextId}
          onChange={(change) => updateDish(dishes[0].key, change)}
          onPhoto={(files) => handlePhoto(dishes[0].key, files)}
          onRemovePhoto={() => removePhoto(dishes[0].key)}
        />
      )}

      <Stack gap={4}>
        <Button
          variant="light"
          color="gray"
          radius="xl"
          fullWidth
          leftSection={<IconPlus size={16} />}
          onClick={addDish}
          disabled={dishes.length >= MAX_MEAL_DISHES}
        >
          {dishes.length >= MAX_MEAL_DISHES ? `Máximo ${MAX_MEAL_DISHES} platos por ingesta` : 'Añadir otro plato'}
        </Button>
        {!multipleDishes && (
          <Text size="xs" c="dimmed" ta="center">Segundo, postre, bebida... cada uno con su foto</Text>
        )}
      </Stack>

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

      <ModalFooter gap="xs" style={{ paddingBottom: FOOTER_PADDING }}>
        {multipleDishes && (
          <Group w="100%" justify="space-between" wrap="nowrap" gap="xs">
            <Text size="sm" fw={700}>Total</Text>
            <Text size="xs" c="dimmed" ta="right" style={{ flex: 1, minWidth: 0 }}>
              P {Math.round(total.protein ?? 0)} · HC {Math.round(total.carbs ?? 0)} · G {Math.round(total.fat ?? 0)} g
            </Text>
            <Text size="sm" fw={800} c="orange.7" style={{ flexShrink: 0 }}>{total.calories ?? 0} kcal</Text>
          </Group>
        )}
        <Button variant="subtle" color="gray" onClick={onCancel} radius="xl" px={{ base: 'xs', sm: 'lg' }} flex={{ base: 1, sm: 'none' }}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving} color="dark" radius="xl" px="xl" flex={{ base: 2, sm: 'none' }}>
          Guardar
        </Button>
      </ModalFooter>
    </Stack>
  );
}
