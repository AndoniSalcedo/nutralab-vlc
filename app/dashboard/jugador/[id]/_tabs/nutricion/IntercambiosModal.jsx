'use client';

import { useState, useMemo } from 'react';
import {
  Modal,
  ScrollArea,
  TextInput,
  NumberInput,
  Select,
  Alert,
  Text,
  Title,
  Group,
  Stack,
  Box,
  Button,
  Paper,
  SimpleGrid,
  SegmentedControl,
  ThemeIcon,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSearch,
  IconCalculator,
  IconScale,
  IconArrowsLeftRight,
  IconInfoCircle,
  IconRefresh,
} from '@tabler/icons-react';
import FoodCalculator from '@/components/FoodCalculator';

const INTERCAMBIOS_DATA = {
  proteinas: {
    titulo: 'Proteínas',
    emoji: '🥩',
    baseLabel: 'Equivalencia por 30 g de proteína neta',
    baseValue: 30,
    unit: 'g',
    alimentos: [
      { name: 'Pechuga de pollo', qty: 170, note: '', type: 'default' },
      { name: 'Contramuslo de pollo (sin piel)', qty: 190, note: '', type: 'default' },
      { name: 'Pechuga de pavo', qty: 170, note: '', type: 'default' },
      { name: 'Conejo', qty: 200, note: '', type: 'default' },
      { name: 'Ternera magra (solomillo, redondo)', qty: 170, note: 'Máx. 2 veces/semana', type: 'warning' },
      { name: 'Lomo de cerdo', qty: 175, note: '', type: 'default' },
      { name: 'Merluza', qty: 200, note: '', type: 'default' },
      { name: 'Bacalao fresco', qty: 200, note: '', type: 'default' },
      { name: 'Lenguado', qty: 210, note: '', type: 'default' },
      { name: 'Dorada / lubina', qty: 195, note: '', type: 'default' },
      { name: 'Rape', qty: 200, note: '', type: 'default' },
      { name: 'Salmón', qty: 180, note: 'Tu primera opción — máximo omega-3', type: 'success' },
      { name: 'Atún fresco', qty: 175, note: '', type: 'default' },
      { name: 'Caballa', qty: 185, note: '', type: 'default' },
      { name: 'Sardinas frescas', qty: 190, note: '', type: 'default' },
      { name: 'Boquerones frescos', qty: 185, note: '', type: 'default' },
    ],
    alertText: 'El pescado azul (salmón, atún, caballa, sardinas, boquerones) debe aparecer en tu dieta un mínimo de 3-4 veces por semana. En tu situación de lesión activa es prioritario por su efecto antiinflamatorio (EPA+DHA).',
  },
  carbohidratos: {
    titulo: 'Carbohidratos',
    emoji: '🍚',
    baseLabel: 'Equivalencia por 100 g de HC netos',
    baseValue: 100,
    unit: 'g',
    alimentos: [
      { name: 'Pan blanco / baguette', qty: 130, note: 'Opción desayuno', type: 'info' },
      { name: 'Pan de masa madre', qty: 130, note: 'Buena tolerancia digestiva', type: 'info' },
      { name: 'Pan integral', qty: 120, note: 'Evítalo en MD-1 y MD-2', type: 'warning' },
      { name: 'Avena en copos', qty: 75, note: '', type: 'default' },
      { name: 'Arroz blanco (en seco)', qty: 100, note: 'Referencia comida/cena', type: 'primary' },
      { name: 'Arroz blanco (cocido)', qty: 285, note: '', type: 'default' },
      { name: 'Pasta (en seco)', qty: 100, note: '', type: 'default' },
      { name: 'Boniato cocido', qty: 270, note: 'Evítalo en MD-1 y MD-2', type: 'warning' },
      { name: 'Patata cocida', qty: 300, note: 'Muy digestiva', type: 'info' },
      { name: 'Tostadas de arroz', qty: 85, note: 'Merienda ideal', type: 'success' },
      { name: 'Plátano maduro', qty: 160, note: 'Post-entrenamiento ideal', type: 'success' },
      { name: 'Arroz rojo', qty: 100, note: 'Disponible en la Ciudad Deportiva', type: 'primary' },
    ],
    alertText: 'Nota sobre MD-1 y MD-2: Limita los alimentos ricos en fibra en los días de partido (Match Day) o el día previo para evitar molestias gastrointestinales y optimizar el vaciado gástrico.',
  },
  grasas: {
    titulo: 'Grasas',
    emoji: '🥑',
    baseLabel: 'Equivalencia por 10 g de grasa',
    baseValue: 10,
    unit: 'g',
    alimentos: [
      { name: 'Aceite de oliva virgen extra', qty: 10, unit: 'ml', note: 'Tu base principal', type: 'success' },
      { name: 'Aguacate', qty: 50, unit: 'g', note: 'Limítalo en déficit', type: 'warning' },
      { name: 'Nueces', qty: 15, unit: 'g', note: 'Rico en omega-3 vegetal', type: 'primary' },
      { name: 'Almendras / avellanas', qty: 15, unit: 'g', note: '', type: 'default' },
      { name: 'Mantequilla de almendra / cacahuete', qty: 15, unit: 'g', note: '', type: 'default' },
    ],
    alertText: 'Las grasas saludables son esenciales para la síntesis hormonal y la salud celular. En tu situación de lesión activa, prioriza grasas ricas en omega-3.',
  },
};

export default function IntercambiosModal({ opened, onClose }) {
  const [activeTab, setActiveTab] = useState('proteinas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcFood, setCalcFood] = useState(null);
  const [calcQty, setCalcQty] = useState(null);

  const isMobile = useMediaQuery('(max-width: 48em)');
  const activeCategory = useMemo(() => INTERCAMBIOS_DATA[activeTab] || null, [activeTab]);

  // Food options for the calculator select dropdown in the active category
  const foodOptions = useMemo(() => {
    if (!activeCategory) return [];
    return activeCategory.alimentos.map((a) => ({
      value: a.name,
      label: a.name,
    }));
  }, [activeCategory]);

  // Selected food item details for calculator
  const selectedFoodObj = useMemo(() => {
    if (!calcFood || !activeCategory) return null;
    return activeCategory.alimentos.find((a) => a.name === calcFood) || null;
  }, [calcFood, activeCategory]);

  // Reset calculator when tab changes or manually
  const resetCalculator = () => {
    setCalcFood(null);
    setCalcQty(null);
  };

  const handleTabChange = (val) => {
    if (!val) return;
    setActiveTab(val);
    setSearchQuery('');
    resetCalculator();
  };

  // Filter and compute equivalents dynamically
  const tableRowsData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!activeCategory) return [];
    let list = activeCategory.alimentos;

    if (query) {
      list = list.filter((a) => a.name.toLowerCase().includes(query));
    }

    return list.map((food) => {
      let calcValue = null;
      let isCalculated = false;

      if (showCalculator && selectedFoodObj && calcQty > 0) {
        const originBase = selectedFoodObj.qty;
        const targetBase = food.qty;
        const result = (targetBase / originBase) * calcQty;
        // Format decimal if very small, otherwise round
        calcValue = result < 15 ? Number(result.toFixed(1)) : Math.round(result);
        isCalculated = true;
      }

      return {
        ...food,
        calcValue,
        isCalculated,
      };
    });
  }, [activeCategory, searchQuery, showCalculator, selectedFoodObj, calcQty]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen={isMobile}
      title={
        <Group gap="xs">
          <ThemeIcon color="dark" variant="light" radius="xl" size="lg">
            <IconArrowsLeftRight size={20} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={3} fw={800} c="dark.4">
              Intercambios
            </Title>
            <Text size="xs" c="dimmed">
              Sustituye alimentos manteniendo el mismo aporte de macronutrientes.
            </Text>
          </Stack>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 4,
      }}
      styles={{
        header: {
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          paddingBottom: 16,
          marginBottom: 16,
        },
        body: {
          paddingTop: 8,
        },
      }}
    >
      <Stack gap="md">
        {/* Navigation Selector in Dark/Black (with adaptive labels for mobile) */}
        <Box bg="gray.0" p="xs" style={{ borderRadius: '12px' }}>
          <SegmentedControl
            value={activeTab}
            onChange={handleTabChange}
            data={[
              { value: 'proteinas', label: isMobile ? '🥩 Prot.' : '🥩 Proteínas' },
              { value: 'carbohidratos', label: isMobile ? '🍚 Carbos' : '🍚 Carbohidratos' },
              { value: 'grasas', label: isMobile ? '🥑 Grasas' : '🥑 Grasas' },
              { value: 'calculadora', label: isMobile ? '🧮 Calcu' : '🧮 Calculadora BEDCA' },
            ]}
            fullWidth
            radius="md"
            color="dark"
            styles={{
              root: { backgroundColor: 'var(--mantine-color-gray-1)' }
            }}
          />
        </Box>

        {activeTab === 'calculadora' ? (
          <FoodCalculator />
        ) : (
          <>
            {/* Controls Bar (stacked on mobile) */}
            <Group justify="space-between" align="stretch" gap="xs" wrap="wrap">
              <TextInput
                placeholder="Buscar alimento..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}
                radius="md"
                clearable
              />

              <Button
                variant={showCalculator ? 'light' : 'default'}
                color="dark"
                radius="xl"
                leftSection={<IconCalculator size={16} />}
                onClick={() => {
                  setShowCalculator(!showCalculator);
                  if (showCalculator) resetCalculator();
                }}
                fullWidth={isMobile}
              >
                {showCalculator ? 'Ocultar calculadora' : 'Calculadora de intercambios'}
              </Button>
            </Group>

            {/* Calculator panel */}
            {showCalculator && (
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Stack gap="xs">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <ThemeIcon color="dark" variant="light" radius="xl" size="md">
                        <IconScale size={16} />
                      </ThemeIcon>
                      <Text fw={800} size="sm" c="dark.5">
                        Calculadora de equivalencias en vivo
                      </Text>
                    </Group>
                    {(calcFood || calcQty) && (
                      <Button
                        variant="subtle"
                        size="xs"
                        color="red"
                        radius="xl"
                        leftSection={<IconRefresh size={12} />}
                        onClick={resetCalculator}
                        compact="true"
                      >
                        Limpiar
                      </Button>
                    )}
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt={4}>
                    <Select
                      label="Alimento original de tu plan"
                      placeholder="Elige alimento"
                      data={foodOptions}
                      value={calcFood}
                      onChange={(val) => {
                        setCalcFood(val);
                        if (val && !calcQty) {
                          const original = activeCategory?.alimentos.find((a) => a.name === val);
                          if (original) setCalcQty(original.qty);
                        }
                      }}
                      searchable
                      radius="md"
                      comboboxProps={{ shadow: 'md' }}
                    />

                    <NumberInput
                      label="Cantidad pautada"
                      placeholder="Introduce la cantidad"
                      value={calcQty}
                      onChange={(val) => setCalcQty(val ? Number(val) : '')}
                      min={1}
                      radius="md"
                      suffix={` ${selectedFoodObj?.unit || activeCategory?.unit}`}
                      disabled={!calcFood}
                    />
                  </SimpleGrid>

                  {calcFood && calcQty > 0 && (
                    <Text size="xs" fw={600} c="dimmed" mt={4}>
                      Sustituyendo {calcQty}{selectedFoodObj?.unit || activeCategory?.unit} de {calcFood} por:
                    </Text>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Premium Bento Card List Layout (completely replaces table!) */}
            <ScrollArea h={410} scrollbarSize={6} type="hover" style={{ paddingRight: 4 }}>
              <Stack gap="xs">
                {tableRowsData.length === 0 ? (
                  <Paper withBorder p="xl" radius="md" bg="gray.0" style={{ textAlign: 'center' }}>
                    <Text c="dimmed" size="sm">
                      No se encontraron alimentos que coincidan con la búsqueda.
                    </Text>
                  </Paper>
                ) : (
                  tableRowsData.map((food) => {
                    const foodUnit = food.unit || activeCategory?.unit;
                    const isSourceFood = showCalculator && calcFood === food.name;

                    return (
                      <Paper
                        key={food.name}
                        p="sm"
                        px="md"
                        radius="md"
                        withBorder
                        bg={isSourceFood ? 'var(--mantine-color-dark-8)' : 'white'}
                        style={{
                          borderColor: isSourceFood ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-2)',
                          transition: 'all 0.15s ease',
                          boxShadow: isSourceFood ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        <Group justify="space-between" align="center" wrap="nowrap">
                          {/* Left Side: Food name and Inline Note */}
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={700} size="sm" c={isSourceFood ? 'white' : 'dark.5'} truncate>
                              {food.name}
                            </Text>
                            {food.note && (
                              <Text
                                size="xs"
                                c={
                                  isSourceFood
                                    ? 'teal.2'
                                    : food.type === 'warning'
                                    ? 'red.6'
                                    : food.type === 'success'
                                    ? 'teal.6'
                                    : food.type === 'primary'
                                    ? 'blue.6'
                                    : 'gray.5'
                                }
                                fw={600}
                                style={{ lineHeight: 1.2 }}
                              >
                                {food.note}
                              </Text>
                            )}
                          </Stack>

                          {/* Right Side: Bento Quantities Layout */}
                          <Group gap={isMobile ? 'xs' : 'xl'} align="center" style={{ flexShrink: 0 }}>
                            {/* Reference standard quantity block */}
                            <Stack gap={0} align="flex-end" style={{ minWidth: isMobile ? 65 : 80 }}>
                              <Text
                                size="xxs"
                                c={isSourceFood ? 'gray.4' : 'dimmed'}
                                tt="uppercase"
                                fw={850}
                                style={{ fontSize: '8px', letterSpacing: '0.6px', lineHeight: 1 }}
                              >
                                Ref. Base
                              </Text>
                              <Text fw={700} size="sm" c={isSourceFood ? 'gray.2' : 'dark.3'} mt={2}>
                                {food.qty} {foodUnit}
                              </Text>
                            </Stack>

                            {/* Equivalency quantity block (only shown when calculator is active) */}
                            {showCalculator && calcFood && calcQty > 0 && (
                              <Stack gap={0} align="flex-end" style={{ minWidth: isMobile ? 75 : 90 }}>
                                <Text
                                  size="xxs"
                                  c={isSourceFood ? 'teal.3' : 'teal.6'}
                                  tt="uppercase"
                                  fw={850}
                                  style={{ fontSize: '8px', letterSpacing: '0.6px', lineHeight: 1 }}
                                >
                                  {isSourceFood ? 'Origen' : 'Equivalente'}
                                </Text>
                                <Text fw={850} size="md" c={isSourceFood ? 'teal.3' : 'teal.6'} mt={2}>
                                  {isSourceFood ? calcQty : food.calcValue} {foodUnit}
                                </Text>
                              </Stack>
                            )}
                          </Group>
                        </Group>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </ScrollArea>

            {/* Info Alert Box in Premium Dark variant */}
            {activeCategory?.alertText && (
              <Alert
                variant="light"
                color="dark"
                radius="md"
                title="Recomendación Nutricional"
                icon={<IconInfoCircle size={18} />}
              >
                {activeCategory.alertText}
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
}
