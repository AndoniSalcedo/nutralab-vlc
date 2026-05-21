'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrain, IconCheck, IconEdit, IconFileAi, IconPlus, IconSparkles } from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';

const CONTEXTOS = [
  { value: 'semana_normal', label: 'Semana normal de entrenamiento' },
  { value: 'semana_partido', label: 'Semana con partido oficial' },
  { value: 'dia_partido', label: 'Día de partido' },
  { value: 'viaje', label: 'Viaje / desplazamiento' },
  { value: 'lesion', label: 'Lesión / inactividad' },
  { value: 'vacaciones', label: 'Vacaciones / fuera de temporada' },
  { value: 'pretemporada', label: 'Pretemporada (alta carga)' },
];

function planLabel(plan) {
  const date = plan.updated_at || plan.created_at;
  const suffix = date ? ` · ${new Date(date).toLocaleDateString('es-ES')}` : '';
  return `${plan.nombre}${suffix}`;
}

export default function PlanSubtab({ jugador, readOnly = false }) {
  const [planes, setPlanes] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [mode, setMode] = useState('view');
  const [nombre, setNombre] = useState('');
  const [contexto, setContexto] = useState('semana_normal');
  const [contextoAdicional, setContextoAdicional] = useState('');
  const [contenido, setContenido] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [actionType, setActionType] = useState(null);
  const isDocumentMode = mode === 'create' || mode === 'edit';
  const loadingAction = Boolean(actionType);

  const currentPlan = useMemo(
    () => planes.find((plan) => String(plan.id) === String(currentId)) || null,
    [planes, currentId]
  );

  const planHtml = useMemo(() => {
    if (!currentPlan?.contenido || mode !== 'view') return '';
    marked.setOptions({ breaks: true, gfm: true });
    return marked(currentPlan.contenido);
  }, [currentPlan, mode]);

  useEffect(() => {
    let active = true;
    async function loadPlanes() {
      setLoadingList(true);
      try {
        const res = await fetch(`/api/ai-plan?jugador_id=${jugador.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar planes');
        if (!active) return;
        const list = data.planes || [];
        setPlanes(list);
        setCurrentId(list.length ? String(list[0].id) : null);
        setMode('view');
      } catch (e) {
        if (active) {
          notifications.show({
            color: 'red',
            title: 'No se pudieron cargar los planes',
            message: e.message,
          });
        }
      } finally {
        if (active) setLoadingList(false);
      }
    }
    loadPlanes();
    return () => {
      active = false;
    };
  }, [jugador.id, readOnly]);

  function startCreate() {
    const now = new Date();
    setMode('create');
    setNombre(`Plan ${now.toLocaleDateString('es-ES')}`);
    setContexto('semana_normal');
    setContextoAdicional('');
    setContenido('');
  }

  function startEdit() {
    if (!currentPlan) return;
    setMode('edit');
    setNombre(currentPlan.nombre || '');
    setContexto(currentPlan.contexto || 'semana_normal');
    setContextoAdicional(currentPlan.contexto_adicional || '');
    setContenido(currentPlan.contenido || '');
  }

  function cancelForm() {
    setMode('view');
  }

  async function generateDraft() {
    const notificationId = 'ai-plan-generate';
    setActionType('generate');
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Generando plan IA',
      message: `Generando plan inteligente para ${jugador.nombre}. Esto puede tardar unos segundos.`,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, nombre, contexto, contextoAdicional, draftOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar el borrador');
      setContenido(data.contenido || '');
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Borrador generado',
        message: 'Ya puedes revisar y editar el plan antes de guardarlo.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo generar el borrador',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setActionType(null);
    }
  }

  async function saveCreate() {
    const notificationId = 'ai-plan-save';
    setActionType('save');
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Guardando plan',
      message: 'Guardando cambios del plan IA.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, nombre, contexto, contextoAdicional, contenido }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el plan');
      setPlanes((prev) => [data.plan, ...prev]);
      setCurrentId(String(data.plan.id));
      setMode('view');
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Plan guardado',
        message: 'El nuevo plan IA se ha guardado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo guardar el plan',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setActionType(null);
    }
  }

  async function saveEdit() {
    if (!currentPlan) return;
    const notificationId = 'ai-plan-save';
    setActionType('save');
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Guardando plan',
      message: 'Guardando cambios del plan IA.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentPlan.id,
          nombre,
          contenido,
          contexto,
          contextoAdicional,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el plan');
      setPlanes((prev) => [data.plan, ...prev.filter((plan) => plan.id !== data.plan.id)]);
      setCurrentId(String(data.plan.id));
      setMode('view');
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Plan guardado',
        message: 'Los cambios del plan IA se han guardado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo guardar el plan',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setActionType(null);
    }
  }

  const perfilResumen = [
    jugador.num_comidas ? `${jugador.num_comidas} comidas/dia` : null,
    jugador.objetivo || null,
    jugador.alergias ? `Alergias: ${jugador.alergias.slice(0, 30)}` : null,
    jugador.intolerancias ? `Intol: ${jugador.intolerancias.slice(0, 30)}` : null,
    jugador.gustos_preferencias ? `Gustos: ${jugador.gustos_preferencias.slice(0, 30)}` : null,
  ].filter(Boolean);

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="xs">
                <IconBrain size={22} color="var(--mantine-color-blue-filled)" />
                <Stack gap={2}>
                  <Title order={3} fw={800} c="dark.4">Planes IA</Title>
                  <Text size="sm" c="dimmed">
                    Planes personales nutricionales.
                  </Text>
                </Stack>
              </Group>
            </Box>
            {!readOnly && (
              <Group gap="xs">
                <Button size="xs" radius="xl" variant="light" leftSection={<IconEdit size={16} />} onClick={startEdit} disabled={!currentPlan || mode !== 'view'}>
                  Editar actual
                </Button>
                <Button size="xs" radius="xl" leftSection={<IconPlus size={16} />} onClick={startCreate}>
                  Crear plan
                </Button>
              </Group>
            )}
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


            <Select
              placeholder={loadingList ? 'Cargando planes...' : 'Sin planes creados'}
              data={planes.map((plan) => ({ value: String(plan.id), label: planLabel(plan) }))}
              value={currentId}
              onChange={(val) => {
                if (!val) return;
                setCurrentId(val);
                setMode('view');
              }}
              allowDeselect={false}
              searchable
              variant="filled"
              radius="md"

              leftSection={<IconFileAi size={16} />}
              disabled={loadingList || planes.length === 0 || isDocumentMode}


              rightSection={loadingList ? <Loader size={16} /> : null}
              style={{ flex: 1, minWidth: 260 }}
            />
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        {loadingList ? (
          <Paper p={{ base: 'md', sm: 'xl' }} radius="lg" withBorder shadow="sm" style={{ textAlign: 'center' }}>
            <Loader size="lg" />
          </Paper>
        ) : isDocumentMode ? (
          <Paper p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder shadow="sm">
            <Stack gap={{ base: 'md', sm: 'xl' }}>
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Box>
                  <Title order={3}>{mode === 'create' ? 'Nuevo plan IA' : 'Editar plan IA'}</Title>
                  <Text size="sm" c="dimmed">
                    Trabaja el plan como documento. Genera el borrador, edita el contenido y guarda cuando esté listo.
                  </Text>
                </Box>
                <Group gap="xs">
                  <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={cancelForm} disabled={loadingAction}>
                    Cancelar
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    radius="xl"
                    leftSection={<IconSparkles size={16} />}
                    onClick={generateDraft}
                    loading={actionType === 'generate'}
                    disabled={!nombre.trim() || actionType === 'save'}
                  >
                    {contenido ? 'Regenerar borrador' : 'Generar borrador IA'}
                  </Button>
                  <Button
                    size="xs"
                    radius="xl"
                    leftSection={<IconCheck size={16} />}
                    onClick={mode === 'create' ? saveCreate : saveEdit}
                    loading={actionType === 'save'}
                    disabled={!nombre.trim() || !contenido.trim() || actionType === 'generate'}
                  >
                    Guardar plan
                  </Button>
                </Group>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label="Nombre del plan"
                  placeholder="Ej: Semana partido vs Real Sociedad"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <Select
                  label="Contexto actual"
                  placeholder="Selecciona el contexto"
                  data={CONTEXTOS}
                  value={contexto}
                  onChange={(value) => setContexto(value || 'semana_normal')}
                />
              </SimpleGrid>

              <Textarea
                label="Instrucciones adicionales para la IA"
                placeholder="Ej: El jugador sale de lesión, enfócate en antiinflamatorios..."
                value={contextoAdicional}
                onChange={(e) => setContextoAdicional(e.target.value)}
                rows={2}
              />

              <Textarea
                label="Documento del plan"
                description="Puedes editar el Markdown completo antes de guardarlo."
                placeholder="Genera un borrador con IA o escribe el plan manualmente..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                autosize={false}
                styles={{
                  input: {
                    minHeight: '68vh',
                    fontFamily: 'ui-serif, Georgia, Cambria, Times New Roman, Times, serif',
                    fontSize: 15,
                    lineHeight: 1.75,
                    padding: 24,
                    background: 'var(--mantine-color-gray-0)',
                  },
                }}
              />
            </Stack>
          </Paper>
        ) : !currentPlan ? (
          <Box mt="xl">
            <NothingFound
              icon={IconBrain}
              title="Sin planes IA"
              description="Todavía no hay planes IA creados para este jugador."
              actionLabel={!readOnly ? 'Crear primer plan' : undefined}
              onAction={!readOnly ? startCreate : undefined}
            />
          </Box>
        ) : planHtml ? (
          <Paper p={{ base: 'sm', sm: 'xl' }} radius="lg" withBorder shadow="sm">
            <Box className="plan-md" dangerouslySetInnerHTML={{ __html: planHtml }} />
          </Paper>
        ) : (
          <Box mt="xl">
            <NothingFound title="Error" description="No se pudo cargar el detalle seleccionado." />
          </Box>
        )}
      </Box>

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
