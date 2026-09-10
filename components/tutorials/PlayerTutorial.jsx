'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@mantine/hooks';
import MascotTutorialBubble from './MascotTutorialBubble';

const TUTORIAL_KEY = 'nutralab_vlc_player_tutorial_completed_v0';

// Espera activa para elementos que se montan tras navegación
const waitForElement = (selector, timeout = 4000) => {
  return new Promise((resolve) => {
    if (!selector || selector === 'body') {
      return resolve(null);
    }
    const immediate = document.querySelector(selector);
    if (immediate) return resolve(immediate);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el || Date.now() - startTime >= timeout) {
        clearInterval(interval);
        resolve(el || null);
      }
    }, 40);
  });
};

export default function PlayerTutorial({ jugador }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mounted, setMounted] = useState(false);
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const router = useRouter();

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
      setTourKey((k) => k + 1);
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

  // Creador de hook `before` asíncrono nativo para react-joyride 3.2
  const createStepBefore = useCallback(
    (targetRoute, targetSelector) => {
      return async () => {
        if (targetRoute) {
          const normalize = (r) => (r || '').replace(/\/+$/, '').toLowerCase();
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          if (normalize(currentPath) !== normalize(targetRoute)) {
            router.replace(targetRoute, { scroll: false });
          }
        }
        if (targetSelector && targetSelector !== 'body') {
          const el = await waitForElement(targetSelector, 4000);
          if (el) {
            try {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch {
              // Ignorar error de selector
            }
            await new Promise((r) => setTimeout(r, 120));
          }
        }
      };
    },
    [router]
  );

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

    const rawSteps = [
      // 1. BIENVENIDA
      {
        target: 'body',
        placement: 'center',
        title: '¡Hola! Soy Nutra 🥑',
        content: '¡Bienvenido a NutraLab! Voy a acompañarte en un tour rápido para enseñarte todo lo que tienes a tu alcance en tu panel de jugador.',
        data: { route: basePerfil, side: 'left' },
      },

      // 2. BALANCE NUTRICIONAL
      {
        target: '#widget-balance-nutricional',
        title: 'Balance Nutricional Diario ⚡',
        content: 'Aquí tienes tu objetivo de calorías y macronutrientes (proteínas, hidratos y grasas) calculado según tu tipo de día (entreno, descanso o partido).',
        data: { route: basePerfil, side: 'left' },
      },

      // 3. ESTADO FÍSICO Y PESO
      {
        target: '#widget-fisico',
        title: 'Estado Físico y Peso ⚖️',
        content: 'Consulta tu último peso registrado, porcentaje de grasa y el semáforo para comprobar si estás en tu rango óptimo de competición.',
        data: { route: basePerfil, side: 'right' },
      },

      // 4. SUDORACIÓN
      {
        target: '#widget-sudor',
        title: 'Control de Sudoración 💦',
        content: 'Monitoriza tu tasa de sudoración y concentración de sodio para ajustar tu reposición de sales en cada sesión y partido.',
        data: { route: basePerfil, side: 'right' },
      },

      // 5. MENSAJES DEL STAFF
      {
        target: '#widget-mensajes',
        title: 'Comunicaciones del Staff 📬',
        content: 'Recibe indicaciones, pautas personalizadas y avisos directos de tu nutricionista y cuerpo técnico.',
        data: { route: basePerfil, side: 'right' },
      },

      // 6. HIDRATACIÓN
      {
        target: '#widget-water',
        title: 'Registro de Hidratación 💧',
        content: '¡Mantén tus niveles al 100%! Puedes registrar tus tomas de agua con los botones rápidos o pulsando directamente en la botella interactiva.',
        data: { route: basePerfil, side: 'left' },
      },

      // 7. COMEDOR
      {
        target: '#widget-comedor',
        title: 'Menú del Comedor 🍽️',
        content: 'Revisa las opciones preparadas por el club en la Ciudad Deportiva para desayunar o comer según el día.',
        data: { route: basePerfil, side: 'right' },
      },

      // 8. SUPLEMENTACIÓN ACTIVA
      {
        target: '#widget-suplementacion',
        title: 'Tu Pauta de Suplementos 💊',
        content: 'Accede a tus suplementos pautados, consulta sus dosis y marca tus tomas diarias conforme las vayas realizando.',
        data: { route: basePerfil, side: 'right' },
      },

      // 9. ESTRATEGIA DEL DÍA
      {
        target: '#widget-estrategia',
        title: 'Estrategia Nutricional del Día 🎯',
        content: 'Pautas nutricionales clave para días de partido, pre-partido, entreno intenso o recuperación.',
        data: { route: basePerfil, side: 'left' },
      },

      // 10. DIARIO DE COMIDAS (Subpestaña)
      {
        target: '#subtab-btn-diario',
        title: 'Tu Diario de Comidas 🥗',
        content: 'Vamos a tu diario personal donde puedes registrar todas tus tomas del día y revisar tu historial.',
        data: { route: basePerfil, side: 'left' },
      },

      // 11. REGISTRAR COMIDA CON FOTO
      {
        target: '#btn-add-meal',
        title: 'Registrar Ingestas con Foto 📸',
        content: 'Pulsa "Registrar" para subir una foto de tu plato. El sistema detectará ingredientes y calorías para que tu nutricionista valide tu adherencia.',
        data: { route: baseDiario, side: 'left' },
      },

      // 12. PESTAÑA NUTRICIÓN (Navegación)
      {
        target: nutricionNavTarget,
        title: 'Área de Nutrición 🥑',
        content: 'En la sección de Nutrición encontrarás tu plan detallado con cantidades exactas, suplementación, menús y protocolos de competición.',
        data: { route: basePlan, side: 'right', placement: navPlacement },
      },

      // 13. FICHA NUTRICIONAL
      {
        target: '#subtab-btn-plan',
        title: 'Ficha y Plan Nutricional 📋',
        content: 'Aquí tienes tu ficha completa con objetivos de macros por tipo de día, distribución de comidas y pautas específicas.',
        data: { route: basePlan, side: 'left' },
      },

      // 14. PROTOCOLOS DE COMPETICIÓN
      {
        target: '#subtab-btn-protocolos',
        title: 'Protocolos de Competición ⏱️',
        content: 'Sigue la línea temporal con qué tomar en el pre-partido (-3h, snack, cafeína), durante el descanso y en la ventana de recuperación.',
        data: { route: baseProtocolos, side: 'left' },
      },

      // 15. PESTAÑA MÉTRICAS (Navegación)
      {
        target: metricasNavTarget,
        title: 'Área de Métricas 📊',
        content: 'Pasemos a tus métricas. Aquí podrás seguir la evolución de tus mediciones corporales, historial de peso y test de hidratación.',
        data: { route: baseMediciones, side: 'right', placement: navPlacement },
      },

      // 16. EVOLUCIÓN DE PESAJES
      {
        target: '#subtab-btn-pesos',
        title: 'Gráfica de Pesajes ⚖️',
        content: 'Comprueba tu tendencia de peso con la gráfica interactiva y el control de variación respecto a tu peso de referencia.',
        data: { route: basePesos, side: 'left' },
      },

      // 17. TEST DE HIDRATACIÓN
      {
        target: '#subtab-btn-hidratacion',
        title: 'Control de Hidratación 🧪',
        content: 'Revisa tus registros de osmolaridad salival y pruebas de sudoración para mantener un balance electrolítico óptimo.',
        data: { route: baseHidratacion, side: 'left' },
      },

      // 18. CIERRE
      {
        target: 'body',
        placement: 'center',
        title: '¡Todo listo para rendir al máximo! 🚀',
        content: '¡Ya conoces tu portal al completo! Nutra estará siempre contigo para acompañarte en tu nutrición y alcanzar tu mejor versión deportiva.',
        data: { route: basePerfil, side: 'right' },
      },
    ];

    return rawSteps.map((s) => ({
      ...s,
      disableBeacon: true,
      disableFocusTrap: true,
      skipScroll: true,
      before: createStepBefore(s.data?.route, s.target),
    }));
  }, [jugadorId, isDesktop, createStepBefore]);

  const handleCallback = (data) => {
    const { action, index, status, type } = data;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[PlayerTutorial] joyride callback:', { type, action, index, status });
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
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
      key={tourKey}
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep={false}
      showProgress
      showSkipButton
      disableOverlayClose={true}
      disableFocusTrap={true}
      tooltipComponent={TooltipComponent}
      callback={handleCallback}
      scrollOffset={90}
      spotlightPadding={8}
      spotlightRadius={16}
      options={{
        skipScroll: true,
        disableFocusTrap: true,
        spotlightRadius: 16,
      }}
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
      }}
    />
  );
}
