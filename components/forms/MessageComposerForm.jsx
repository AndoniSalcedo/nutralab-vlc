'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Divider,
  Group,
  MultiSelect,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,

} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@/components/icons3d';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/actions/messageActions';

export default function MessageComposerForm({
  players = [],
  defaultRecipientIds = [],
  forceRecipients = false,
  team,
  onSent,
  onClose,
}) {
  const router = useRouter();
  const [mode, setMode] = useState(forceRecipients ? 'selected' : 'all');
  const [recipientIds, setRecipientIds] = useState(defaultRecipientIds.map(String));
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);

  const playerOptions = useMemo(() => players.map((player) => ({
    value: String(player.id),
    label: `${player.nombre || ''} ${player.apellidos || ''}`.trim() || `Jugador ${player.id}`,
  })), [players]);

  async function submit(event) {
    event.preventDefault();
    if (!titulo.trim() || !contenido.trim()) {
      notifications.show({
        color: 'red',
        title: 'Campos incompletos',
        message: 'Por favor, completa el título y el mensaje.',
      });
      return;
    }
    if (selectedMode === 'selected' && recipientIds.length === 0) {
      notifications.show({
        color: 'red',
        title: 'Sin destinatarios',
        message: 'Debes seleccionar al menos un jugador destinatario.',
      });
      return;
    }

    setLoading(true);

    try {
      const data = await sendMessage({
        titulo,
        contenido,
        sendToAll: mode === 'all',
        recipientIds,
        team_id: team?.id,
      });

      notifications.show({
        color: 'green',
        title: 'Mensaje enviado',
        message: mode === 'all' ? 'Disponible para todos los jugadores.' : 'Disponible para los jugadores seleccionados.',
      });
      setTitulo('');
      setContenido('');
      if (!forceRecipients) setRecipientIds([]);
      onSent?.(data.messages || []);
      router.refresh();
      onClose?.();
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'No se pudo enviar',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedMode = forceRecipients ? 'selected' : mode;

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 160px)', sm: 540 }} type="auto">
        <Stack gap="sm" pb="xs">
          {!forceRecipients && (
            <SegmentedControl
              value={mode}
              onChange={setMode}
              fullWidth
              radius="xl"
              size="xs"
              color="dark"
              data={[
                { value: 'all', label: 'Toda la plantilla' },
                { value: 'selected', label: 'Jugadores concretos' },
              ]}
            />
          )}

          <Stack gap="xs">
            {selectedMode === 'selected' && (
              <MultiSelect
                label="Destinatarios"
                placeholder="Selecciona jugadores..."
                data={playerOptions}
                value={recipientIds}
                onChange={setRecipientIds}
                searchable
                clearable={!forceRecipients}
                radius="md"
                size="sm"
                required
              />
            )}

            <TextInput
              label="Título del comunicado"
              placeholder="Ej: Recordatorio de hidratación y cena pre-partido"
              value={titulo}
              onChange={(event) => setTitulo(event.currentTarget.value)}
              radius="md"
              size="sm"
              required
            />

            <Textarea
              label="Cuerpo del mensaje"
              placeholder="Escribe el mensaje o pauta que verán los jugadores en su app..."
              minRows={5}
              autosize
              value={contenido}
              onChange={(event) => setContenido(event.currentTarget.value)}
              radius="md"
              size="sm"
              required
            />

            <Text fz="11px" c="dimmed">
              Los jugadores recibirán este comunicado en su apartado de avisos nutricionales.
            </Text>
          </Stack>

        </Stack>
      </ScrollArea.Autosize>

      {/* Barra inferior consistente con el formato de Intrapartido */}
      <Divider mt="auto" />
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs" pt="xs">
        {onClose && (
          <Button
            type="button"
            variant="subtle"
            color="gray"
            size="sm"
            radius="xl"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="filled"
          color="dark"
          size="sm"
          radius="xl"
          style={{ flex: 1 }}
          loading={loading}
          leftSection={<IconSend size={15} />}
        >
          Enviar mensaje
        </Button>
      </Group>
    </form>
  );
}

