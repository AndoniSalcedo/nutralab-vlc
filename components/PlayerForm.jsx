'use client';

import { useMemo, useState } from 'react';
import { cunninghamPlan } from '@/lib/calculations';
import { 
  TextInput, 
  Select, 
  Textarea, 
  Button, 
  Group, 
  Stack, 
  SimpleGrid, 
  Paper, 
  Title, 
  Text, 
  Box,
  Divider
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUser, IconScale, IconActivity, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function PlayerForm({ initial }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [apellidos, setApellidos] = useState(initial?.apellidos ?? '');
  const [posicion, setPosicion] = useState(initial?.posicion ?? '');
  const [altura, setAltura] = useState(String(initial?.altura_cm ?? ''));
  const [weight, setWeight] = useState(String(initial?.peso_kg ?? ''));
  const [bodyFat, setBodyFat] = useState(String(initial?.porcentaje_grasa ?? ''));
  const [leanMass, setLeanMass] = useState(String(initial?.masa_magra_kg ?? ''));
  const [activityFactor, setActivityFactor] = useState(String(initial?.factor_actividad ?? '1.6'));
  const [gustos, setGustos] = useState(initial?.gustos_preferencias ?? '');
  const [contexto, setContexto] = useState(initial?.contexto_clinico ?? '');
  const [objetivo, setObjetivo] = useState(initial?.objetivo ?? '');

  const calc = useMemo(() => {
    const weightNum = Number(weight || 0);
    if (!weightNum) return null;
    return cunninghamPlan({
      weightKg: weightNum,
      bodyFatPct: bodyFat ? Number(bodyFat) : null,
      leanMassKg: leanMass ? Number(leanMass) : null,
      activityFactor: Number(activityFactor || 1.6),
    });
  }, [weight, bodyFat, leanMass, activityFactor]);

  async function handleSubmit(e, isDelete = false) {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      if (initial?.id) {
        formData.append('id', initial.id);
      }

      if (isDelete) {
        const res = await fetch(`/api/players?delete=1`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Error al eliminar jugador');
      } else {
        formData.append('nombre', nombre);
        formData.append('apellidos', apellidos);
        formData.append('posicion', posicion);
        formData.append('altura_cm', altura);
        formData.append('peso_kg', weight);
        formData.append('porcentaje_grasa', bodyFat);
        formData.append('masa_magra_kg', leanMass);
        formData.append('factor_actividad', activityFactor);
        formData.append('gustos_preferencias', gustos);
        formData.append('contexto_clinico', contexto);
        formData.append('objetivo', objetivo);

        // Calculated values
        formData.append('kcal_objetivo', String(calc?.kcal ?? ''));
        formData.append('cho_objetivo_g', String(calc?.cho ?? ''));
        formData.append('proteina_objetivo_g', String(calc?.protein ?? ''));
        formData.append('grasa_objetivo_g', String(calc?.fat ?? ''));
        formData.append('agua_objetivo_ml', String(calc?.hydrationMl ?? ''));

        const res = await fetch('/api/players', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Error al guardar jugador');
      }

      notifications.show({
        color: 'green',
        title: isDelete ? 'Jugador eliminado' : 'Jugador guardado',
        message: isDelete ? 'El jugador se ha eliminado correctamente.' : 'Los datos del jugador se han guardado correctamente.',
      });
      router.refresh();
      // Cerrar modales (NextJS redirigirá o refrescará y el modal se cerrará al recargar)
      window.location.reload(); 
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: err.message,
      });
      setLoading(false);
    }
  }

  return (
    <Box p="xs">
      <Stack gap="md">
        <div>
          <Title order={3} c="dark.8">{initial ? 'Editar jugador' : 'Añadir jugador'}</Title>
          <Text size="sm" c="dimmed">
            Este formulario recalcula automáticamente el plan base del jugador utilizando la ecuación de Cunningham.
          </Text>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <Stack gap="lg">
            
            {/* Datos Personales */}
            <Title order={5} c="blue" mb={-10}>Datos Personales</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <TextInput 
                label="Nombre"
                placeholder="Ej. Juan"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                leftSection={<IconUser size={16} />}
              />
              <TextInput 
                label="Apellidos"
                placeholder="Ej. Pérez"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
              <TextInput 
                label="Posición"
                placeholder="Ej. Delantero"
                value={posicion}
                onChange={(e) => setPosicion(e.target.value)}
              />
            </SimpleGrid>

            {/* Datos Físicos */}
            <Title order={5} c="blue" mb={-10}>Datos Físicos e Índices</Title>
            <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
              <TextInput 
                label="Altura (cm)"
                type="number"
                step="0.1"
                placeholder="Ej. 182"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
              <TextInput 
                label="Peso (kg)"
                type="number"
                step="0.1"
                placeholder="Ej. 75.5"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                leftSection={<IconScale size={16} />}
              />
              <TextInput 
                label="% Grasa"
                type="number"
                step="0.1"
                placeholder="Ej. 10.2"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
              />
              <TextInput 
                label="Masa Magra (kg)"
                type="number"
                step="0.1"
                placeholder="Ej. 65"
                value={leanMass}
                onChange={(e) => setLeanMass(e.target.value)}
              />
            </SimpleGrid>

            {/* Actividad */}
            <Select 
              label="Factor de Actividad Diario"
              value={activityFactor}
              onChange={setActivityFactor}
              leftSection={<IconActivity size={16} />}
              data={[
                { label: 'Descanso (1.2)', value: '1.2' },
                { label: 'Recuperación (1.4)', value: '1.4' },
                { label: 'Entreno normal (1.6)', value: '1.6' },
                { label: 'Doble sesión (1.75)', value: '1.75' },
                { label: 'Partido (1.9)', value: '1.9' },
              ]}
            />

            {/* Contexto y Preferencias */}
            <Title order={5} c="blue" mb={-10}>Contexto Nutricional y Clínico</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Textarea 
                label="Gustos y Preferencias"
                placeholder="Alimentos preferidos..."
                rows={3}
                value={gustos}
                onChange={(e) => setGustos(e.target.value)}
              />
              <Textarea 
                label="Lesión / Contexto Clínico"
                placeholder="Ej. Saliendo de esguince de tobillo..."
                rows={3}
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
              />
              <Textarea 
                label="Objetivo Corporal"
                placeholder="Ej. Bajar grasa manteniendo músculo..."
                rows={3}
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
              />
            </SimpleGrid>

            <Divider />

            {/* KPI Resultados de Cunningham en vivo */}
            <Box bg="blue.0" p="md" style={{ borderRadius: '12px' }}>
              <Text fw={700} size="sm" c="blue.8" mb="xs">Cálculo Automático Cunningham (Base)</Text>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Box>
                  <Text size="xs" c="dimmed">Kcal Objetivo</Text>
                  <Text size="lg" fw={800} c="dark.7">{calc?.kcal ?? '—'} kcal</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Macronutrientes (G / P / L)</Text>
                  <Text size="md" fw={700} c="dark.7">
                    {calc ? `${calc.cho}g / ${calc.protein}g / ${calc.fat}g` : '—'}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Agua Objetivo</Text>
                  <Text size="lg" fw={800} c="dark.7">
                    {calc ? `${(calc.hydrationMl / 1000).toFixed(2)} L` : '—'}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Botones de acción */}
            <Group justify="flex-end" mt="md">
              {initial?.id && (
                <Button 
                  color="red" 
                  variant="light" 
                  size="xs"
                  radius="xl"
                  onClick={(e) => handleSubmit(e, true)}
                  loading={loading}
                >
                  Eliminar Jugador
                </Button>
              )}
              <Button 
                type="submit" 
                color="blue"
                size="xs"
                radius="xl"
                loading={loading}
                leftSection={<IconCheck size={16} />}
              >
                Guardar Jugador
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
