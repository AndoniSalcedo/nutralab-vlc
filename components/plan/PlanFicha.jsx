'use client';

import { useMemo } from 'react';
import { Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { sanitizePlanData } from '@/lib/engine';
import { getTeamDayTypeColor, getTeamDayTypeLabel } from '@/config/nutrition-days';
import { buildPlanTokens } from '@/config/plan-themes';
import { formatInteger, formatNumberDecimal } from '@/lib/utils';
import ProtocolIcon from '@/components/ProtocolIcon';

const LEFT_DAYS = ['lunes', 'martes', 'miercoles', 'jueves'];
const RIGHT_DAYS = ['viernes', 'sabado', 'domingo'];

const TRANSITION = 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease';

function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    Number.isNaN(d.getTime()) ? new Date() : d
  );
}

function Card({ t, children, mb = 'md' }) {
  return (
    <Box mb={mb} p="md" style={{ backgroundColor: t.boxBg, border: `1px solid ${t.boxBorder}`, borderRadius: 14, transition: TRANSITION }}>
      {children}
    </Box>
  );
}

function PanelTitle({ t, children }) {
  return (
    <Text fw={700} tt="uppercase" pb={8} mb={10} style={{ color: t.accentText, fontSize: 11.5, letterSpacing: '1.4px', borderBottom: `1px solid ${t.boxBorder}`, transition: TRANSITION }}>
      {children}
    </Text>
  );
}

function Tag({ t, children }) {
  return (
    <Text component="span" fw={700} style={{ color: t.accentText, backgroundColor: t.chipBg, borderRadius: 6, padding: '1px 8px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, transition: TRANSITION }}>
      {children}
    </Text>
  );
}

function ItemBox({ t, children }) {
  return <Box mb={6} px={11} py={8} style={{ backgroundColor: t.itemBg, borderRadius: 8, transition: TRANSITION }}>{children}</Box>;
}

function MacroItem({ t, label, value }) {
  return (
    <span style={{ fontSize: 12.5, color: t.itemText }}>{label} <b style={{ color: t.cardBodyText }}>{formatInteger(value)} g</b></span>
  );
}

function Day({ t, dayData, teamConfig }) {
  const colorName = getTeamDayTypeColor(dayData.tipoDia, teamConfig);
  const label = getTeamDayTypeLabel(dayData.tipoDia, teamConfig);

  return (
    <Card t={t}>
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Group gap={10} align="center" wrap="nowrap">
          <Text fw={800} style={{ color: t.cardBodyText, fontSize: 17, lineHeight: 1.2 }}>{dayData.label}</Text>
          <Text fw={700} tt="uppercase" style={{ color: t.dayColor(colorName), backgroundColor: t.dayTint(colorName), borderRadius: 20, padding: '2px 10px', fontSize: 10.5, letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>
            {label}
          </Text>
        </Group>
        <Text fw={800} style={{ color: t.cardBodyText, fontSize: 18, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          {formatInteger(dayData.kcal)} <span style={{ color: t.muted, fontSize: 11, fontWeight: 500 }}>kcal</span>
        </Text>
      </Group>

      <Group gap={16} mt={6} wrap="wrap">
        <MacroItem t={t} label="Proteína" value={dayData.proteina} />
        <MacroItem t={t} label="Hidratos" value={dayData.hidratos} />
        <MacroItem t={t} label="Grasa" value={dayData.grasa} />
      </Group>

      <Stack gap={5} mt={12}>
        {dayData.ingestas.map((meal, i) => (
          <Group key={i} gap={12} align="flex-start" wrap="nowrap" px={11} py={8} style={{ backgroundColor: t.itemBg, borderRadius: 8, transition: TRANSITION }}>
            <Text fw={700} tt="uppercase" style={{ color: t.accentText, fontSize: 11, letterSpacing: '0.6px', width: 86, flexShrink: 0, paddingTop: 2 }}>
              {meal.nombre}
            </Text>
            <Text style={{ color: t.itemText, fontSize: 13, lineHeight: 1.45 }}>{meal.detalle || '—'}</Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}

export default function PlanFicha({ data, activeSupplements = [], jugador, themeColors }) {
  const teamConfig = jugador?.equipos?.configuracion_nutricional;
  const plan = useMemo(() => sanitizePlanData(data, teamConfig), [data, teamConfig]);

  const t = useMemo(
    () => buildPlanTokens(themeColors || data?.meta?.planColors || data?.planColors || teamConfig?.planColors),
    [themeColors, data, teamConfig]
  );

  const supplementsToShow = plan?.suplementacion?.length > 0 ? plan.suplementacion : activeSupplements;

  const teamProtocols = useMemo(() => teamConfig?.protocols || [], [teamConfig?.protocols]);
  const customProtocols = useMemo(() => jugador?.protocolos_custom || {}, [jugador?.protocolos_custom]);
  const activeDayTypes = useMemo(() => {
    if (!plan?.dias) return new Set();
    return new Set(Object.values(plan.dias).map((d) => d.tipoDia).filter(Boolean));
  }, [plan?.dias]);

  const protocolsToShow = useMemo(() => {
    if (!plan) return [];
    if (Array.isArray(plan.protocolos) && plan.protocolos.length > 0) return plan.protocolos;
    return teamProtocols
      .map((p) => customProtocols[p.id] || p)
      .filter((p) => {
        const isIncluded = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
        if (!isIncluded) return false;
        if (p.dayTypeKey && activeDayTypes.size > 0) return activeDayTypes.has(p.dayTypeKey);
        return true;
      });
  }, [plan, teamProtocols, customProtocols, activeDayTypes]);

  if (!plan) return null;

  const clubName = jugador?.equipos?.nombre || 'Club';
  const renderDay = (dayKey) => (plan.dias[dayKey] ? <Day key={dayKey} t={t} dayData={plan.dias[dayKey]} teamConfig={teamConfig} /> : null);

  const stats = [
    ['Peso', formatNumberDecimal(plan.metricas?.peso, ' kg', 1)],
    ['Grasa', formatNumberDecimal(plan.metricas?.grasa, ' %', 1)],
    ['Músculo', formatNumberDecimal(plan.metricas?.pesoMuscular, ' %', 1)],
  ];

  return (
    <Box style={{ overflow: 'hidden', borderRadius: 18, backgroundColor: t.cardBodyBg, color: t.cardBodyText, boxShadow: '0 6px 24px rgba(0,0,0,0.14)', transition: TRANSITION }}>
      <Box px={{ base: 'md', sm: 'xl' }} pt="lg" pb="lg" style={{ backgroundColor: t.cardTopBg, transition: TRANSITION }}>
        <Group justify="space-between" gap="xs" mb="md" style={{ color: t.topMuted, fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase' }}>
          <span style={{ fontWeight: 700 }}>{clubName} · Nutrición deportiva</span>
          <span>{plan.meta?.nombre ? `${plan.meta.nombre} · ` : ''}{formatDate(plan.meta?.fecha)}</span>
        </Group>
        <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
          <Box style={{ minWidth: 0 }}>
            <Title style={{ color: t.cardTopText, fontSize: 'clamp(28px, 4.5vw, 42px)', lineHeight: 1.05, letterSpacing: '-0.5px' }}>
              {plan.jugador.nombre}
            </Title>
            <Text mt={6} style={{ color: t.topMuted, fontSize: 14, letterSpacing: '0.4px' }}>{plan.jugador.posicion || 'Sin posición'}</Text>
          </Box>
          <SimpleGrid cols={3} spacing="xs" w={{ base: '100%', sm: 360 }}>
            {stats.map(([label, value]) => (
              <Box key={label} px={12} py={8} style={{ backgroundColor: t.topTile, borderRadius: 10 }}>
                <Text tt="uppercase" style={{ color: t.topMuted, fontSize: 10, letterSpacing: '1px' }}>{label}</Text>
                <Text fw={800} style={{ color: t.cardTopText, fontSize: 'clamp(16px, 2.2vw, 21px)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{value}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Group>
      </Box>

      <Box p={{ base: 'md', sm: 'xl' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap={0}>
            {LEFT_DAYS.map(renderDay)}

            {supplementsToShow?.length > 0 && (
              <Card t={t} mb={0}>
                <PanelTitle t={t}>Suplementación pautada</PanelTitle>
                {supplementsToShow.map((supp, i) => (
                  <ItemBox key={i} t={t}>
                    <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                      <Text fw={700} style={{ color: t.cardBodyText, fontSize: 13.5 }}>{supp.nombre}</Text>
                      {supp.dosis && <Tag t={t}>{supp.dosis}</Tag>}
                    </Group>
                    {supp.timing && <Text style={{ color: t.itemText, fontSize: 12.5 }}>{supp.timing}</Text>}
                    {supp.notas && <Text style={{ color: t.muted, fontSize: 12 }}>{supp.notas}</Text>}
                  </ItemBox>
                ))}
              </Card>
            )}
          </Stack>

          <Stack gap={0}>
            {RIGHT_DAYS.map(renderDay)}

            {protocolsToShow.map((prot, pIdx) => (
              <Card key={prot.id || pIdx} t={t}>
                <PanelTitle t={t}>{prot.name || 'Protocolo de partido'}</PanelTitle>
                {prot.timeline?.map((step, sIdx) => (
                  <ItemBox key={step.id || sIdx} t={t}>
                    <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                      <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 0 }}>
                        <ProtocolIcon iconName={step.icon} size={14} color={t.accentText} />
                        <Text fw={700} style={{ color: t.cardBodyText, fontSize: 13.5 }}>{step.title}</Text>
                      </Group>
                      {step.timeLabel && <Tag t={t}>{step.timeLabel}</Tag>}
                    </Group>
                    {step.description && <Text style={{ color: t.itemText, fontSize: 12.5, lineHeight: 1.4 }}>{step.description}</Text>}
                    {step.suplementos?.length > 0 && (
                      <Box mt={6} pt={4} style={{ borderTop: `1px dashed ${t.border || '#e5e7eb'}` }}>
                        {step.suplementos.map((supp, sIdx2) => (
                          <Group key={sIdx2} gap={6} wrap="nowrap" mt={2}>
                            <Text style={{ color: t.accentText, fontSize: 11.5, fontWeight: 700 }}>💊 {supp.nombre}:</Text>
                            <Text style={{ color: t.itemText, fontSize: 11.5 }}>{supp.dosis}</Text>
                            {supp.notas && <Text style={{ color: t.muted, fontSize: 11 }}>({supp.notas})</Text>}
                          </Group>
                        ))}
                      </Box>
                    )}
                  </ItemBox>
                ))}

                {prot.checklist?.length > 0 && (
                  <Box mt="sm">
                    <Text tt="uppercase" fw={700} mb={6} style={{ color: t.muted, fontSize: 10.5, letterSpacing: '1px' }}>Checklist</Text>
                    {prot.checklist.map((item, cIdx) => (
                      <ItemBox key={item.id || cIdx} t={t}>
                        <Group gap={9} align="flex-start" wrap="nowrap">
                          <Box style={{ width: 13, height: 13, borderRadius: 4, border: `1.5px solid ${t.accentText}`, marginTop: 3, flexShrink: 0 }} />
                          <Box>
                            <Text fw={700} style={{ color: t.cardBodyText, fontSize: 13.5 }}>{item.title}</Text>
                            {item.description && <Text style={{ color: t.itemText, fontSize: 12.5, lineHeight: 1.4 }}>{item.description}</Text>}
                          </Box>
                        </Group>
                      </ItemBox>
                    ))}
                  </Box>
                )}
              </Card>
            ))}

            {plan.notas?.length > 0 && (
              <Card t={t} mb={0}>
                <PanelTitle t={t}>Indicaciones de la semana</PanelTitle>
                <Stack gap={7}>
                  {plan.notas.map((note, i) => (
                    <Group key={i} gap={10} align="flex-start" wrap="nowrap">
                      <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.accentText, marginTop: 7, flexShrink: 0 }} />
                      <Text style={{ color: t.itemText, fontSize: 13, lineHeight: 1.45 }}>{note}</Text>
                    </Group>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </SimpleGrid>

        <Group justify="space-between" mt="lg" pt={10} style={{ borderTop: `1px solid ${t.boxBorder}`, color: t.muted, fontSize: 11 }}>
          <span>{clubName} · Nutrición deportiva y rendimiento</span>
        </Group>
      </Box>
    </Box>
  );
}
