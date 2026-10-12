'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Icon3D from '@/components/Icon3D';
import AnimatedNumber from '@/components/motion/AnimatedNumber';
import { IconX } from '@/components/icons3d';
import { getPlayerNews } from '@/actions/playerNewsActions';

const EASE_OUT = [0.16, 1, 0.3, 1];
const DAY_SHORT = { lunes: 'L', martes: 'M', miercoles: 'X', jueves: 'J', viernes: 'V', sabado: 'S', domingo: 'D' };
const TYPE_COLOR = { partido: '#f2b45c', entreno: '#C1F080', descanso: '#7cc6f2' };
const TREND_COLOR = { mejora: '#C1F080', empeora: '#f2a07c', estable: '#A4AA8E' };
const TREND_ARROW = { mejora: '↗', empeora: '↘', estable: '→' };

const seenKey = (playerId) => `nutralab_news_seen_${playerId}`;

function readSeen(playerId) {
  try {
    return JSON.parse(localStorage.getItem(seenKey(playerId)) || '[]');
  } catch {
    return [];
  }
}

function markSeen(playerId, ids) {
  try {
    localStorage.setItem(seenKey(playerId), JSON.stringify([...new Set([...readSeen(playerId), ...ids])].slice(-50)));
  } catch {}
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(new Date(`${String(dateStr).slice(0, 10)}T00:00:00`));
}

const rise = (delay) => ({
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.55, delay, ease: EASE_OUT },
});

function AnaliticaSlide({ item }) {
  return (
    <>
      <motion.div {...rise(0.1)} style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}>
          <Icon3D name="stethoscope" size={60} />
        </motion.div>
      </motion.div>
      <motion.div {...rise(0.25)} style={styles.eyebrow}>Nueva analítica</motion.div>
      <motion.div {...rise(0.35)} style={styles.title}>{formatDate(item.fecha)}</motion.div>

      <div style={styles.counters}>
        {[
          { label: 'mejoran', value: item.mejoran, color: '#C1F080' },
          { label: 'empeoran', value: item.empeoran, color: '#f2a07c' },
          { label: 'fuera de rango', value: item.fueraRango, color: '#F8F7F4' },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.5 + i * 0.1 }}
            style={styles.counter}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}><AnimatedNumber value={c.value} /></div>
            <div style={styles.counterLabel}>{c.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        {item.params.map((p, i) => (
          <motion.div
            key={p.nombre}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.85 + i * 0.08, ease: EASE_OUT }}
            style={styles.row}
          >
            <span style={{ fontWeight: 700 }}>{p.nombre}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, color: p.fuera_rango ? '#f2a07c' : '#F8F7F4' }}>
                {p.valor} <span style={{ fontWeight: 500, color: '#A4AA8E', fontSize: 11 }}>{p.unidad}</span>
              </span>
              {p.trend && <span style={{ color: TREND_COLOR[p.trend], fontWeight: 800 }}>{TREND_ARROW[p.trend]}</span>}
            </span>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function PlanSlide({ item }) {
  return (
    <>
      <motion.div {...rise(0.1)} style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.4, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 13, delay: 0.1 }}>
          <Icon3D name="calendar" size={60} />
        </motion.div>
      </motion.div>
      <motion.div {...rise(0.25)} style={styles.eyebrow}>Nuevo plan nutricional</motion.div>
      <motion.div {...rise(0.35)} style={{ ...styles.title, fontSize: 24 }}>{item.nombre}</motion.div>

      {/* Los días se giran uno a uno como cartas */}
      <div style={styles.week}>
        {item.dias.map((d, i) => (
          <motion.div
            key={d.dia}
            initial={{ opacity: 0, rotateY: 90, y: 10 }}
            animate={{ opacity: 1, rotateY: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.55 + i * 0.09 }}
            style={styles.day}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#A4AA8E' }}>{DAY_SHORT[d.dia] || d.dia[0]}</div>
            <div style={{ width: 8, height: 8, borderRadius: 8, margin: '6px auto', background: TYPE_COLOR[d.tipo] || '#A4AA8E' }} />
            <div style={{ fontSize: 12, fontWeight: 800 }}>{(d.kcal / 1000).toFixed(1).replace('.', ',')}k</div>
          </motion.div>
        ))}
      </div>
      <motion.div {...rise(1.3)} style={styles.legend}>
        <span><i style={{ ...styles.dot, background: TYPE_COLOR.entreno }} />Entreno</span>
        <span><i style={{ ...styles.dot, background: TYPE_COLOR.partido }} />Partido</span>
        <span><i style={{ ...styles.dot, background: TYPE_COLOR.descanso }} />Descanso</span>
      </motion.div>
    </>
  );
}

/**
 * Aviso animado de una sola vez (por dispositivo) cuando el jugador tiene una analítica
 * o un plan nuevos. Espera a que no haya otro diálogo abierto (p. ej. el resumen del partido).
 */
export default function PlayerNewsModal({ playerId }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 48em)', false);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const afterExit = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer;
    getPlayerNews()
      .then((res) => {
        if (cancelled) return;
        const seen = readSeen(playerId);
        const pending = (res.news || []).filter((n) => !seen.includes(n.id));
        if (!pending.length) return;
        setItems(pending);
        // Si hay otro diálogo (resumen de partido, tutorial…) se espera a que se cierre
        const tryOpen = () => {
          if (cancelled) return;
          if (document.querySelector('[role="dialog"][aria-modal="true"]')) timer = setTimeout(tryOpen, 1500);
          else setOpen(true);
        };
        timer = setTimeout(tryOpen, 2000);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [playerId]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!items.length) return null;

  const item = items[index];
  const isLast = index === items.length - 1;

  const close = (href) => {
    markSeen(playerId, items.map((i) => i.id));
    afterExit.current = href ? () => router.push(href) : null;
    setOpen(false);
  };

  const detailHref = item.kind === 'plan'
    ? `/dashboard/jugador/${playerId}/nutricion/plan`
    : `/dashboard/jugador/${playerId}/metricas/analiticas`;

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.backdrop} onClick={() => close()} />
        )}
      </AnimatePresence>
      <div style={{ ...styles.viewport, alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? 10 : 16 }}>
        <AnimatePresence onExitComplete={() => { afterExit.current?.(); afterExit.current = null; setItems([]); }}>
          {open && (
            <motion.div
              key="dialog"
              role="dialog"
              aria-modal="true"
              aria-label={item.kind === 'plan' ? 'Nuevo plan nutricional' : 'Nueva analítica'}
              initial={reduce ? { opacity: 0 } : isMobile ? { y: '110%' } : { opacity: 0, y: 40, scale: 0.92 }}
              animate={reduce ? { opacity: 1 } : isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : isMobile ? { y: '110%' } : { opacity: 0, y: 24, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 230, damping: 26 }}
              style={styles.dialog}
            >
              <div style={styles.stage}>
                <div style={styles.glow} />
                <button type="button" onClick={() => close()} aria-label="Cerrar" style={styles.close}><IconX size={16} /></button>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    style={{ position: 'relative' }}
                  >
                    {item.kind === 'plan' ? <PlanSlide item={item} /> : <AnaliticaSlide item={item} />}
                  </motion.div>
                </AnimatePresence>

                {items.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    {items.map((it, i) => (
                      <motion.span key={it.id} animate={{ width: i === index ? 20 : 6, opacity: i === index ? 1 : 0.4 }} style={{ height: 6, borderRadius: 6, background: '#C1F080' }} />
                    ))}
                  </div>
                )}

                <motion.div {...rise(1.1)} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <Button
                    variant="default"
                    radius="xl"
                    fullWidth
                    onClick={() => close(detailHref)}
                    styles={{ root: { background: 'rgba(248,247,244,0.08)', color: '#F8F7F4', borderColor: 'rgba(248,247,244,0.18)' } }}
                  >
                    {item.kind === 'plan' ? 'Ver plan' : 'Ver analítica'}
                  </Button>
                  <Button color="lima" radius="xl" fullWidth onClick={() => (isLast ? close() : setIndex((i) => i + 1))}>
                    {isLast ? 'Entendido' : 'Siguiente'}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}

const styles = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(13, 18, 16, 0.72)', backdropFilter: 'blur(8px)' },
  viewport: { position: 'fixed', inset: 0, zIndex: 2001, display: 'flex', justifyContent: 'center', pointerEvents: 'none' },
  dialog: { width: '100%', maxWidth: 480, pointerEvents: 'auto', perspective: 900 },
  stage: {
    position: 'relative',
    overflow: 'clip',
    borderRadius: 28,
    padding: '28px 22px 22px',
    color: '#F8F7F4',
    background: 'radial-gradient(120% 80% at 50% 0%, #2c3d33 0%, #1F2A24 55%, #141c18 100%)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
  },
  glow: {
    position: 'absolute',
    top: -140,
    left: '50%',
    width: 360,
    height: 360,
    marginLeft: -180,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(193,240,128,0.28) 0%, rgba(193,240,128,0) 65%)',
    pointerEvents: 'none',
  },
  close: { position: 'absolute', top: 12, right: 12, zIndex: 2, width: 32, height: 32, display: 'grid', placeItems: 'center', border: 0, borderRadius: 999, color: '#F8F7F4', background: 'rgba(248,247,244,0.1)', cursor: 'pointer' },
  eyebrow: { marginTop: 8, textAlign: 'center', fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700, color: '#C1F080' },
  title: { textAlign: 'center', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, marginTop: 2 },
  counters: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 },
  counter: { borderRadius: 18, padding: '12px 8px', textAlign: 'center', background: 'rgba(248,247,244,0.06)', border: '1px solid rgba(248,247,244,0.09)' },
  counterLabel: { marginTop: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A4AA8E' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 12, background: 'rgba(248,247,244,0.05)', fontSize: 13 },
  week: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 20 },
  day: { borderRadius: 14, padding: '10px 2px', textAlign: 'center', background: 'rgba(248,247,244,0.06)', border: '1px solid rgba(248,247,244,0.09)', transformOrigin: 'center' },
  legend: { display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12, fontSize: 11, color: '#A4AA8E' },
  dot: { display: 'inline-block', width: 7, height: 7, borderRadius: 7, marginRight: 5 },
};
