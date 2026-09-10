'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Joyride, ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useRouter, usePathname } from 'next/navigation';
import { useMediaQuery } from '@mantine/hooks';
import MascotTutorialBubble from './MascotTutorialBubble';

const TUTORIAL_KEY = 'nutralab_vlc_player_tutorial_completed_v0';

export default function PlayerTutorial({ jugador }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mounted, setMounted] = useState(false);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingStepIndex, setPendingStepIndex] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  const jugadorId = jugador?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!jugadorId) return;

    const completed = localStorage.getItem(TUTORIAL_KEY);
    if (!completed) {
      // Pequeño retardo para asegurar que la vista cargue y monte el DOM
      const timer = setTimeout(() => {
        setRun(true);
      }, 750);
      return () => clearTimeout(timer);
    }

    // Disparador global para reiniciar o probar el tutorial cómodamente
    const handleStartTutorial = () => {
      localStorage.removeItem(TUTORIAL_KEY);
      setStepIndex(0);
      setRun(true);
    };

    window.startNutralabTutorial = handleStartTutorial;
    window.addEventListener('nutralab:start-tutorial', handleStartTutorial);

    return () => {
      window.removeEventListener('nutralab:start-tutorial', handleStartTutorial);
    };
  }, [jugadorId]);

  const handleFinish = () => {
    setRun(false);
    localStorage.setItem(TUTORIAL_KEY, 'true');
  };

  const handleClose = () => {
    setRun(false);
  };

  // --- DEFINICIÓN DE PASOS CON LA VOZ DE NUTRA ---
  const steps = useMemo(() => {
    if (!jugadorId) return [];

    const basePerfil = `/dashboard/jugador/${jugadorId}/resumen/perfil`;
    const baseDiario = `/dashboard/jugador/${jugadorId}/resumen/diario`;
    const basePlan = `/dashboard/jugador/${jugadorId}/nutricion/plan`;
    const baseProtocolos = `/dashboard/jugador/${jugadorId}/nutricion/protocolos`;
    const baseMediciones = `/dashboard/jugador/${jugadorId}/metricas/mediciones`;
    const basePesos = `/dashboard/jugador/${jugadorId}/metricas/pesos`;
    const baseHidratacion = `/dashboard/jugador/${jugadorId}/metricas/hidratacion`;

    const nutricionNavTarget = isDesktop ? '#tab-nav-nutricion' : '#mobile-nav-nutricion';
    const metricasNavTarget = isDesktop ? '#tab-nav-metricas' : '#mobile-nav-metricas';
    const navPlacement = isDesktop ? 'bottom' : 'top';

    return [
      // 1. BIENVENIDA
      {
        target: 'body',
        placement: 'center',
        title: '¡Hola! Soy Nutra 🥑',
        content: '¡Bienvenido a NutraLab! Voy a acompañarte en un tour rápido para enseñarte todo lo que tienes a tu alcance en tu panel de jugador.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'left' },
      },

      // 2. BALANCE NUTRICIONAL
      {
        target: '#widget-balance-nutricional',
        title: 'Balance Nutricional Diario ⚡',
        content: 'Aquí tienes tu objetivo de calorías y macronutrientes (proteínas, hidratos y grasas) calculado según tu tipo de día (entreno, descanso o partido).',
        disableBeacon: true,
        data: { route: basePerfil, side: 'left' },
      },

      // 3. ESTADO FÍSICO Y PESO
      {
        target: '#widget-fisico',
        title: 'Estado Físico y Peso ⚖️',
        content: 'Consulta tu último peso registrado, porcentaje de grasa y el semáforo para comprobar si estás en tu rango óptimo de competición.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'right' },
      },

      // 4. SUDORACIÓN
      {
        target: '#widget-sudor',
        title: 'Control de Sudoración 💦',
        content: 'Monitoriza tu tasa de sudoración y concentración de sodio para ajustar tu reposición de sales en cada sesión y partido.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'right' },
      },

      // 5. MENSAJES DEL STAFF
      {
        target: '#widget-mensajes',
        title: 'Comunicaciones del Staff 📬',
        content: 'Recibe indicaciones, pautas personalizadas y avisos directos de tu nutricionista y cuerpo técnico.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'right' },
      },

      // 6. HIDRATACIÓN
      {
        target: '#widget-water',
        title: 'Registro de Hidratación 💧',
        content: '¡Mantén tus niveles al 100%! Puedes registrar tus tomas de agua con los botones rápidos o pulsando directamente en la botella interactiva.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'left' },
      },

      // 7. COMEDOR
      {
        target: '#widget-comedor',
        title: 'Menú del Comedor 🍽️',
        content: 'Revisa las opciones preparadas por el club en la Ciudad Deportiva para desayunar o comer según el día.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'right' },
      },

      // 8. SUPLEMENTACIÓN ACTIVA
      {
        target: '#widget-suplementacion',
        title: 'Tu Pauta de Suplementos 💊',
        content: 'Accede a tus suplementos pautados, consulta sus dosis y marca tus tomas diarias conforme las vayas realizando.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'right' },
      },

      // 9. ESTRATEGIA DEL DÍA
      {
        target: '#widget-estrategia',
        title: 'Estrategia Nutricional del Día 🎯',
        content: 'Pautas nutricionales clave para días de partido, pre-partido, entreno intenso o recuperación.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'left' },
      },

      // 10. DIARIO DE COMIDAS (Subpestaña)
      {
        target: '#subtab-btn-diario',
        title: 'Tu Diario de Comidas 🥗',
        content: 'Vamos a tu diario personal donde puedes registrar todas tus tomas del día y revisar tu historial.',
        disableBeacon: true,
        data: { route: baseDiario, side: 'left' },
      },

      // 11. REGISTRAR COMIDA CON FOTO
      {
        target: '#btn-add-meal',
        title: 'Registrar Ingestas con Foto 📸',
        content: 'Pulsa "Registrar" para subir una foto de tu plato. El sistema detectará ingredientes y calorías para que tu nutricionista valide tu adherencia.',
        disableBeacon: true,
        data: { route: baseDiario, side: 'left' },
      },

      // 12. PESTAÑA NUTRICIÓN (Navegación)
      {
        target: nutricionNavTarget,
        title: 'Área de Nutrición 🥑',
        content: 'En la sección de Nutrición encontrarás tu plan detallado con cantidades exactas, suplementación, menús y protocolos de competición.',
        disableBeacon: true,
        data: { route: basePlan, side: 'right', placement: navPlacement },
      },

      // 13. FICHA NUTRICIONAL
      {
        target: '#subtab-btn-plan',
        title: 'Ficha y Plan Nutricional 📋',
        content: 'Aquí tienes tu ficha completa con objetivos de macros por tipo de día, distribución de comidas y pautas específicas.',
        disableBeacon: true,
        data: { route: basePlan, side: 'left' },
      },

      // 14. PROTOCOLOS DE COMPETICIÓN
      {
        target: '#subtab-btn-protocolos',
        title: 'Protocolos de Competición ⏱️',
        content: 'Sigue la línea temporal con qué tomar en el pre-partido (-3h, snack, cafeína), durante el descanso y en la ventana de recuperación.',
        disableBeacon: true,
        data: { route: baseProtocolos, side: 'left' },
      },

      // 15. PESTAÑA MÉTRICAS (Navegación)
      {
        target: metricasNavTarget,
        title: 'Área de Métricas 📊',
        content: 'Pasemos a tus métricas. Aquí podrás seguir la evolución de tus mediciones corporales, historial de peso y test de hidratación.',
        disableBeacon: true,
        data: { route: baseMediciones, side: 'right', placement: navPlacement },
      },

      // 16. EVOLUCIÓN DE PESAJES
      {
        target: '#subtab-btn-pesos',
        title: 'Gráfica de Pesajes ⚖️',
        content: 'Comprueba tu tendencia de peso con la gráfica interactiva y el control de variación respecto a tu peso de referencia.',
        disableBeacon: true,
        data: { route: basePesos, side: 'left' },
      },

      // 17. TEST DE HIDRATACIÓN
      {
        target: '#subtab-btn-hidratacion',
        title: 'Control de Hidratación 🧪',
        content: 'Revisa tus registros de osmolaridad salival y pruebas de sudoración para mantener un balance electrolítico óptimo.',
        disableBeacon: true,
        data: { route: baseHidratacion, side: 'left' },
      },

      // 18. CIERRE
      {
        target: 'body',
        placement: 'center',
        title: '¡Todo listo para rendir al máximo! 🚀',
        content: '¡Ya conoces tu portal al completo! Nutra estará siempre contigo para acompañarte en tu nutrición y alcanzar tu mejor versión deportiva.',
        disableBeacon: true,
        data: { route: basePerfil, side: 'right' },
      },
    ];
  }, [jugadorId, isDesktop]);

  const isTargetReady = useCallback((step) => {
    if (!step) return false;
    if (step.target === 'body') return true;
    const el = document.querySelector(step.target);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }, []);

  const goToStep = useCallback(
    (nextStepIndex) => {
      const nextStep = steps[nextStepIndex];

      if (!nextStep) {
        setRun(false);
        return;
      }

      const nextRoute = nextStep.data?.route;

      if (nextRoute && pathname !== nextRoute) {
        setRun(false);
        setPendingStepIndex(nextStepIndex);
        router.replace(nextRoute, { scroll: false });
        return;
      }

      setStepIndex(nextStepIndex);
    },
    [pathname, router, steps]
  );

  useEffect(() => {
    if (pendingStepIndex === null) return undefined;

    const nextStep = steps[pendingStepIndex];
    const nextRoute = nextStep?.data?.route;
    if (nextRoute && pathname !== nextRoute) return undefined;

    let attempts = 0;
    let timeoutId;

    const showWhenReady = () => {
      attempts += 1;

      if (isTargetReady(nextStep) || attempts >= 30) {
        setStepIndex(pendingStepIndex);
        setPendingStepIndex(null);
        setRun(true);
        return;
      }

      timeoutId = window.setTimeout(showWhenReady, 100);
    };

    timeoutId = window.setTimeout(showWhenReady, 60);

    return () => window.clearTimeout(timeoutId);
  }, [isTargetReady, pathname, pendingStepIndex, steps]);

  const handleCallback = (data) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      goToStep(nextStepIndex);
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem(TUTORIAL_KEY, 'true');
    }
  };

  const TooltipComponent = (props) => (
    <MascotTutorialBubble
      {...props}
      onClose={handleClose}
      onFinish={handleFinish}
    />
  );

  if (!mounted || !jugadorId || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      disableOverlayClose={true}
      tooltipComponent={TooltipComponent}
      callback={handleCallback}
      scrollOffset={90}
      spotlightPadding={8}
      floaterProps={{
        hideArrow: true,
        offset: 0,
        styles: {
          arrow: {
            display: 'none',
          },
          floater: {
            filter: 'none',
          },
        },
      }}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.65)',
        },
        spotlight: {
          borderRadius: 16,
        },
      }}
    />
  );
}
