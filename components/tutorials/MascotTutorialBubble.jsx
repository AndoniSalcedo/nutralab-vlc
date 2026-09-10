'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '@mantine/hooks';
import {
  Box,
  Text,
  Title,
  Group,
  Stack,
  Button,
  ActionIcon,
  Progress,
  Badge,
} from '@mantine/core';
import {
  IconX,
  IconArrowLeft,
  IconChevronRight,
  IconCheck,
  IconEyeOff,
  IconSparkles,
} from '@tabler/icons-react';

export default function MascotTutorialBubble({
  index,
  size,
  step,
  isLastStep,
  controls,
  backProps,
  primaryProps,
  skipProps,
  closeProps,
  tooltipProps,
  onClose,
  onFinish,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [placement, setPlacement] = useState('bottom');
  const [side, setSide] = useState('left');
  const [mascotWiggle, setMascotWiggle] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Posicionamiento vertical (top/bottom) y horizontal (left/right) configurable
  const updatePlacement = useCallback(() => {
    const isTopPlacement =
      step?.data?.placement === 'top' ||
      step?.placement === 'top' ||
      step?.target?.includes?.('mobile-nav');
    setPlacement(isTopPlacement ? 'top' : 'bottom');

    const chosenSide = step?.data?.side || step?.side || 'left';
    setSide(chosenSide);
  }, [step?.data?.placement, step?.data?.side, step?.placement, step?.side, step?.target]);

  useEffect(() => {
    updatePlacement();
    setIsBubbleVisible(true);
  }, [index, updatePlacement]);

  const handleMascotClick = () => {
    setMascotWiggle(true);
    setTimeout(() => setMascotWiggle(false), 800);
  };

  const progressPercent = useMemo(() => {
    return Math.round(((index + 1) / size) * 100);
  }, [index, size]);

  // Dimensiones responsivas de la mascota Nutra (mantiene relación 249x575 ≈ 0.433)
  const mascotHeight = isDesktop ? 220 : 170;
  const mascotWidth = Math.round(mascotHeight * (249 / 575)); // ≈ 95px escritorio, 74px móvil
  const mascotShiftY = isDesktop ? 12 : 10;
  const mouthY = Math.round(mascotHeight * 0.47) - mascotShiftY;

  // Dimensiones del rabillo SVG
  const tailWidth = isDesktop ? 20 : 17;
  const tailHeight = isDesktop ? 26 : 22;
  const tailOffset = isDesktop ? -18.5 : -15.5;

  const content = (
    <Box
      className="nutra-tutorial-root"
      style={{
        position: 'fixed',
        zIndex: 10002,
        pointerEvents: 'none',
        ...(side === 'right'
          ? {
              right: 0,
              left: 'auto',
            }
          : {
              left: 0,
              right: 'auto',
            }),
        ...(placement === 'top'
          ? {
              top: isDesktop ? '20px' : 'max(16px, calc(env(safe-area-inset-top, 0px) + 14px))',
              bottom: 'auto',
            }
          : {
              bottom: isDesktop
                ? '32px'
                : 'max(76px, calc(env(safe-area-inset-bottom, 0px) + 76px))',
              top: 'auto',
            }),
        width: '100%',
        maxWidth: isDesktop ? 510 : 'min(450px, 100vw)',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes nutraPeekIn {
          0% {
            transform: translateX(-55px) rotate(-6deg);
            opacity: 0;
          }
          65% {
            transform: translateX(4px) rotate(1.5deg);
            opacity: 1;
          }
          85% {
            transform: translateX(-2px) rotate(-0.5deg);
          }
          100% {
            transform: translateX(0px) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes nutraFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes nutraWiggleAnim {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-6deg) scale(1.06); }
          50% { transform: rotate(5deg) scale(1.06); }
          75% { transform: rotate(-3deg) scale(1.03); }
          100% { transform: rotate(0deg) scale(1); }
        }

        @keyframes bubblePopIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(6px);
          }
          70% {
            opacity: 1;
            transform: scale(1.015) translateY(-1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .nutra-mascot-img {
          animation: nutraPeekIn 0.5s cubic-bezier(0.34, 1.5, 0.64, 1) forwards;
          will-change: transform, opacity;
          cursor: pointer;
          user-select: none;
          -webkit-user-drag: none;
        }

        .nutra-mascot-floating {
          animation: nutraFloat 3.2s ease-in-out infinite;
        }

        .nutra-mascot-wiggle {
          animation: nutraWiggleAnim 0.75s ease-in-out !important;
        }

        .nutra-speech-bubble {
          animation: bubblePopIn 0.38s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>

      <Box
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingLeft: side === 'right' ? (isDesktop ? 18 : 14) : 0,
          paddingRight: side === 'right' ? 0 : (isDesktop ? 18 : 14),
          boxSizing: 'border-box',
        }}
      >
        {/* 1. Mascota Nutra asomada a izquierda o derecha con flip */}
        <Box
          onClick={handleMascotClick}
          style={{
            position: 'absolute',
            left: side === 'left' ? -2 : 'auto',
            right: side === 'right' ? 0 : 'auto',
            top: 0,
            bottom: 0,
            width: mascotWidth,
            display: 'flex',
            alignItems: 'center',
            justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
          title="¡Hola! Soy Nutra 🥑"
        >
          <div
            style={{
              transform: side === 'right' ? `scaleX(-1) translateY(-${mascotShiftY}px)` : `translateY(-${mascotShiftY}px)`,
              transformOrigin: 'center center',
            }}
          >
            <div
              key={`mascot-${index}-${side}`}
              className={`nutra-mascot-img nutra-mascot-floating ${
                mascotWiggle ? 'nutra-mascot-wiggle' : ''
              }`}
              style={{
                width: mascotWidth,
                height: mascotHeight,
                position: 'relative',
              }}
            >
              <img
                src="/mascot/image__1.png"
                alt="Nutra, Mascota de NutraLab"
                width={mascotWidth}
                height={mascotHeight}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: side === 'right' ? 'right center' : 'left center',
                  display: 'block',
                  filter:
                    side === 'right'
                      ? 'drop-shadow(-3px 8px 14px rgba(45, 60, 25, 0.22))'
                      : 'drop-shadow(3px 8px 14px rgba(45, 60, 25, 0.22))',
                }}
              />
            </div>
          </div>
        </Box>

        {/* 2. Bocadillo de diálogo saliendo de su boca */}
        <Box
          key={`bubble-${index}-${side}`}
          className="nutra-speech-bubble"
          style={{
            marginLeft: side === 'left' ? mascotWidth - 6 : 0,
            marginRight: side === 'right' ? mascotWidth - 6 : 0,
            flex: 1,
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1.5px solid rgba(110, 145, 80, 0.32)',
            borderRadius: isDesktop ? 24 : 20,
            boxShadow:
              '0 14px 34px -4px rgba(35, 55, 20, 0.16), 0 3px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: isDesktop ? '14px 18px 14px 18px' : '12px 14px 12px 14px',
            pointerEvents: 'auto',
            opacity: isBubbleVisible ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* Rabillo apuntando a Nutra */}
          <svg
            width={tailWidth}
            height={tailHeight}
            viewBox="0 0 17 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              ...(side === 'left'
                ? {
                    left: tailOffset,
                    right: 'auto',
                    filter: 'drop-shadow(-2px 1px 1.5px rgba(45, 60, 25, 0.06))',
                  }
                : {
                    right: tailOffset,
                    left: 'auto',
                    filter: 'drop-shadow(2px 1px 1.5px rgba(45, 60, 25, 0.06))',
                  }),
              top: `clamp(18px, ${mouthY - (isDesktop ? 12 : 10)}px, calc(100% - 34px))`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {side === 'left' ? (
              <>
                <path
                  d="M17 0 C11 5, 2 9.5, 0 11 C2 12.5, 11 17, 17 22 Z"
                  fill="rgba(255, 255, 255, 0.98)"
                />
                <path
                  d="M17 0 C11 5, 2 9.5, 0 11 C2 12.5, 11 17, 17 22"
                  stroke="rgba(110, 145, 80, 0.32)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : (
              <>
                <path
                  d="M0 0 C6 5, 15 9.5, 17 11 C15 12.5, 6 17, 0 22 Z"
                  fill="rgba(255, 255, 255, 0.98)"
                />
                <path
                  d="M0 0 C6 5, 15 9.5, 17 11 C15 12.5, 6 17, 0 22"
                  stroke="rgba(110, 145, 80, 0.32)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}
          </svg>

          <Stack gap={isDesktop ? 9 : 7}>
            {/* Encabezado: Badge Nutra + Paso + Cerrar */}
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap={isDesktop ? 8 : 6} align="center">
                <Badge
                  size={isDesktop ? 'md' : 'sm'}
                  variant="light"
                  color="teal"
                  radius="xl"
                  leftSection={<IconSparkles size={isDesktop ? 13 : 11} />}
                  styles={{
                    root: {
                      paddingLeft: isDesktop ? 8 : 6,
                      paddingRight: isDesktop ? 10 : 8,
                      fontWeight: 700,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      backgroundColor: 'rgba(46, 125, 50, 0.12)',
                      color: '#2e7d32',
                    },
                  }}
                >
                  Nutra
                </Badge>
                <Text size={isDesktop ? 'sm' : 'xs'} fw={700} c="dimmed" style={{ letterSpacing: '0.4px' }}>
                  PASO {index + 1} DE {size}
                </Text>
              </Group>

              <ActionIcon
                variant="subtle"
                color="gray"
                size={isDesktop ? 'md' : 'sm'}
                radius="xl"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onClose) onClose();
                  else if (closeProps?.onClick) closeProps.onClick(e);
                  else if (controls?.close) controls.close();
                }}
                aria-label="Cerrar tutorial"
                style={{
                  color: '#6b7280',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <IconX size={isDesktop ? 16 : 14} stroke={2.2} />
              </ActionIcon>
            </Group>

            {/* Barra de progreso */}
            <Progress
              value={progressPercent}
              size={isDesktop ? 4 : 3}
              radius="xl"
              color="teal.7"
              bg="rgba(110, 145, 80, 0.14)"
              animated={progressPercent < 100}
            />

            {/* Título y Mensaje de Nutra */}
            <Box>
              {step.title && (
                <Title
                  order={4}
                  size={isDesktop ? 'md' : 'sm'}
                  fw={750}
                  c="#1c2b12"
                  mb={isDesktop ? 5 : 3}
                  lh={1.25}
                  style={{
                    letterSpacing: '-0.2px',
                    fontSize: isDesktop ? '1.01rem' : '0.94rem',
                  }}
                >
                  {step.title}
                </Title>
              )}
              <Text
                size={isDesktop ? 'sm' : 'xs'}
                c="#37472f"
                lh={isDesktop ? 1.5 : 1.4}
                style={{
                  fontSize: isDesktop ? '0.9rem' : '0.82rem',
                  letterSpacing: '0.01em',
                }}
              >
                {step.content}
              </Text>
            </Box>

            {/* Botones de navegación y cierre */}
            <Group justify="space-between" align="center" mt={isDesktop ? 4 : 2} wrap="nowrap">
              <Button
                variant="subtle"
                color="gray"
                size={isDesktop ? 'sm' : 'xs'}
                radius="xl"
                leftSection={<IconEyeOff size={isDesktop ? 14 : 12} />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onFinish) onFinish();
                  else if (skipProps?.onClick) skipProps.onClick(e);
                  else if (controls?.skip) controls.skip();
                }}
                styles={{
                  root: {
                    paddingLeft: 2,
                    paddingRight: 6,
                    color: '#71796b',
                    fontSize: isDesktop ? '0.78rem' : '0.72rem',
                    fontWeight: 500,
                  },
                }}
              >
                No mostrar más
              </Button>

              <Group gap={6} wrap="nowrap">
                {index > 0 && (
                  <Button
                    variant="default"
                    size={isDesktop ? 'sm' : 'xs'}
                    radius="xl"
                    leftSection={<IconArrowLeft size={isDesktop ? 14 : 12} />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (backProps?.onClick) {
                        backProps.onClick(e);
                      } else if (controls?.prev) {
                        controls.prev();
                      }
                    }}
                    styles={{
                      root: {
                        borderColor: 'rgba(110, 145, 80, 0.3)',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        fontSize: isDesktop ? '0.82rem' : '0.76rem',
                        fontWeight: 600,
                        paddingLeft: isDesktop ? 10 : 8,
                        paddingRight: isDesktop ? 12 : 10,
                        height: isDesktop ? 30 : 26,
                      },
                    }}
                  >
                    Atrás
                  </Button>
                )}

                <Button
                  data-action={isLastStep ? 'close' : 'primary'}
                  variant="filled"
                  color="teal"
                  size={isDesktop ? 'sm' : 'xs'}
                  radius="xl"
                  rightSection={
                    isLastStep ? (
                      <IconCheck size={isDesktop ? 15 : 13} stroke={2.5} />
                    ) : (
                      <IconChevronRight size={isDesktop ? 15 : 13} stroke={2.5} />
                    )
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLastStep) {
                      if (onFinish) onFinish();
                      if (primaryProps?.onClick) primaryProps.onClick(e);
                      else if (controls?.close) controls.close();
                    } else {
                      if (primaryProps?.onClick) {
                        primaryProps.onClick(e);
                      } else if (controls?.next) {
                        controls.next();
                      }
                    }
                  }}
                  styles={{
                    root: {
                      backgroundColor: '#2e7d32',
                      fontSize: isDesktop ? '0.84rem' : '0.78rem',
                      fontWeight: 650,
                      boxShadow: '0 3px 10px rgba(46, 125, 50, 0.28)',
                      paddingLeft: isDesktop ? 13 : 11,
                      paddingRight: isDesktop ? 13 : 11,
                      height: isDesktop ? 30 : 26,
                    },
                  }}
                >
                  {isLastStep ? '¡Empezar!' : 'Siguiente'}
                </Button>
              </Group>
            </Group>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <span
        style={{
          display: 'block',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
        data-action="mascot-tooltip-ref"
      />
      {mounted && typeof document !== 'undefined' && createPortal(content, document.body)}
    </>
  );
}
