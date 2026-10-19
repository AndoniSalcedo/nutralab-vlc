'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Group, Stack, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import ResponsiveModal from './ResponsiveModal';
import { listIntrapartidoDrafts } from '@/actions/intrapartidoActions';

const DISMISSED_KEY = 'intrapartido-resume-dismissed';

function readDismissed() {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function stageLabel(draft) {
  if (draft.paso === 'resumen') return 'en el balance final';
  if (draft.paso === 'fases') return `en «${draft.faseShort || 'fases'}»`;
  return 'en la alineación';
}

/**
 * Al entrar en la app, avisa de si hay un control intrapartido a medias y permite
 * reanudarlo. Descartar el aviso no borra el borrador: sigue en la lista del módulo.
 */
export default function IntrapartidoResumePrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listIntrapartidoDrafts()
      .then((res) => {
        if (cancelled) return;
        const dismissed = readDismissed();
        setDraft((res.drafts || []).find((d) => !dismissed.includes(d.id)) || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Se vuelve a comprobar al cambiar de sección por si se cerró un control a medias
  }, [pathname]);

  if (!draft) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...readDismissed(), draft.id]));
    } catch {}
    setDraft(null);
  };

  const resume = () => {
    const target = `/dashboard/equipo/${draft.teamId}/intrapartido?reanudar=${draft.id}`;
    setDraft(null);
    router.push(target);
  };

  return (
    <ResponsiveModal
      opened
      onClose={dismiss}
      size="sm"
      radius="lg"
      zIndex={2000}
      title={
        <Group gap="xs">
          <Icon3D name="soccer" size={24} />
          <Text fw={700} size="md">Control intrapartido a medias</Text>
        </Group>
      }
    >
      <Stack gap="md">
        <Text size="sm">
          Tienes un control{draft.rival ? ` contra ${draft.rival}` : ''}
          {draft.teamName ? ` (${draft.teamName})` : ''} sin terminar, parado {stageLabel(draft)}.
          ¿Quieres reanudarlo por donde ibas?
        </Text>
        <Text size="xs" c="dimmed">
          Si no, se mantiene como borrador y podrás retomarlo desde Intrapartido.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" size="xs" radius="xl" onClick={dismiss}>Ahora no</Button>
          <Button color="lima" size="xs" radius="xl" onClick={resume}>Reanudar</Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}
