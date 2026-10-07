import React, { useState, useEffect } from 'react';
import { Stack, TextInput, Button, Group, ActionIcon, Text, Textarea, Select, Divider, Paper, ScrollArea, Box, Timeline, Tooltip, Switch } from '@mantine/core';
import ResponsiveModal from './ResponsiveModal';
import { 
  IconArrowUp,
  IconArrowDown,
} from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import { PROTOCOL_AVAILABLE_ICONS as AVAILABLE_ICONS } from '@/components/ProtocolIcon';
import { getAvailableSupplements } from '@/actions/supplementActions';
import { formatSupplementDose } from '@/lib/nutrition/supplementation';

export default function ProtocolEditorModal({
  opened,
  onClose,
  protocol,
  onSave,
  saveLabel = 'Aceptar',
  helpText,
  supplements: propSupplements = [],
  peso = null,
}) {
  const [name, setName] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [incluirEnPlan, setIncluirEnPlan] = useState(false);
  const [catalogSupplements, setCatalogSupplements] = useState(propSupplements || []);
  const [addingSuppIndex, setAddingSuppIndex] = useState(null);
  const [newSuppForm, setNewSuppForm] = useState({ suplemento_id: '', nombre: '', dosis: '', notas: '' });

  useEffect(() => {
    if (opened && catalogSupplements.length === 0) {
      getAvailableSupplements().then(data => {
        if (Array.isArray(data)) setCatalogSupplements(data);
      }).catch(err => {
        console.error('Error cargando suplementos:', err);
      });
    }
  }, [opened, catalogSupplements.length]);

  useEffect(() => {
    if (opened && protocol) {
      setName(protocol.name || '');
      setTimeline((protocol.timeline || []).map(item => ({
        ...item,
        suplementos: Array.isArray(item.suplementos) ? item.suplementos : []
      })));
      setChecklist(protocol.checklist || []);
      const isMatch = protocol.dayTypeKey === 'partido' || protocol.dayTypeKey === 'match_day' || (typeof protocol.dayTypeKey === 'string' && protocol.dayTypeKey.includes('partido'));
      setIncluirEnPlan(protocol.incluirEnPlan !== undefined ? Boolean(protocol.incluirEnPlan) : isMatch);
      setAddingSuppIndex(null);
    } else if (opened && !protocol) {
      setName('');
      setTimeline([]);
      setChecklist([]);
      setIncluirEnPlan(false);
      setAddingSuppIndex(null);
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

  const handleAddSupplement = (timelineIndex) => {
    if (!newSuppForm.nombre) return;
    setTimeline(prev => {
      const copy = [...prev];
      const currentSupps = copy[timelineIndex].suplementos || [];
      copy[timelineIndex] = {
        ...copy[timelineIndex],
        suplementos: [
          ...currentSupps,
          {
            suplemento_id: newSuppForm.suplemento_id,
            nombre: newSuppForm.nombre,
            dosis: newSuppForm.dosis || 'Según pauta',
            notas: newSuppForm.notas || '',
          }
        ]
      };
      return copy;
    });
    setAddingSuppIndex(null);
    setNewSuppForm({ suplemento_id: '', nombre: '', dosis: '', notas: '' });
  };

  const handleRemoveSupplement = (timelineIndex, suppIndex) => {
    setTimeline(prev => {
      const copy = [...prev];
      const currentSupps = copy[timelineIndex].suplementos || [];
      copy[timelineIndex] = {
        ...copy[timelineIndex],
        suplementos: currentSupps.filter((_, i) => i !== suppIndex)
      };
      return copy;
    });
  };

  const addTimelineItem = (index = -1) => {
    const newItem = { 
      id: `tl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 
      timeLabel: '', 
      title: '', 
      description: '', 
      icon: 'IconFlag',
      suplementos: [],
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
    <ResponsiveModal
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

          <Paper p="sm" radius="md" withBorder style={{ backgroundColor: 'rgba(108, 112, 90, 0.05)', borderColor: 'rgba(108, 112, 90, 0.12)' }}>
            <Switch
              label="Incluir en la planificación nutricional"
              description="Muestra este protocolo en la ficha y resumen de la planificación nutricional de los días correspondientes"
              checked={incluirEnPlan}
              onChange={(e) => setIncluirEnPlan(e.currentTarget.checked)}
              color="bosque"
            />
          </Paper>

          <Box>
            <Group justify="space-between" mb="lg">
              <div>
                <Text fw={600} size="sm" c="dark.3">Fases del Timeline</Text>
                <Text size="xs" c="dimmed">Añade o inserta fases cronológicas y ordénalas según el protocolo</Text>
              </div>
              <Button size="xs" variant="light" leftSection={<Icon3D name="plus" size={16} />} onClick={() => addTimelineItem(-1)} radius="xl">
                Añadir Fase al Final
              </Button>
            </Group>
            
            <Box pl="md">
              {timeline.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">No hay fases en el timeline. Añade una para comenzar.</Text>
              ) : (
                <Timeline active={timeline.length} bulletSize={32} lineWidth={2} color="gray">
                  {timeline.map((item, index) => (
                    <Timeline.Item key={item.id} bullet={AVAILABLE_ICONS[item.icon] || <Icon3D name="flag" size={16} />}>
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

                            {/* Suplementos asociados a esta etapa */}
                            <Box mt={4} pt={6} style={{ borderTop: '1px dashed var(--mantine-color-gray-3)' }}>
                              <Group justify="space-between" align="center" mb={4}>
                                <Group gap={6}>
                                  <Icon3D name="pill" size={15} />
                                  <Text size="xs" fw={700} c="dark.4">Suplementos de la etapa</Text>
                                  {item.suplementos?.length > 0 && (
                                    <Text size="xs" c="dimmed">({item.suplementos.length})</Text>
                                  )}
                                </Group>
                                {addingSuppIndex !== index && (
                                  <Button
                                    variant="subtle"
                                    color="bosque"
                                    size="compact-xs"
                                    leftSection={<Icon3D name="plus" size={13} />}
                                    onClick={() => {
                                      setAddingSuppIndex(index);
                                      setNewSuppForm({ suplemento_id: '', nombre: '', dosis: '', notas: '' });
                                    }}
                                    radius="xl"
                                  >
                                    Añadir suplemento
                                  </Button>
                                )}
                              </Group>

                              {/* Lista de suplementos de la etapa */}
                              {item.suplementos?.length > 0 && (
                                <Stack gap={4} mb={addingSuppIndex === index ? 'xs' : 2}>
                                  {item.suplementos.map((supp, sIdx) => (
                                    <Paper
                                      key={sIdx}
                                      px="sm"
                                      py={6}
                                      radius="md"
                                      withBorder
                                      bg="white"
                                      style={{ borderColor: 'var(--mantine-color-gray-3)' }}
                                    >
                                      <Group justify="space-between" align="center" wrap="nowrap">
                                        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                          <Icon3D name="pill" size={16} style={{ flexShrink: 0 }} />
                                          <Box style={{ minWidth: 0 }}>
                                            <Group gap={6} wrap="nowrap">
                                              <Text size="xs" fw={700} c="dark.5" truncate>{supp.nombre}</Text>
                                              <Text size="xs" fw={600} c="var(--nutra-salvia, #6C705A)" style={{ whiteSpace: 'nowrap' }}>· {supp.dosis}</Text>
                                            </Group>
                                            {supp.notas && (
                                              <Text size={11} c="dimmed" truncate>{supp.notas}</Text>
                                            )}
                                          </Box>
                                        </Group>
                                        <ActionIcon
                                          variant="subtle"
                                          color="arcilla"
                                          size="sm"
                                          radius="md"
                                          onClick={() => handleRemoveSupplement(index, sIdx)}
                                          title="Eliminar de esta etapa"
                                        >
                                          <Icon3D name="trash" size={14} />
                                        </ActionIcon>
                                      </Group>
                                    </Paper>
                                  ))}
                                </Stack>
                              )}

                              {/* Formulario para añadir suplemento */}
                              {addingSuppIndex === index && (
                                <Paper p="xs" radius="md" withBorder bg="gray.1" mb="xs" style={{ borderColor: 'var(--mantine-color-gray-4)' }}>
                                  <Stack gap="xs">
                                    <Select
                                      label="Seleccionar suplemento del catálogo"
                                      placeholder="Buscar suplemento..."
                                      searchable
                                      data={catalogSupplements.map(s => ({ value: String(s.id), label: `${s.nombre} (${s.categoria || 'General'})` }))}
                                      value={newSuppForm.suplemento_id ? String(newSuppForm.suplemento_id) : null}
                                      onChange={(val) => {
                                        const found = catalogSupplements.find(s => String(s.id) === String(val));
                                        if (found) {
                                          const doseVal = formatSupplementDose(found, peso).value;
                                          setNewSuppForm({
                                            suplemento_id: found.id,
                                            nombre: found.nombre,
                                            dosis: doseVal,
                                            notas: '',
                                          });
                                        } else {
                                          setNewSuppForm({ suplemento_id: '', nombre: '', dosis: '', notas: '' });
                                        }
                                      }}
                                      size="xs"
                                      radius="md"
                                      variant="filled"
                                      allowDeselect={false}
                                    />
                                    <Group grow align="flex-start">
                                      <TextInput
                                        label="Dosis en esta etapa"
                                        placeholder="Ej: 200 mg"
                                        value={newSuppForm.dosis}
                                        onChange={(e) => setNewSuppForm(f => ({ ...f, dosis: e.currentTarget.value }))}
                                        size="xs"
                                        variant="filled"
                                        radius="md"
                                      />
                                      <TextInput
                                        label="Nota / Indicación (opcional)"
                                        placeholder="Ej: Con 200ml de agua fresca"
                                        value={newSuppForm.notas}
                                        onChange={(e) => setNewSuppForm(f => ({ ...f, notas: e.currentTarget.value }))}
                                        size="xs"
                                        variant="filled"
                                        radius="md"
                                      />
                                    </Group>
                                    <Group justify="flex-end" gap="xs">
                                      <Button
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => setAddingSuppIndex(null)}
                                        radius="xl"
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        size="xs"
                                        color="lima"
                                        disabled={!newSuppForm.nombre}
                                        onClick={() => handleAddSupplement(index)}
                                        radius="xl"
                                        leftSection={<Icon3D name="check" size={14} />}
                                      >
                                        Añadir a la fase
                                      </Button>
                                    </Group>
                                  </Stack>
                                </Paper>
                              )}
                            </Box>
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
                                <Icon3D name="plus" size={15} />
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
                                <Icon3D name="trash" size={15} />
                              </ActionIcon>
                            </Tooltip>
                          </Stack>
                        </Group>

                        <Group justify="center" mt="xs">
                          <Button
                            variant="subtle"
                            color="blue"
                            size="compact-xs"
                            leftSection={<Icon3D name="plus" size={14} />}
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
              <Button size="xs" variant="default" leftSection={<Icon3D name="plus" size={16} />} onClick={() => addChecklistItem(-1)} radius="xl">
                Añadir Item al Final
              </Button>
            </Group>

            <Stack gap="sm">
              {checklist.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="md">No hay items en el checklist.</Text>
              )}
              {checklist.map((item, index) => (
                <Paper key={item.id} withBorder p="sm" radius="md" style={{ backgroundColor: 'rgba(108, 112, 90, 0.05)', borderColor: 'rgba(108, 112, 90, 0.12)' }}>
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
                          <Icon3D name="plus" size={15} />
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
                          <Icon3D name="trash" size={15} />
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
          <Button color="lima" onClick={handleSave} radius="xl" disabled={!name} leftSection={<Icon3D name="check" size={20} />}>
            {saveLabel}
          </Button>
        </Group>
      </Group>
    </ResponsiveModal>
  );
}
