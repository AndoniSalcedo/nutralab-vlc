'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { 
  Paper, 
  Stack, 
  Group, 
  Title, 
  Text, 
  Button, 
  Badge, 
  Select, 
  Loader, 
  Alert,
  Box,
  Divider
} from '@mantine/core';
import { IconBrain, IconAlertCircle, IconSparkles } from '@tabler/icons-react';

const CONTEXTOS = [
  { value: 'semana_normal', label: 'Semana normal de entrenamiento' },
  { value: 'semana_partido', label: 'Semana con partido oficial' },
  { value: 'dia_partido', label: 'Día de partido' },
  { value: 'viaje', label: 'Viaje / desplazamiento' },
  { value: 'lesion', label: 'Lesión / inactividad' },
  { value: 'vacaciones', label: 'Vacaciones / fuera de temporada' },
  { value: 'pretemporada', label: 'Pretemporada (alta carga)' },
];

export default function PlanIATab({ jugador }) {
  const [contexto, setContexto] = useState('semana_normal');
  const [plan, setPlan] = useState('');
  const [planHtml, setPlanHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      marked.setOptions({ breaks: true, gfm: true });
      setPlanHtml(marked(plan));
    }
  }, [plan]);

  async function generar() {
    setLoading(true); setError(''); setPlan(''); setPlanHtml('');
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, contexto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setPlan(data.plan);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const perfilResumen = [
    jugador.num_comidas ? jugador.num_comidas + ' comidas/dia' : null,
    jugador.objetivo || null,
    jugador.alergias ? 'Alergias: ' + jugador.alergias.slice(0,30) : null,
    jugador.intolerancias ? 'Intol: ' + jugador.intolerancias.slice(0,30) : null,
    jugador.gustos_preferencias ? 'Gustos: ' + jugador.gustos_preferencias.slice(0,30) : null,
  ].filter(Boolean);

  return (
    <Stack gap="lg">
      <Paper radius="lg" p="lg" withBorder shadow="sm">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={3}>Plan nutricional personalizado</Title>
              <Text c="dimmed" size="xs" mt={4}>
                {jugador.kcal_objetivo} kcal · {jugador.proteina_objetivo_g}g P · {jugador.cho_objetivo_g}g CHO · {jugador.grasa_objetivo_g}g G
              </Text>
            </Box>
            <Badge variant="dot" color="blue" size="lg">IA Powered</Badge>
          </Group>

          {perfilResumen.length > 0 && (
            <Group gap={6}>
              {perfilResumen.map((item, i) => (
                <Badge key={i} variant="light" color="gray" size="sm" radius="sm">
                  {item}
                </Badge>
              ))}
            </Group>
          )}

          <Divider />

          <Group gap="md" align="flex-end">
            <Select 
              label="Contexto actual"
              placeholder="Selecciona el contexto"
              data={CONTEXTOS}
              value={contexto}
              onChange={setContexto}
              style={{ flex: 1 }}
              size="sm"
            />
            <Button 
              leftSection={<IconSparkles size={16} />} 
              onClick={generar} 
              loading={loading}
              size="sm"
              variant="filled"
              color="blue"
              px="xl"
            >
              Generar Plan
            </Button>
          </Group>
        </Stack>
      </Paper>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      {loading && (
        <Paper p="xl" radius="lg" withBorder shadow="sm" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Generando plan inteligente para {jugador.nombre}...</Text>
            <Text size="xs" c="dimmed">Esto puede tardar hasta 15-20 segundos.</Text>
          </Stack>
        </Paper>
      )}

      {planHtml && !loading && (
        <Paper p="xl" radius="lg" withBorder shadow="sm">
          <Box className="plan-md" dangerouslySetInnerHTML={{ __html: planHtml }} />
        </Paper>
      )}

      <style>{`
        .plan-md h1 { font-size: 24px; font-weight: 800; color: var(--mantine-color-dark-4); margin: 0 0 12px; letter-spacing: -0.5px; }
        .plan-md h2 { font-size: 14px; font-weight: 700; color: var(--mantine-color-blue-filled); text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid var(--mantine-color-blue-light); }
        .plan-md h3 { font-size: 16px; font-weight: 600; color: var(--mantine-color-dark-4); margin: 20px 0 10px; }
        .plan-md p { margin: 10px 0; color: var(--mantine-color-gray-7); font-size: 14px; line-height: 1.7; }
        .plan-md strong { color: var(--mantine-color-dark-4); font-weight: 700; }
        .plan-md hr { border: none; border-top: 1px solid var(--mantine-color-gray-2); margin: 24px 0; }
        .plan-md ul, .plan-md ol { padding-left: 24px; margin: 12px 0; }
        .plan-md li { margin: 8px 0; color: var(--mantine-color-gray-7); font-size: 14px; line-height: 1.6; }
        .plan-md li::marker { color: var(--mantine-color-blue-filled); }
        .plan-md table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .plan-md th { background: var(--mantine-color-gray-0); color: var(--mantine-color-blue-filled); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px; border: 1px solid var(--mantine-color-gray-2); text-align: left; }
        .plan-md td { padding: 12px; border: 1px solid var(--mantine-color-gray-2); color: var(--mantine-color-gray-7); }
        .plan-md tr:nth-child(even) td { background-color: var(--mantine-color-gray-0); }
        .plan-md blockquote { border-left: 4px solid var(--mantine-color-blue-filled); padding: 12px 20px; margin: 16px 0; background: var(--mantine-color-blue-light); border-radius: 0 12px 12px 0; font-style: italic; }
      `}</style>
    </Stack>
  );
}