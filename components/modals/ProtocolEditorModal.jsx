import React, { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Button, Group, ActionIcon, Text, Textarea, Select, Divider, Paper, ScrollArea, Box, Timeline, Tooltip, Switch } from '@mantine/core';
import { 
  IconPlus, 
  IconTrash, 
  IconArrowUp,
  IconArrowDown,
  IconFlag,
  IconCheck
} from '@tabler/icons-react';
import { PROTOCOL_AVAILABLE_ICONS as AVAILABLE_ICONS } from '@/components/ProtocolIcon';

export default function ProtocolEditorModal({ opened, onClose, protocol, onSave, saveLabel = 'Aceptar', helpText }) {
  const [name, setName] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [incluirEnPlan, setIncluirEnPlan] = useState(false);

  useEffect(() => {
    if (opened && protocol) {
      setName(protocol.name || '');
      setTimeline(protocol.timeline || []);
      setChecklist(protocol.checklist || []);
      const isMatch = protocol.dayTypeKey === 'partido' || protocol.dayTypeKey === 'match_day' || (typeof protocol.dayTypeKey === 'string' && protocol.dayTypeKey.includes('partido'));
      setIncluirEnPlan(protocol.incluirEnPlan !== undefined ? Boolean(protocol.incluirEnPlan) : isMatch);
    } else if (opened && !protocol) {
      setName('');
      setTimeline([]);
      setChecklist([]);
      setIncluirEnPlan(false);
    }
  }, [opened, protocol]);

  const handleSave = () => {
    onSave({
      id: protocol?.id || `prot_${Date.now()}`,
      dayTypeKey: protocol?.dayTypeKey,
      name,
      timeline,
      checklist,
      incluirEnPlan,
    });
    onClose();
  };

  const addTimelineItem = (index = -1) => {
    const newItem = { 
      id: `tl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 
      timeLabel: '', 
      title: '', 
      description: '', 
      icon: 'IconFlag' 
    };
    if (index === -1) {
      setTimeline(prev => [...prev, newItem]);
    } else {
      setTimeline(prev => {
        const copy = [...prev];
        copy.splice(index + 1, 0, newItem);
        return copy;
      });
    }
  };

  const moveTimelineItem = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= timeline.length) return;
    setTimeline(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const removeTimelineItem = (index) => {
    setTimeline(prev => prev.filter((_, i) => i !== index));
  };

  const addChecklistItem = (index = -1) => {
    const newItem = { 
      id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 
      title: '', 
      description: '' 
    };
    if (index === -1) {
      setChecklist(prev => [...prev, newItem]);
    } else {
      setChecklist(prev => {
        const copy = [...prev];
        copy.splice(index + 1, 0, newItem);
        return copy;
      });
    }
  };

  const moveChecklistItem = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= checklist.length) return;
    setChecklist(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const removeChecklistItem = (index) => {
    setChecklist(prev => prev.filter((_, i) => i !== index));
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

          <Paper p="sm" radius="md" withBorder bg="gray.0">
            <Switch
              label="Incluir en la planificación nutricional"
              description="Muestra este protocolo en la ficha y resumen de la planificación nutricional de los días correspondientes"
              checked={incluirEnPlan}
              onChange={(e) => setIncluirEnPlan(e.currentTarget.checked)}
              color="blue"
            />
          </Paper>

          <Box>
            <Group justify="space-between" mb="lg">
              <div>
                <Text fw={600} size="sm" c="dark.3">Fases del Timeline</Text>
                <Text size="xs" c="dimmed">Añade o inserta fases cronológicas y ordénalas según el protocolo</Text>
              </div>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => addTimelineItem(-1)} radius="xl">
                Añadir Fase al Final
              </Button>
            </Group>
            
            <Box pl="md">
              {timeline.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">No hay fases en el timeline. Añade una para comenzar.</Text>
              ) : (
                <Timeline active={timeline.length} bulletSize={32} lineWidth={2} color="gray">
                  {timeline.map((item, index) => (
                    <Timeline.Item key={item.id} bullet={AVAILABLE_ICONS[item.icon] || <IconFlag size={16} />}>
                      <Paper withBorder p="sm" radius="md" bg="gray.0" mb="md" mt="-xs">
                        <Group align="flex-start" wrap="nowrap" gap="sm">
                          <Stack style={{ flexGrow: 1 }} gap="xs">
                            <Group grow align="flex-end">
                              <TextInput
                                label="Tiempo / Etiqueta"
                                placeholder="Ej: -90 min"
                                value={item.timeLabel}
                                onChange={(e) => {
                                  const val = e.currentTarget.value;
                                  setTimeline(prev => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], timeLabel: val };
                                    return copy;
                                  });
                                }}
                                size="xs"
                                variant="filled"
                              />
                              <Select
                                label="Icono"
                                data={Object.keys(AVAILABLE_ICONS).map(k => ({ value: k, label: k }))}
                                value={item.icon}
                                onChange={(val) => {
                                  setTimeline(prev => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], icon: val };
                                    return copy;
                                  });
                                }}
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
                              label="Título de la fase"
                              placeholder="Ej: Comida principal"
                              value={item.title}
                              onChange={(e) => {
                                const val = e.currentTarget.value;
                                setTimeline(prev => {
                                  const copy = [...prev];
                                  copy[index] = { ...copy[index], title: val };
                                  return copy;
                                });
                              }}
                              size="sm"
                              fw={600}
                              variant="filled"
                            />
                            <Textarea
                              label="Descripción / Pautas"
                              placeholder="Ej: Base alta en CHO..."
                              value={item.description}
                              onChange={(e) => {
                                const val = e.currentTarget.value;
                                setTimeline(prev => {
                                  const copy = [...prev];
                                  copy[index] = { ...copy[index], description: val };
                                  return copy;
                                });
                              }}
                              size="xs"
                              autosize
                              minRows={2}
                              variant="filled"
                            />
                          </Stack>

                          <Stack gap={4} mt={20}>
                            <Tooltip label="Subir fase" position="left" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                radius="md"
                                disabled={index === 0}
                                onClick={() => moveTimelineItem(index, 'up')}
                              >
                                <IconArrowUp size={15} />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Bajar fase" position="left" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                radius="md"
                                disabled={index === timeline.length - 1}
                                onClick={() => moveTimelineItem(index, 'down')}
                              >
                                <IconArrowDown size={15} />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Insertar fase a continuación" position="left" withArrow>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                radius="md"
                                onClick={() => addTimelineItem(index)}
                              >
                                <IconPlus size={15} />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Eliminar fase" position="left" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                radius="md"
                                onClick={() => removeTimelineItem(index)}
                              >
                                <IconTrash size={15} />
                              </ActionIcon>
                            </Tooltip>
                          </Stack>
                        </Group>

                        <Group justify="center" mt="xs">
                          <Button
                            variant="subtle"
                            color="blue"
                            size="compact-xs"
                            leftSection={<IconPlus size={12} />}
                            onClick={() => addTimelineItem(index)}
                            radius="xl"
                          >
                            Insertar fase aquí
                          </Button>
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
              <div>
                <Text fw={600} size="sm" c="dark.3">Checklist Operativo</Text>
                <Text size="xs" c="dimmed">Puntos de control y comprobaciones</Text>
              </div>
              <Button size="xs" variant="light" color="blue" leftSection={<IconPlus size={14} />} onClick={() => addChecklistItem(-1)} radius="xl">
                Añadir Item al Final
              </Button>
            </Group>

            <Stack gap="sm">
              {checklist.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="md">No hay items en el checklist.</Text>
              )}
              {checklist.map((item, index) => (
                <Paper key={item.id} withBorder p="sm" radius="md" bg="gray.0">
                  <Group align="flex-start" wrap="nowrap" gap="sm">
                    <Stack style={{ flexGrow: 1 }} gap="xs">
                      <TextInput
                        label="Título"
                        placeholder="Ej: Hidratación"
                        value={item.title}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setChecklist(prev => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], title: val };
                            return copy;
                          });
                        }}
                        size="xs"
                      />
                      <Textarea
                        label="Descripción"
                        placeholder="Ej: Orina clara antes de salida..."
                        value={item.description}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setChecklist(prev => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], description: val };
                            return copy;
                          });
                        }}
                        size="xs"
                        autosize
                        minRows={2}
                      />
                    </Stack>

                    <Stack gap={4} mt={20}>
                      <Tooltip label="Subir item" position="left" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          radius="md"
                          disabled={index === 0}
                          onClick={() => moveChecklistItem(index, 'up')}
                        >
                          <IconArrowUp size={15} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Bajar item" position="left" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          radius="md"
                          disabled={index === checklist.length - 1}
                          onClick={() => moveChecklistItem(index, 'down')}
                        >
                          <IconArrowDown size={15} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Insertar item a continuación" position="left" withArrow>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="sm"
                          radius="md"
                          onClick={() => addChecklistItem(index)}
                        >
                          <IconPlus size={15} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Eliminar item" position="left" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          radius="md"
                          onClick={() => removeChecklistItem(index)}
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      </Tooltip>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Stack>
      </ScrollArea>
      
      <Group justify={helpText ? 'space-between' : 'flex-end'} mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        {helpText && (
          <Text size="xs" c="dimmed" style={{ maxWidth: '60%' }}>
            {helpText}
          </Text>
        )}
        <Group gap="xs">
          <Button variant="default" onClick={onClose} radius="xl">Cancelar</Button>
          <Button color="blue" onClick={handleSave} radius="xl" disabled={!name} leftSection={<IconCheck size={16} />}>
            {saveLabel}
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
