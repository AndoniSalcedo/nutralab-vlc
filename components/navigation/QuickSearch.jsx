'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Kbd,
  Loader,
  Modal,
  ScrollArea,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { motion, useReducedMotion } from 'motion/react';
import {
  IconSearch,
  IconUsersGroup,
  IconUserCog,
  IconShieldCheck,
  IconCornerDownLeft,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import SafeAvatar from '@/components/SafeAvatar';
import { getQuickSearchIndex } from '@/actions/searchActions';
import { initials, getPlayerAvatarUrl, playerFullName } from '@/lib/utils';

const MAX_PLAYERS = 8;
const MAX_TEAMS = 4;
const RECENT_KEY = 'vlc.quickSearch.recent';
const RECENT_MAX = 5;

// Normaliza para comparar sin tildes ni mayúsculas
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function readRecent() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(playerId) {
  try {
    const next = [String(playerId), ...readRecent().filter((id) => id !== String(playerId))].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento (modo privado): simplemente no se recuerdan
  }
}

// Coincidencia por palabras: "pepe gar" encuentra "José García (Pepe)"
function matches(haystack, query) {
  const h = norm(haystack);
  return norm(query).split(/\s+/).filter(Boolean).every((word) => h.includes(word));
}

function ResultRow({ active, onSelect, onHover, children, index }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}
    >
      <UnstyledButton
        onClick={onSelect}
        onMouseMove={onHover}
        data-active={active || undefined}
        role="option"
        aria-selected={active}
        w="100%"
        px="sm"
        py={8}
        style={{
          borderRadius: 'var(--mantine-radius-md)',
          backgroundColor: active ? 'var(--mantine-color-salvia-0)' : 'transparent',
          boxShadow: active ? 'inset 3px 0 0 var(--mantine-color-lima-4)' : 'none',
          transition: 'background-color 120ms ease, box-shadow 120ms ease',
        }}
      >
        <Group gap="sm" wrap="nowrap">
          {children}
          {active && <IconCornerDownLeft size={14} color="var(--mantine-color-salvia-5)" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
        </Group>
      </UnstyledButton>
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return (
    <Text size="xs" fw={700} c="salvia.6" tt="uppercase" px="sm" pt="sm" pb={4} style={{ letterSpacing: 0.6 }}>
      {children}
    </Text>
  );
}

function IconTile({ icon: Icon }) {
  return (
    <Box
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        display: 'grid',
        placeItems: 'center',
        backgroundColor: 'var(--mantine-color-salvia-0)',
        color: 'var(--mantine-color-bosque-7)',
        flexShrink: 0,
      }}
    >
      <Icon size={18} stroke={1.7} />
    </Box>
  );
}

/**
 * Buscador rápido del staff (⌘K / Ctrl+K): salta a la ficha de un jugador o a un
 * equipo sin pasar por el listado. Se navega con flechas y Enter.
 */
export default function QuickSearch({ user }) {
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [recentIds, setRecentIds] = useState([]);
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(true);
  const listRef = useRef(null);
  const loadedAtRef = useRef(0);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || ''));
  }, []);

  const loadIndex = useCallback(() => {
    // Se refresca como mucho cada minuto (altas y bajas de jugadores)
    if (Date.now() - loadedAtRef.current < 60_000) return;
    setLoading(true);
    setError(false);
    getQuickSearchIndex()
      .then((data) => {
        setIndex(data);
        loadedAtRef.current = Date.now();
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const open = useCallback(() => {
    setQuery('');
    setActive(0);
    setRecentIds(readRecent());
    setOpened(true);
    loadIndex();
  }, [loadIndex]);
  const close = useCallback(() => setOpened(false), []);

  useHotkeys([['mod+K', () => (opened ? close() : open())]], []);

  const q = query.trim();

  const { players, teams } = useMemo(() => {
    if (!index) return { players: [], teams: [] };
    if (!q) {
      const byId = new Map(index.players.map((p) => [String(p.id), p]));
      return { players: recentIds.map((id) => byId.get(id)).filter(Boolean), teams: index.teams.slice(0, MAX_TEAMS) };
    }
    return {
      players: index.players
        .filter((p) => matches(`${playerFullName(p, '')} ${p.posicion} ${p.equipo}`, q))
        .slice(0, MAX_PLAYERS),
      teams: index.teams.filter((t) => matches(`${t.nombre} ${t.temporada}`, q)).slice(0, MAX_TEAMS),
    };
  }, [index, q, recentIds]);

  const actions = useMemo(() => {
    const all = [
      { id: 'teams', label: 'Equipos', hint: 'Todos los equipos', href: '/dashboard', icon: IconUsersGroup, keywords: 'plantillas inicio' },
      ...(isAdmin ? [{ id: 'tecnicos', label: 'Técnicos', hint: 'Gestión de técnicos', href: '/dashboard/tecnicos', icon: IconUserCog, keywords: 'staff cuerpo tecnico' }] : []),
      { id: 'legal', label: 'Legal y privacidad', hint: 'Textos legales', href: '/legal', icon: IconShieldCheck, keywords: 'privacidad cookies aviso' },
    ];
    return q ? all.filter((a) => matches(`${a.label} ${a.hint} ${a.keywords}`, q)) : all;
  }, [isAdmin, q]);

  // Lista plana para la navegación con teclado
  const items = useMemo(
    () => [
      ...players.map((p) => ({ type: 'player', data: p })),
      ...teams.map((t) => ({ type: 'team', data: t })),
      ...actions.map((a) => ({ type: 'action', data: a })),
    ],
    [players, teams, actions]
  );

  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(items.length - 1, 0)));
  }, [items.length]);

  // Mantiene visible la fila activa al moverse con el teclado
  useEffect(() => {
    listRef.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const select = (item) => {
    if (!item) return;
    close();
    if (item.type === 'player') {
      pushRecent(item.data.id);
      router.push(`/dashboard/jugador/${item.data.id}`);
    } else if (item.type === 'team') {
      router.push(`/dashboard/equipo/${item.data.id}`);
    } else {
      router.push(item.data.href);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(items[active]);
    }
  };

  const shortcut = isMac ? '⌘ K' : 'Ctrl K';
  const nothing = Boolean(q) && index && players.length === 0 && teams.length === 0;
  const teamOffset = players.length;
  const actionOffset = players.length + teams.length;

  return (
    <>
      <UnstyledButton
        onClick={open}
        visibleFrom="sm"
        aria-label="Buscar jugadores y equipos"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px 6px 12px',
          minWidth: 240,
          borderRadius: 'var(--mantine-radius-xl)',
          border: '1px solid var(--nutra-card-border, rgba(108, 112, 90, 0.18))',
          backgroundColor: 'var(--mantine-color-hueso-1, #faf9f7)',
          color: 'var(--mantine-color-salvia-6)',
        }}
      >
        <IconSearch size={16} stroke={1.8} />
        <Text size="sm" c="salvia.6" style={{ flex: 1 }}>Buscar jugador o equipo…</Text>
        <Kbd size="xs">{shortcut}</Kbd>
      </UnstyledButton>
      <ActionIcon hiddenFrom="sm" variant="subtle" color="salvia" size="lg" onClick={open} aria-label="Buscar">
        <IconSearch size={20} stroke={1.8} />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={close}
        withCloseButton={false}
        padding={0}
        radius="lg"
        size="lg"
        yOffset="12vh"
        transitionProps={{ transition: 'pop', duration: 160 }}
        overlayProps={{ backgroundOpacity: 0.35, blur: 3 }}
        aria-label="Buscador rápido"
      >
        <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-salvia-1)' }}>
          <TextInput
            data-autofocus
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Busca por nombre, posición o equipo…"
            variant="unstyled"
            size="md"
            leftSection={<IconSearch size={18} stroke={1.8} />}
            rightSection={loading ? <Loader size={16} color="salvia" /> : <Kbd size="xs">Esc</Kbd>}
            rightSectionWidth={52}
            aria-controls="quick-search-results"
          />
        </Box>

        <ScrollArea.Autosize mah="min(60vh, 440px)" type="auto">
          <Box id="quick-search-results" role="listbox" ref={listRef} px={6} pb={6}>
            {error && (
              <Text size="sm" c="arcilla.6" px="sm" py="md">
                No se pudo cargar el buscador. Inténtalo de nuevo.
              </Text>
            )}

            {players.length > 0 && <SectionLabel>{q ? 'Jugadores' : 'Vistos recientemente'}</SectionLabel>}
            {players.map((p, i) => (
              <ResultRow key={`p-${p.id}`} index={i} active={active === i} onHover={() => setActive(i)} onSelect={() => select(items[i])}>
                <SafeAvatar src={getPlayerAvatarUrl(p)} radius="xl" size={34} color="nutralabColor">
                  {initials(playerFullName(p, '?'))}
                </SafeAvatar>
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} c="bosque.8" truncate>{playerFullName(p)}</Text>
                  <Text size="xs" c="salvia.6" truncate>{[p.posicion, p.equipo].filter(Boolean).join(' · ')}</Text>
                </Box>
              </ResultRow>
            ))}

            {teams.length > 0 && <SectionLabel>Equipos</SectionLabel>}
            {teams.map((t, j) => {
              const i = teamOffset + j;
              return (
                <ResultRow key={`t-${t.id}`} index={i} active={active === i} onHover={() => setActive(i)} onSelect={() => select(items[i])}>
                  <SafeAvatar
                    src={t.foto_size ? `/api/media/team-avatar?id=${t.id}&t=${encodeURIComponent(t.updated_at || '')}` : undefined}
                    radius="md"
                    size={34}
                    color="nutralabColor"
                  >
                    {initials(t.nombre || '?')}
                  </SafeAvatar>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} c="bosque.8" truncate>{t.nombre}</Text>
                    <Text size="xs" c="salvia.6">{t.temporada ? `Temporada ${t.temporada}` : 'Equipo'}</Text>
                  </Box>
                </ResultRow>
              );
            })}

            {nothing && (
              <Text size="sm" c="salvia.6" px="sm" py="md">
                Ningún jugador ni equipo coincide con «{q}».
              </Text>
            )}

            {actions.length > 0 && <SectionLabel>Ir a</SectionLabel>}
            {actions.map((a, j) => {
              const i = actionOffset + j;
              return (
                <ResultRow key={`a-${a.id}`} index={i} active={active === i} onHover={() => setActive(i)} onSelect={() => select(items[i])}>
                  <IconTile icon={a.icon} />
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} c="bosque.8">{a.label}</Text>
                    <Text size="xs" c="salvia.6">{a.hint}</Text>
                  </Box>
                </ResultRow>
              );
            })}
          </Box>
        </ScrollArea.Autosize>

        <Group gap="md" px="md" py={8} visibleFrom="sm" style={{ borderTop: '1px solid var(--mantine-color-salvia-1)' }}>
          <Text size="xs" c="salvia.6"><Kbd size="xs">↑</Kbd> <Kbd size="xs">↓</Kbd> moverse</Text>
          <Text size="xs" c="salvia.6"><Kbd size="xs">↵</Kbd> abrir</Text>
          <Text size="xs" c="salvia.6"><Kbd size="xs">Esc</Kbd> cerrar</Text>
        </Group>
      </Modal>
    </>
  );
}
