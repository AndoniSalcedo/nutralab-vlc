'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Group, Stack, Text, Timeline } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import { getMatchDay } from '@/actions/matchDayActions';
import WidgetCard, { WidgetAside } from './WidgetCard';

const BOSQUE = 'var(--nutra-bosque, #1F2A24)';
const SALVIA = 'var(--nutra-salvia, #6C705A)';
const MATCH_MINUTES = 105;

const timeFmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
const dayFmt = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
const dayKeyFmt = (date) => new Date(date).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

// Etiqueta relativa al inicio: "Víspera", "H-3", "H-1:30", "H-20'", "Descanso", "Post"
function relativeLabel(at, kickoff) {
  if (dayKeyFmt(at) < dayKeyFmt(kickoff)) return 'Víspera';
  const diff = Math.round((new Date(at) - new Date(kickoff)) / 60000);
  if (diff === 0) return 'Inicio';
  if (diff > 0) {
    if (diff >= MATCH_MINUTES) return 'Post';
    return diff === 45 ? 'Descanso' : `+${diff}'`;
  }
  const minutes = -diff;
  if (minutes < 60) return `H-${minutes}'`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `H-${h}:${String(m).padStart(2, '0')}` : `H-${h}`;
}

function countdown(kickoff, now) {
  const diff = new Date(kickoff) - now;
  if (diff <= 0) return diff > -MATCH_MINUTES * 60000 ? 'En juego' : 'Terminado';
  const minutes = Math.round(diff / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h >= 24) return `Mañana ${timeFmt.format(new Date(kickoff))}`;
  return h ? `Faltan ${h} h ${m} min` : `Faltan ${m} min`;
}

/** Plan del día de partido por horas. No pinta nada si no hay partido hoy ni mañana. */
export default function MatchDayWidget({ jugadorId, style }) {
  const [data, setData] = useState(null);
  const [now, setNow] = useState(null);

  useEffect(() => {
    let alive = true;
    getMatchDay(jugadorId)
      .then((res) => { if (alive) setData(res); })
      .catch((error) => console.error('Error cargando el día de partido:', error));
    return () => { alive = false; };
  }, [jugadorId]);

  // La hora se lee tras montar (servidor y navegador no comparten reloj) y se refresca cada minuto
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const activeIndex = useMemo(() => {
    if (!data || !now) return -1;
    let idx = -1;
    data.steps.forEach((step, i) => { if (new Date(step.at) <= now) idx = i; });
    return idx;
  }, [data, now]);

  if (!data) return null;
  const { match, kickoff, steps } = data;

  return (
    <WidgetCard
      id="widget-match-day"
      icon="soccer"
      title={match.rival ? `Día de partido · vs ${match.rival}` : 'Día de partido'}
      color="lima"
      aside={now ? <WidgetAside color="lima" dot>{countdown(kickoff, now)}</WidgetAside> : null}
      footer={match.approximate ? 'Hora orientativa según el horario de tu plan semanal' : 'Hora del calendario del equipo'}
      style={{ height: 'auto', ...style }}
    >
      <Stack gap="sm">
        <Group gap="xs" wrap="wrap">
          <Text fz="sm" fw={700} c={BOSQUE} tt="capitalize">
            {dayFmt.format(new Date(kickoff))} · {timeFmt.format(new Date(kickoff))}
          </Text>
          {match.lugar && <Text fz="sm" c={SALVIA}>· {match.lugar}</Text>}
          {match.approximate && <Badge size="xs" variant="light" color="gray">Hora aproximada</Badge>}
        </Group>

        <Timeline active={activeIndex} bulletSize={30} lineWidth={2} color="lima">
          {steps.map((step, index) => {
            const done = index < activeIndex;
            return (
              <Timeline.Item
                key={step.id}
                bullet={<Icon3D name={step.icon} size={18} />}
                title={(
                  <Group gap={6} wrap="nowrap">
                    <Badge size="xs" variant={index === activeIndex ? 'filled' : 'light'} color={index === activeIndex ? 'dark' : 'gray'} radius="sm" style={{ flexShrink: 0 }}>
                      {relativeLabel(step.at, kickoff)}
                    </Badge>
                    <Text fz="sm" fw={700} c={done ? 'dimmed' : BOSQUE} lineClamp={1}>
                      {timeFmt.format(new Date(step.at))} · {step.title}
                    </Text>
                  </Group>
                )}
              >
                {step.detail && (
                  <Box mt={2}>
                    <Text fz="xs" c={done ? 'dimmed' : 'dark.4'} lh={1.4}>{step.detail}</Text>
                  </Box>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Stack>
    </WidgetCard>
  );
}
