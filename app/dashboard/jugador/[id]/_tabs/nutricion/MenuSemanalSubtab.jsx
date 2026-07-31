'use client';

import { useState, useEffect } from 'react';
import SubtabHeader from '../SubtabHeader';
import {
  ActionIcon,
  Paper,
  Stack,
  Group,
  Tooltip,
  Select,
  Box,
} from '@mantine/core';
import {
  IconCalendar,
  IconList,
} from '@tabler/icons-react';
import MenuSemanal, { formatWeek } from '@/components/MenuSemanal';

export default function MenuSemanalSubtab({ menus = [] }) {
  const [selectedMenu, setSelectedMenu] = useState(menus[0] || null);
  const [viewMode, setViewMode] = useState('diaria'); // 'diaria' or 'semanal'

  useEffect(() => {
    setSelectedMenu((prev) => {
      if (!prev) return menus[0] || null;
      const match = menus.find((m) => m.semana === prev.semana);
      return match || menus[0] || null;
    });
  }, [menus]);

  const weekOptions = menus.map((menu) => ({
    value: menu.semana,
    label: `Semana del ${formatWeek(menu.semana)}`,
  }));

  return (
    <Stack gap={0}>
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="xs"
        radius="lg"
        withBorder
        style={{
          borderTop: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
        bg="white"
      >
        <Stack gap="md">
          {/* Header Title/Subtitle and Switcher Row */}
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="xs">
              <SubtabHeader tab="nutricion" subtab="menu" />
            </Group>

            {/* Premium Micro-segmented Pill Switcher */}
            <Group
              gap={4}
              p={3}
              bg="gray.1"
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                border: '1px solid var(--mantine-color-gray-2)',
                flexShrink: 0,
              }}
            >
              <Tooltip label="Día a Día (Vista diaria)" withArrow>
                <ActionIcon
                  onClick={() => setViewMode('diaria')}
                  variant={viewMode === 'diaria' ? 'filled' : 'transparent'}
                  color={viewMode === 'diaria' ? 'dark' : 'gray'}
                  radius="md"
                  size="md"
                  style={{ width: 32, height: 32 }}
                >
                  <IconCalendar size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Semana completa (Vista general)" withArrow>
                <ActionIcon
                  onClick={() => setViewMode('semanal')}
                  variant={viewMode === 'semanal' ? 'filled' : 'transparent'}
                  color={viewMode === 'semanal' ? 'dark' : 'gray'}
                  radius="md"
                  size="md"
                  style={{ width: 32, height: 32 }}
                >
                  <IconList size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Select Week Dropdown - occupying full width below */}
          <Select
            placeholder="Selecciona una semana"
            leftSection={<IconCalendar size={16} style={{ opacity: 0.7 }} />}
            data={weekOptions}
            value={selectedMenu?.semana || null}
            onChange={(value) => {
              const next = menus.find((menu) => menu.semana === value);
              if (next) setSelectedMenu(next);
            }}
            disabled={menus.length === 0}
            variant="filled"
            radius="md"
            size="sm"
            allowDeselect={false}
            style={{ width: '100%' }}
          />
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <MenuSemanal selectedMenu={selectedMenu} viewMode={viewMode} />
      </Box>
    </Stack>
  );
}
