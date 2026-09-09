'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import {
  MASCOT_ANIMATIONS,
  MASCOT_TRANSITIONS,
  getAllMascotFrameUrls,
} from './mascotConfig';

export default function MascotAvatar({
  state = 'idle',
  size = 200,
  showSpeech = true,
  customMessage,
}) {
  const currentConfig = MASCOT_ANIMATIONS[state] || MASCOT_ANIMATIONS.idle;
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeFrames, setActiveFrames] = useState(currentConfig.frames);

  const prevStateRef = useRef(state);
  const timerRef = useRef(null);
  const directionRef = useRef(1); // 1 = adelante, -1 = atrás (para ping-pong)
  const currentIndexRef = useRef(0);

  // 1. Precarga de todos los fotogramas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urls = getAllMascotFrameUrls();
    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, []);

  // 2. Control de cambio de estado
  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (prevState !== state) {
      const transitionKey = `${prevState}->${state}`;
      const transitionFrames = MASCOT_TRANSITIONS[transitionKey];

      if (transitionFrames && transitionFrames.length > 0) {
        setIsTransitioning(true);
        setActiveFrames(transitionFrames);
        setCurrentFrameIndex(0);
        currentIndexRef.current = 0;
        directionRef.current = 1;
      } else {
        setIsTransitioning(false);
        setActiveFrames(currentConfig.frames);
        setCurrentFrameIndex(0);
        currentIndexRef.current = 0;
        directionRef.current = 1;
      }
    } else if (!isTransitioning) {
      setActiveFrames(currentConfig.frames);
    }
  }, [state, currentConfig, isTransitioning]);

  // 3. Temporizador frame a frame (utiliza los fotogramas directos sin efectos CSS artificiales)
  useEffect(() => {
    if (!activeFrames || activeFrames.length === 0) return;

    const scheduleNextFrame = () => {
      const durations = currentConfig.frameDurations || [400, 400, 400, 400];
      const curIdx = currentIndexRef.current;
      const durationMs = isTransitioning ? 250 : (durations[curIdx] || 400);

      timerRef.current = setTimeout(() => {
        const total = activeFrames.length;

        if (isTransitioning) {
          if (curIdx + 1 < total) {
            const next = curIdx + 1;
            currentIndexRef.current = next;
            setCurrentFrameIndex(next);
            scheduleNextFrame();
          } else {
            setIsTransitioning(false);
            setActiveFrames(currentConfig.frames);
            currentIndexRef.current = 0;
            setCurrentFrameIndex(0);
            directionRef.current = 1;
            scheduleNextFrame();
          }
          return;
        }

        const loopStart = typeof currentConfig.loopStartIndex === 'number'
          ? Math.max(0, Math.min(total - 1, currentConfig.loopStartIndex))
          : 0;

        let nextIdx;
        if (currentConfig.pingPong && (total - loopStart) > 1) {
          nextIdx = curIdx + directionRef.current;
          if (nextIdx >= total) {
            directionRef.current = -1;
            nextIdx = total - 2;
          } else if (nextIdx < loopStart) {
            directionRef.current = 1;
            nextIdx = loopStart < total - 1 ? loopStart + 1 : loopStart;
          }
        } else if (curIdx + 1 < total) {
          nextIdx = curIdx + 1;
        } else {
          // Final de la secuencia alcanzado
          if (currentConfig.loop === false) {
            return; // Se detiene en el último fotograma
          }
          nextIdx = loopStart;
        }

        const safeIdx = Math.max(0, Math.min(total - 1, nextIdx));
        currentIndexRef.current = safeIdx;
        setCurrentFrameIndex(safeIdx);
        scheduleNextFrame();
      }, durationMs);
    };

    scheduleNextFrame();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeFrames, currentConfig, isTransitioning]);

  const frameSrc = activeFrames[currentFrameIndex] || currentConfig.frames[0];
  const displayMessage = customMessage || currentConfig.message;

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Zona reservada para el bocadillo con altura fija estable (evita saltos al cambiar entre 1 y 2 líneas) */}
      {showSpeech && (
        <Box
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'flex-end', // Anclado firmemente a la base (hacia el muñeco)
            justifyContent: 'center',
            width: '100%',
            position: 'relative',
            marginBottom: -Math.round(size * 0.11), // Solape exacto con el margen transparente del PNG
            zIndex: 10,
          }}
        >
          {displayMessage && (
            <Box
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                border: '1.5px solid rgba(135, 140, 115, 0.28)',
                borderRadius: '16px 16px 16px 6px',
                padding: '6px 14px',
                boxShadow:
                  '0 4px 18px rgba(60, 65, 45, 0.08), 0 1px 3px rgba(60, 65, 45, 0.04)',
                backdropFilter: 'blur(8px)',
                textAlign: 'center',
                position: 'relative',
                maxWidth: Math.max(280, size * 1.5),
                minWidth: 150,
                transition: 'max-width 0.2s ease, opacity 0.2s ease',
              }}
            >
              <Text
                size="12px"
                fw={600}
                c="#3a3d2c"
                style={{
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                  whiteSpace: 'normal',
                }}
              >
                {displayMessage}
              </Text>

              {/* Pico del bocadillo apuntando fijamente hacia la boca de Nutra sin moverse al cambiar el ancho */}
              <svg
                width="14"
                height="11"
                viewBox="0 0 14 11"
                style={{
                  position: 'absolute',
                  bottom: -10,
                  left: 'calc(50% - 14px)',
                  overflow: 'visible',
                }}
              >
                <polygon
                  points="0,0 5,10 14,0"
                  fill="rgba(255, 255, 255, 0.98)"
                  stroke="rgba(135, 140, 115, 0.28)"
                  strokeWidth="1.5"
                />
                <rect x="0.5" y="-1.5" width="13" height="3" fill="rgba(255, 255, 255, 0.98)" />
              </svg>
            </Box>
          )}
        </Box>
      )}

      {/* Contenedor del personaje con dimensiones precisas */}
      <Box
        style={{
          width: size,
          height: size,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Sombra de contacto orgánica en el suelo */}
        <Box
          style={{
            position: 'absolute',
            bottom: size * 0.1,
            width: size * 0.48,
            height: size * 0.09,
            background:
              'radial-gradient(ellipse at center, rgba(60, 65, 45, 0.16) 0%, rgba(60, 65, 45, 0.04) 50%, transparent 75%)',
            borderRadius: '50%',
            filter: 'blur(3px)',
            pointerEvents: 'none',
            transition: 'transform 0.3s ease',
            transform: state === 'success' ? 'scale(0.85) translateY(8px)' : 'scale(1)',
          }}
        />

        {/* Imagen PNG transparente pura sin efectos CSS de rotación ni distorsión */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameSrc}
          alt={`Mascota Nutralab - ${currentConfig.label}`}
          width={size}
          height={size}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            imageRendering: 'crisp-edges',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Box>
  );
}
