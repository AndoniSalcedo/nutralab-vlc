'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import Icon3D from '@/components/Icon3D';
import { IconX } from '@/components/icons3d';
import classes from './PlayerIntrapartidoSummaryModal.module.css';
import { getPendingIntrapartidoSummary, markIntrapartidoSummarySeen } from '@/actions/intrapartidoActions';

/*
 * Coreografía (segundos). Una sola historia: se dibuja el campo, rueda el balón hasta el centro,
 * el campo se aleja y queda como textura, y el partido se "juega" en la ruta: en cada momento con
 * tomas cae una gota y las cuatro cifras suben a la vez. Al pitar el final, un brillo cierra la escena.
 */
const T = {
  pitch: 0.15,
  roll: 0.3,
  land: 1.2,
  zoom: 1.35,
  eyebrow: 1.45,
  title: 1.55,
  meta: 1.8,
  stats: 1.9,
  route: 2.35,
  routeDur: 2.1,
};
T.done = T.route + T.routeDur;
// Instante en que el corredor llega al momento i de n (repartidos a lo largo de la ruta)
const reachAt = (i, n) => T.route + (n > 1 ? i / (n - 1) : 1) * T.routeDur;

const EASE_OUT = [0.16, 1, 0.3, 1];
const STAT_KEYS = ['aguaMl', 'carbsG', 'sodioMg', 'kcal'];

// Etiquetas cortas para móvil de las fases por defecto (7 columnas en 390 px)
const SHORT_LABELS = { llegada: 'Llegada', calentamiento: 'Calent.', salida: 'Salida', pausa1: '1ªP', descanso: 'Desc.', pausa2: '2ªP', final: 'Final' };

// Líneas del campo (viewBox 340×212, centro en 170,106 = posición final del balón)
const PITCH_PATHS = [
  'M10 10 H330 V202 H10 Z',
  'M170 10 V202',
  'M170 76 a30 30 0 1 1 0 60 a30 30 0 1 1 0 -60',
  'M10 58 H60 V154 H10',
  'M330 58 H280 V154 H330',
  'M10 84 H28 V128 H10',
  'M330 84 H312 V128 H330',
  'M60 88 A26 26 0 0 1 60 124',
  'M280 88 A26 26 0 0 0 280 124',
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(new Date(`${dateStr}T00:00:00`));
}

function Stat({ index, label, unit, value, final, accent, tank, instant }) {
  const text = useTransform(value, (v) => Math.round(v).toLocaleString('es-ES'));
  // La cifra "late" mientras sube: escala según la velocidad del contador
  const velocity = useVelocity(value);
  const pop = useSpring(useTransform(velocity, (v) => 1 + Math.min(Math.abs(v) / Math.max(final * 4, 1), 0.16)), { stiffness: 500, damping: 22 });
  const bar = useTransform(value, (v) => (final > 0 ? Math.min(v / final, 1) : 0));
  const level = useSpring(value, { stiffness: 80, damping: 11 });
  const tankHeight = useTransform(level, (v) => `${Math.min(Math.max(v, 0) / 3000, 1) * 100}%`);

  return (
    <motion.div
      className={classes.stat}
      initial={instant ? false : { opacity: 0, rotateX: -75, y: 24 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 170, damping: 18, delay: instant ? 0 : T.stats + index * 0.09 }}
    >
      {tank && (
        <motion.div className={classes.tank} style={{ height: tankHeight }}>
          <div className={classes.tankSurface} />
        </motion.div>
      )}
      <div className={classes.statContent}>
        <div className={classes.statLabel}>{label}</div>
        <div>
          <motion.span className={classes.statValue} style={{ color: accent, scale: pop }}>{text}</motion.span>
          <span className={classes.statUnit}>{unit}</span>
        </div>
      </div>
      <motion.div className={classes.statBar} style={{ background: accent, scaleX: bar }} />
    </motion.div>
  );
}

function Stage({ summary, instant, tiltX, tiltY, onSkip, onClose, onDetail }) {
  const { totals, momentos } = summary;
  const at = (s) => (instant ? 0 : s);
  const from = (v) => (instant ? false : v);
  const doneRef = useRef(instant);

  const agua = useMotionValue(instant ? totals.aguaMl : 0);
  const carbs = useMotionValue(instant ? totals.carbsG : 0);
  const sodio = useMotionValue(instant ? totals.sodioMg : 0);
  const kcal = useMotionValue(instant ? totals.kcal : 0);

  // Parallax del campo: se mueve en sentido contrario a la inclinación de la tarjeta
  const pitchX = useTransform(tiltY, (v) => v * -2.5);
  const pitchY = useTransform(tiltX, (v) => v * 2.5);

  // Cada momento con tomas suma su parte a las cuatro cifras justo cuando cae la gota
  useEffect(() => {
    if (instant) return undefined;
    const values = { aguaMl: agua, carbsG: carbs, sodioMg: sodio, kcal };
    const timers = [];
    const running = [];
    const acc = { aguaMl: 0, carbsG: 0, sodioMg: 0, kcal: 0 };
    momentos.forEach((m, i) => {
      if (!m.items) return;
      STAT_KEYS.forEach((k) => { acc[k] += m[k] || 0; });
      const target = { ...acc };
      timers.push(setTimeout(() => {
        STAT_KEYS.forEach((k) => running.push(animate(values[k], target[k], { duration: 0.55, ease: EASE_OUT })));
      }, (reachAt(i, momentos.length) + 0.02) * 1000));
    });
    timers.push(setTimeout(() => {
      doneRef.current = true;
      STAT_KEYS.forEach((k) => running.push(animate(values[k], totals[k], { duration: 0.3 })));
    }, T.done * 1000));
    return () => {
      timers.forEach(clearTimeout);
      running.forEach((c) => c.stop());
    };
  }, [instant, momentos, totals, agua, carbs, sodio, kcal]);

  const title = summary.rival ? `vs ${summary.rival}` : 'Tu partido';

  return (
    <motion.div className={classes.stage} onTap={() => { if (!doneRef.current) onSkip(); }}>
      <motion.button
        type="button"
        className={classes.close}
        onClick={onClose}
        aria-label="Cerrar"
        initial={from({ opacity: 0, scale: 0.6 })}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: at(0.6) }}
      >
        <IconX size={16} />
      </motion.button>

      {/* Cuerpo: en móvil (pantalla completa) se centra en vertical y los botones quedan abajo */}
      <div className={classes.body}>
      <div className={classes.hero}>
        {/* Campo y brillo cuelgan del héroe: su centro coincide siempre con el del balón */}
        <motion.svg
          className={classes.pitch}
          viewBox="0 0 340 212"
          fill="none"
          aria-hidden
          initial={from({ scale: 1, opacity: 1 })}
          animate={{ scale: 2.4, opacity: 0.08 }}
          transition={{ delay: at(T.zoom), duration: instant ? 0 : 1.1, ease: EASE_OUT }}
          style={{ x: pitchX, y: pitchY }}
        >
          {PITCH_PATHS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              stroke="rgba(193, 240, 128, 0.55)"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={from({ pathLength: 0, opacity: 0 })}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: at(T.pitch + i * 0.07), duration: instant ? 0 : 0.9, ease: 'easeInOut' }}
            />
          ))}
        </motion.svg>

        <motion.div
          className={classes.glow}
          initial={from({ scale: 0.4, opacity: 0 })}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: at(T.land - 0.1), type: 'spring', stiffness: 90, damping: 14 }}
        >
          <div className={classes.glowBreath} />
        </motion.div>

        <div className={classes.ballSlot}>
          {!instant && [0, 1].map((r) => (
            <motion.span
              key={r}
              className={classes.ring}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 2.8], opacity: [0.9, 0] }}
              transition={{ delay: T.land + r * 0.18, duration: 1.2, ease: EASE_OUT }}
            />
          ))}
          {/* Rueda por la línea de medio campo hasta el punto central (distancia ≈ giro real) */}
          <motion.div
            initial={from({ x: -170, rotate: -300, opacity: 0 })}
            animate={{ x: 0, rotate: 0, opacity: 1 }}
            transition={{ delay: at(T.roll), duration: instant ? 0 : 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className={classes.ball}
              initial={false}
              animate={instant ? {} : { scaleX: [1, 1.14, 0.95, 1], scaleY: [1, 0.86, 1.05, 1] }}
              transition={{ delay: T.land - 0.05, duration: 0.45 }}
            >
              <Icon3D name="soccer" size={64} />
            </motion.div>
          </motion.div>
        </div>

        <span className={classes.mask}>
          <motion.span
            className={classes.eyebrow}
            style={{ display: 'block' }}
            initial={from({ y: '110%' })}
            animate={{ y: 0 }}
            transition={{ delay: at(T.eyebrow), duration: 0.6, ease: EASE_OUT }}
          >
            Tu control del partido
          </motion.span>
        </span>
        <span className={classes.mask}>
          <motion.span
            className={classes.title}
            style={{ display: 'block' }}
            initial={from({ y: '105%', skewY: 6 })}
            animate={{ y: 0, skewY: 0 }}
            transition={{ delay: at(T.title), duration: 0.75, ease: EASE_OUT }}
          >
            {title}
          </motion.span>
        </span>
        <motion.div
          className={classes.meta}
          initial={from({ opacity: 0, y: 8 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(T.meta), duration: 0.5, ease: EASE_OUT }}
        >
          <span>{[formatDate(summary.fecha), summary.competicion].filter(Boolean).join(' · ')}</span>
          <motion.span
            className={classes.badge}
            initial={from({ scale: 0 })}
            animate={{ scale: 1 }}
            transition={{ delay: at(T.meta + 0.15), type: 'spring', stiffness: 500, damping: 16 }}
          >
            {summary.titular ? 'Titular' : 'Suplente'}
          </motion.span>
        </motion.div>
      </div>

      {/* Ruta del partido: el corredor la recorre y en cada momento con tomas cae una gota */}
      <motion.div
        className={classes.route}
        style={{ '--momentos': momentos.length }}
        aria-label="Momentos del partido"
        initial={from({ opacity: 0 })}
        animate={{ opacity: 1 }}
        transition={{ delay: at(T.route - 0.3), duration: 0.4 }}
      >
        <div className={classes.track}>
          <div className={classes.trackBase} />
          <motion.div
            className={classes.trackFill}
            initial={from({ scaleX: 0 })}
            animate={{ scaleX: 1 }}
            transition={{ delay: at(T.route), duration: instant ? 0 : T.routeDur, ease: 'linear' }}
          />
          {!instant && (
            <motion.div
              className={classes.runner}
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
              transition={{
                left: { delay: T.route, duration: T.routeDur, ease: 'linear' },
                opacity: { delay: T.route - 0.1, duration: T.routeDur + 0.5, times: [0, 0.06, 0.88, 1] },
              }}
            />
          )}
        </div>

        {momentos.map((m, i) => {
          const active = m.items > 0;
          const reach = reachAt(i, momentos.length);
          return (
            <div key={m.id} className={classes.node}>
              <div className={classes.dotWrap}>
                {!instant && active && (
                  <>
                    <motion.div
                      className={classes.drop}
                      initial={{ y: -34, opacity: 0 }}
                      animate={{ y: [-34, -6, 0], opacity: [0, 1, 0], scaleY: [1.25, 1.25, 0.4] }}
                      transition={{ delay: reach - 0.34, duration: 0.36, ease: 'easeIn', times: [0, 0.85, 1] }}
                    />
                    <motion.div
                      className={classes.splash}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: [0.4, 2.6], opacity: [0.9, 0] }}
                      transition={{ delay: reach, duration: 0.7, ease: EASE_OUT }}
                    />
                  </>
                )}
                <motion.div
                  className={classes.dot}
                  initial={from({ scale: 0.6, backgroundColor: '#34443a', borderColor: 'rgba(164, 170, 142, 0.45)', boxShadow: '0 0 0px rgba(193, 240, 128, 0)' })}
                  animate={active
                    ? { scale: instant ? 1.15 : [0.6, 1.7, 1.15], backgroundColor: '#C1F080', borderColor: '#C1F080', boxShadow: '0 0 12px rgba(193, 240, 128, 0.75)' }
                    : { scale: 1, backgroundColor: '#34443a', borderColor: 'rgba(164, 170, 142, 0.45)', boxShadow: '0 0 0px rgba(193, 240, 128, 0)' }}
                  transition={{ delay: at(reach), duration: 0.5, ease: EASE_OUT }}
                />
              </div>
              <motion.div
                className={classes.nodeLabel}
                initial={from({ color: '#A4AA8E' })}
                animate={{ color: active ? '#F8F7F4' : '#A4AA8E' }}
                transition={{ delay: at(reach) }}
              >
                <span className={classes.labelFull}>{m.short}</span>
                <span className={classes.labelShort}>{SHORT_LABELS[m.id] || m.short}</span>
              </motion.div>
              <motion.div
                className={classes.nodeValue}
                initial={from({ opacity: 0, y: 6, scale: 0.6 })}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: at(reach + 0.05), type: 'spring', stiffness: 420, damping: 18 }}
              >
                {m.aguaMl > 0 ? `${Math.round(m.aguaMl)} ml` : ''}
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      <div className={classes.stats}>
        <Stat index={0} label="Líquidos" unit="ml" value={agua} final={totals.aguaMl} accent="#7cc6f2" tank instant={instant} />
        <Stat index={1} label="Carbohidratos" unit="g" value={carbs} final={totals.carbsG} accent="#f2b45c" instant={instant} />
        <Stat index={2} label="Sodio" unit="mg" value={sodio} final={totals.sodioMg} accent="#F8F7F4" instant={instant} />
        <Stat index={3} label="Energía" unit="kcal" value={kcal} final={totals.kcal} accent="#C1F080" instant={instant} />
      </div>
      </div>

      <motion.div
        className={classes.note}
        initial={from({ opacity: 0, y: 12 })}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: at(T.done + 0.1), duration: 0.5, ease: EASE_OUT }}
      >
        {totals.totalItems === 0 ? 'No se registraron tomas en este partido. ' : ''}
        Podrás volver a verlo en Métricas → Intrapartido.
      </motion.div>

      <motion.div
        className={classes.cta}
        initial={from({ opacity: 0, y: 18 })}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: at(T.done + 0.2), type: 'spring', stiffness: 260, damping: 22 }}
      >
        <Button
          variant="default"
          radius="xl"
          fullWidth
          onClick={onDetail}
          styles={{ root: { background: 'rgba(248,247,244,0.08)', color: '#F8F7F4', borderColor: 'rgba(248,247,244,0.18)' } }}
        >
          Ver detalle
        </Button>
        <Button color="lima" radius="xl" fullWidth onClick={onClose} data-autofocus>
          Entendido
        </Button>
      </motion.div>

      {/* Pitido final: un brillo cruza la tarjeta */}
      <motion.div
        className={classes.shine}
        initial={from({ x: '-110%' })}
        animate={{ x: '330%' }}
        transition={{ delay: at(T.done), duration: instant ? 0 : 1.2, ease: 'easeInOut' }}
      />

      {!instant && (
        <motion.div
          className={classes.hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: 1, duration: T.done - 1, times: [0, 0.1, 0.85, 1] }}
        >
          Toca para saltar la animación
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Aviso de una sola vez con el resumen del control intrapartido de un partido reciente.
 * Al cerrarlo (de cualquier forma) se marca como visto y no vuelve a salir; los datos
 * siguen en Métricas → Intrapartido.
 */
export default function PlayerIntrapartidoSummaryModal({ playerId }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 48em)', false);
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const afterExit = useRef(null);
  const dialogRef = useRef(null);

  // Inclinación 3D con el puntero (solo escritorio)
  const tiltX = useSpring(0, { stiffness: 150, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 150, damping: 18 });

  useEffect(() => {
    let cancelled = false;
    getPendingIntrapartidoSummary()
      .then((res) => {
        if (cancelled || !res.summary) return;
        setSummary(res.summary);
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const close = (goToDetail = false) => {
    if (!open || !summary) return;
    markIntrapartidoSummarySeen(summary.id).catch(() => {});
    afterExit.current = goToDetail ? () => router.push(`/dashboard/jugador/${playerId}/metricas/intrapartido`) : null;
    setOpen(false);
  };

  // Mientras está abierto: sin scroll de fondo, foco en el diálogo y Escape para cerrar
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!summary) return null;

  const handlePointerMove = (e) => {
    if (isMobile || reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    tiltY.set(((e.clientX - rect.left) / rect.width - 0.5) * 7);
    tiltX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 7);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const enter = isMobile
    ? { initial: { y: '110%' }, animate: { y: 0 }, exit: { y: '110%' } }
    : {
      initial: { opacity: 0, y: 50, scale: 0.9, rotateX: 14 },
      animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
      // Sin filter: blur, que en Chrome descoloca el contenido con transformaciones 3D
      exit: { opacity: 0, y: 30, scale: 0.94 },
    };

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className={classes.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => close(false)}
          />
        )}
      </AnimatePresence>
      <div className={classes.viewport}>
        <AnimatePresence
          onExitComplete={() => {
            afterExit.current?.();
            afterExit.current = null;
            setSummary(null);
          }}
        >
          {open && (
            <motion.div
              key="dialog"
              ref={dialogRef}
              className={classes.dialog}
              role="dialog"
              aria-modal="true"
              aria-label="Resumen de tu partido"
              tabIndex={-1}
              {...(reduceMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : enter)}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              style={{ transformPerspective: 1200 }}
            >
              <motion.div
                onPointerMove={handlePointerMove}
                onPointerLeave={resetTilt}
                style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }}
              >
                <Stage
                  key={skipped ? 'final' : 'intro'}
                  summary={summary}
                  instant={skipped || reduceMotion}
                  tiltX={tiltX}
                  tiltY={tiltY}
                  onSkip={() => setSkipped(true)}
                  onClose={() => close(false)}
                  onDetail={() => close(true)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}
