import React, { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Button, Group, ActionIcon, Text, Textarea, Select, Divider, Paper, ScrollArea, Box, Timeline } from '@mantine/core';
import { IconPlus, IconTrash, IconApple, IconRun, IconCoffee, IconDroplet, IconBatteryCharging, IconFlag, IconBed, IconActivity, IconMeat, IconPill, IconClipboardList } from '@tabler/icons-react';

const AVAILABLE_ICONS = {
  IconApple: <IconApple size={16} />,
  IconRun: <IconRun size={16} />,
  IconCoffee: <IconCoffee size={16} />,
  IconDroplet: <IconDroplet size={16} />,
  IconBatteryCharging: <IconBatteryCharging size={16} />,
  IconFlag: <IconFlag size={16} />,
  IconBed: <IconBed size={16} />,
  IconActivity: <IconActivity size={16} />,
  IconMeat: <IconMeat size={16} />,
  IconPill: <IconPill size={16} />,
  IconClipboardList: <IconClipboardList size={16} />
};

export default function ProtocolEditorModal({ opened, onClose, protocol, onSave }) {
  const [name, setName] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    if (opened && protocol) {
      setName(protocol.name || '');
      setTimeline(protocol.timeline || []);
      setChecklist(protocol.checklist || []);
    } else if (opened && !protocol) {
      setName('');
      setTimeline([]);
      setChecklist([]);
    }
  }, [opened, protocol]);

  const handleSave = () => {
    onSave({
      id: protocol?.id || `prot_${Date.now()}`,
      dayTypeKey: protocol?.dayTypeKey,
      name,
      timeline,
      checklist
    });
    onClose();
  };

  const addTimelineItem = () => {
    setTimeline([...timeline, { id: `tl_${Date.now()}`, timeLabel: '', title: '', description: '', icon: 'IconFlag' }]);
  };

  const updateTimelineItem = (index, field, value) => {
    const newTimeline = [...timeline];
    newTimeline[index][field] = value;
    setTimeline(newTimeline);
  };

  const removeTimelineItem = (index) => {
    setTimeline(timeline.filter((_, i) => i !== index));
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, { id: `cl_${Date.now()}`, title: '', description: '' }]);
  };

  const updateChecklistItem = (index, field, value) => {
    const newChecklist = [...checklist];
    newChecklist[index][field] = value;
    setChecklist(newChecklist);
  };

  const removeChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={protocol ? 'Editar Protocolo' : 'Nuevo Protocolo'}
      size="xl"
      radius="md"
    >
      <ScrollArea h="70vh" offsetScrollbars>
        <Stack gap="xl" p="xs">
          <TextInput
            label="Nombre del Protocolo"
            placeholder="Ej: Timeline Prepartido Mañana"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            size="md"
            radius="md"
          />

          <Box>
            <Group justify="space-between" mb="lg">
              <Text fw={600} size="sm" c="dark.3">Pasos del Timeline</Text>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addTimelineItem} radius="xl">
                Añadir Paso
              </Button>
            </Group>
            
            <Box pl="md">
              {timeline.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">No hay pasos en el timeline. Añade uno.</Text>
              ) : (
                <Timeline active={timeline.length} bulletSize={32} lineWidth={2} color="gray">
                  {timeline.map((item, index) => (
                    <Timeline.Item key={item.id} bullet={AVAILABLE_ICONS[item.icon] || <IconFlag size={16} />}>
                      <Paper withBorder p="sm" radius="md" bg="gray.0" mb="xl" mt="-xs">
                        <Group align="flex-start" wrap="nowrap">
                          <Stack style={{ flexGrow: 1 }} gap="xs">
                            <Group grow align="flex-end">
                              <TextInput
                                label="Tiempo / Etiqueta"
                                placeholder="Ej: -90 min"
                                value={item.timeLabel}
                                onChange={(e) => updateTimelineItem(index, 'timeLabel', e.currentTarget.value)}
                                size="xs"
                                variant="filled"
                              />
                              <Select
                                label="Icono"
                                data={Object.keys(AVAILABLE_ICONS).map(k => ({ value: k, label: k }))}
                                value={item.icon}
                                onChange={(val) => updateTimelineItem(index, 'icon', val)}
                                size="xs"
                                variant="filled"
                                allowDeselect={false}
                                leftSection={AVAILABLE_ICONS[item.icon]}
                                styles={{ input: { color: 'transparent' } }}
                                renderOption={({ option }) => (
                                  <Group justify="center" w="100%">
                                    {AVAILABLE_ICONS[option.value]}
                                  </Group>
                                )}
                              />
                            </Group>
                            <TextInput
                              label="Título"
                              placeholder="Ej: Comida principal"
                              value={item.title}
                              onChange={(e) => updateTimelineItem(index, 'title', e.currentTarget.value)}
                              size="sm"
                              fw={600}
                              variant="filled"
                            />
                            <Textarea
                              label="Descripción"
                              placeholder="Ej: Base alta en CHO..."
                              value={item.description}
                              onChange={(e) => updateTimelineItem(index, 'description', e.currentTarget.value)}
                              size="xs"
                              autosize
                              minRows={2}
                              variant="filled"
                            />
                          </Stack>
                          <ActionIcon color="red" variant="subtle" onClick={() => removeTimelineItem(index)} mt={24}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Group justify="space-between" mb="sm">
              <Text fw={600} size="sm" c="dark.3">Checklist Operativo</Text>
              <Button size="xs" variant="light" color="blue" leftSection={<IconPlus size={14} />} onClick={addChecklistItem} radius="xl">
                Añadir Item
              </Button>
            </Group>

            <Stack gap="sm">
              {checklist.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="md">No hay items en el checklist.</Text>
              )}
              {checklist.map((item, index) => (
                <Paper key={item.id} withBorder p="sm" radius="md" bg="gray.0">
                  <Group align="flex-start" wrap="nowrap">
                    <Stack style={{ flexGrow: 1 }} gap="xs">
                      <TextInput
                        label="Título"
                        placeholder="Ej: Hidratación"
                        value={item.title}
                        onChange={(e) => updateChecklistItem(index, 'title', e.currentTarget.value)}
                        size="xs"
                      />
                      <Textarea
                        label="Descripción"
                        placeholder="Ej: Orina clara antes de salida..."
                        value={item.description}
                        onChange={(e) => updateChecklistItem(index, 'description', e.currentTarget.value)}
                        size="xs"
                        autosize
                        minRows={2}
                      />
                    </Stack>
                    <ActionIcon color="red" variant="subtle" onClick={() => removeChecklistItem(index)} mt={24}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Stack>
      </ScrollArea>
      
      <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        <Button variant="default" onClick={onClose} radius="xl">Cancelar</Button>
        <Button color="blue" onClick={handleSave} radius="xl" disabled={!name}>Guardar Protocolo</Button>
      </Group>
    </Modal>
  );
}
