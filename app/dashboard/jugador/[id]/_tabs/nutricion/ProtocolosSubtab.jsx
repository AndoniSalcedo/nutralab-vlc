'use client';

import { useState } from 'react';
import { Badge, Box, Group, Paper, SimpleGrid, Stack, Text, Timeline, Select, Title, Button } from '@mantine/core';
import { IconClipboardList, IconDroplet, IconApple, IconRun, IconCoffee, IconBatteryCharging, IconFlag, IconBed, IconActivity, IconMeat, IconPill, IconPencil, IconCalendar } from '@tabler/icons-react';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/BentoItem';
import { updatePlayerField } from '@/services/player';
import ProtocolEditorModal from '@/components/modals/ProtocolEditorModal';
import NothingFound from '@/components/NothingFound';

const AVAILABLE_ICONS = {
  IconApple: IconApple,
  IconRun: IconRun,
  IconCoffee: IconCoffee,
  IconDroplet: IconDroplet,
  IconBatteryCharging: IconBatteryCharging,
  IconFlag: IconFlag,
  IconBed: IconBed,
  IconActivity: IconActivity,
  IconMeat: IconMeat,
  IconPill: IconPill,
  IconClipboardList: IconClipboardList
};

export default function ProtocolosSubtab({ jugador, readOnly = false }) {
  const teamConfig = jugador.equipos?.configuracion_nutricional || {};
  const dayTypes = teamConfig.dayTypes || [];
  const baseProtocols = teamConfig.protocols || [];
  const customProtocols = jugador.protocolos_custom || {};

  const [selectedDayType, setSelectedDayType] = useState(dayTypes.length > 0 ? dayTypes[0].key : null);

  const availableProtocols = baseProtocols.filter(p => p.dayTypeKey === selectedDayType);
  const [selectedProtocolId, setSelectedProtocolId] = useState(availableProtocols.length > 0 ? availableProtocols[0].id : null);

  // If dayType changes, reset protocol selection
  if (selectedDayType && availableProtocols.length > 0 && !availableProtocols.find(p => p.id === selectedProtocolId)) {
    setSelectedProtocolId(availableProtocols[0].id);
  } else if (selectedDayType && availableProtocols.length === 0 && selectedProtocolId !== null) {
    setSelectedProtocolId(null);
  }

  const baseProtocol = availableProtocols.find(p => p.id === selectedProtocolId);
  const activeProtocol = baseProtocol ? (customProtocols[baseProtocol.id] || baseProtocol) : null;

  const [editorOpen, setEditorOpen] = useState(false);

  async function saveField(field, value) {
    await updatePlayerField(jugador.id, field, value);
  }

  async function handleSaveCustomProtocol(updatedProtocol) {
    const newCustoms = { ...customProtocols, [updatedProtocol.id]: updatedProtocol };
    await updatePlayerField(jugador.id, 'protocolos_custom', newCustoms);
    // Locally mutate for instant UI update (or wait for SWR/Next to revalidate)
    jugador.protocolos_custom = newCustoms;
  }

  const renderTimelineIcon = (iconName) => {
    const IconComponent = AVAILABLE_ICONS[iconName] || IconFlag;
    return <IconComponent size={15} />;
  };

  const dayTypeObj = dayTypes.find(d => d.key === selectedDayType);

  return (
    <Stack gap={0}>
      <Paper className={classes.mobileSticky} p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <Group gap="xs" style={{ flex: 1 }}>
              <SubtabHeader tab="nutricion" subtab="protocolos" />
            </Group>
          </Group>

          <Group gap="xs" grow>
            {dayTypes.length > 0 && (
              <Select
                data={dayTypes.map(d => ({ value: d.key, label: d.label }))}
                value={selectedDayType}
                onChange={setSelectedDayType}
                placeholder="Tipo de Día"
                size="sm"
                radius="md"
                variant="filled"
                allowDeselect={false}
                leftSection={<IconCalendar size={16} style={{ opacity: 0.7 }} />}
              />
            )}
            {availableProtocols.length > 1 && (
              <Select
                data={availableProtocols.map(p => ({ value: p.id, label: p.name }))}
                value={selectedProtocolId}
                onChange={setSelectedProtocolId}
                placeholder="Protocolo"
                size="sm"
                radius="md"
                variant="filled"
                allowDeselect={false}
                leftSection={<IconClipboardList size={16} style={{ opacity: 0.7 }} />}
              />
            )}
          </Group>
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap="md">
          {activeProtocol ? (
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="sm">
                  {customProtocols[activeProtocol.id] && (
                    <Badge color="blue" variant="light">Personalizado</Badge>
                  )}
                  {dayTypeObj && (
                    <Badge color={dayTypeObj.color || 'gray'} variant="light">{dayTypeObj.label}</Badge>
                  )}
                  <Title order={4} c="dark.3">{activeProtocol.name}</Title>
                  {(activeProtocol.incluirEnPlan !== false && (activeProtocol.incluirEnPlan === true || activeProtocol.dayTypeKey === 'partido' || activeProtocol.dayTypeKey === 'match_day' || (typeof activeProtocol.dayTypeKey === 'string' && activeProtocol.dayTypeKey.includes('partido')))) && (
                    <Group gap={4} align="center">
                      <span style={{ color: 'var(--mantine-color-teal-6)', fontSize: 10 }}>●</span>
                      <Text size="xs" c="teal.7" fw={600}>En planificación</Text>
                    </Group>
                  )}
                </Group>
                {!readOnly && (
                  <Button variant="light" size="xs" leftSection={<IconPencil size={14} />} onClick={() => setEditorOpen(true)} radius="xl">
                    Personalizar
                  </Button>
                )}
              </Group>

              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={{ base: 'md', sm: 'md' }} align="stretch" mb={{ base: 'md', sm: 'xl' }}>
                <BentoCard title="Timeline" icon={IconFlag} color="dark">
                  {activeProtocol.timeline?.length > 0 ? (
                    <Timeline active={activeProtocol.timeline.length - 1} bulletSize={28} lineWidth={2} color="dark">
                      {activeProtocol.timeline.map((item, idx) => (
                        <Timeline.Item key={item.id || idx} bullet={renderTimelineIcon(item.icon)} title={`${item.timeLabel} · ${item.title}`}>
                          <Text size="sm" c="dimmed">{item.description}</Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <Text c="dimmed" size="sm">No hay pasos en el timeline.</Text>
                  )}
                </BentoCard>

                <BentoCard title="Checklist operativo" icon={IconClipboardList} color="blue">
                  <Stack gap="sm">
                    {activeProtocol.checklist?.length > 0 ? (
                      activeProtocol.checklist.map((item, idx) => (
                        <Paper key={item.id || idx} p="sm" radius="md" bg="gray.0" withBorder>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{item.title}</Text>
                          <Text size="sm" fw={600} c="dark.4">{item.description}</Text>
                        </Paper>
                      ))
                    ) : (
                      <Text c="dimmed" size="sm">No hay items de checklist.</Text>
                    )}
                  </Stack>
                </BentoCard>
              </SimpleGrid>
            </Stack>
          ) : (
            <NothingFound
              title="Sin protocolos"
              description="No hay protocolos configurados para este tipo de día."
              withPaper
              icon={IconClipboardList}
            />
          )}

          <EditableSection
            title="Notas adicionales"
            defaultValue={jugador.notas_protocolos || ''}
            onSave={(v) => saveField('notas_protocolos', v)}
            readOnly={readOnly}
          />
        </Stack>
      </Box>

      {editorOpen && activeProtocol && (
        <ProtocolEditorModal
          opened={editorOpen}
          onClose={() => setEditorOpen(false)}
          protocol={activeProtocol}
          onSave={handleSaveCustomProtocol}
        />
      )}
    </Stack>
  );
}
