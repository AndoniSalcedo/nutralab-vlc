'use client';

import { useState, useEffect, useRef } from 'react';
import { Skeleton } from 'boneyard-js/react';

// Import all bone data
import _teams_list from './teams-list.bones.json';
import _team_dashboard from './team-dashboard.bones.json';
import _team_supplementation from './team-supplementation.bones.json';
import _team_evolution from './team-evolution.bones.json';
import _team_menu from './team-menu.bones.json';
import _team_analytics from './team-analytics.bones.json';
import _team_config from './team-config.bones.json';
import _player_dashboard_resumen from './player-dashboard-resumen.bones.json';
import _player_dashboard_metricas from './player-dashboard-metricas.bones.json';
import _player_dashboard_nutricion from './player-dashboard-nutricion.bones.json';
import _diario_comidas from './diario-comidas.bones.json';
import _balance_nutricional from './balance-nutricional.bones.json';

const bonesMap = {
  'teams-list': _teams_list,
  'team-dashboard': _team_dashboard,
  'team-supplementation': _team_supplementation,
  'team-evolution': _team_evolution,
  'team-menu': _team_menu,
  'team-analytics': _team_analytics,
  'team-config': _team_config,
  'player-dashboard-resumen': _player_dashboard_resumen,
  'player-dashboard-metricas': _player_dashboard_metricas,
  'player-dashboard-nutricion': _player_dashboard_nutricion,
  'diario-comidas': _diario_comidas,
  'balance-nutricional': _balance_nutricional,
};

function normalizeBone(b) {
  if (Array.isArray(b)) {
    return { x: b[0], y: b[1], w: b[2], h: b[3], r: b[4], c: b[5] || undefined };
  }
  return b;
}

function resolveBreakpoint(bonesData, width) {
  if (!bonesData?.breakpoints) return null;
  const bps = Object.keys(bonesData.breakpoints).map(Number).sort((a, b) => a - b);
  if (bps.length === 0) return null;
  const match = [...bps].reverse().find(bp => width >= bp) ?? bps[0];
  return bonesData.breakpoints[match] ?? null;
}

/**
 * Skeleton renderer with two modes:
 *
 * 1. loading={true} (no children) — renders skeleton bones from JSON.
 *    Used in Next.js loading.jsx files.
 *
 * 2. loading={false} (with children) — renders children directly.
 *    Used as a wrapper in content components for boneyard build snapshots.
 */
export default function BoneyardSkeleton({ name, loading = true, minY = 0, children }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(1280);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth);
    }
  }, []);

  // When not loading, wrap children in the real boneyard Skeleton component
  // so that the boneyard build crawler can detect the DOM and snapshot the bones.
  if (!loading) {
    return (
      <Skeleton name={name} loading={false}>
        {children}
      </Skeleton>
    );
  }

  // Loading mode: render skeleton bones
  if (!name) return children || null;

  const bonesData = bonesMap[name];
  if (!bonesData) return children || null;

  const resolved = resolveBreakpoint(bonesData, width);
  if (!resolved || !resolved.bones) return children || null;

  const { bones, height: capturedHeight, width: capturedWidth } = resolved;
  let nonContainerBones = bones.map(normalizeBone).filter(b => !b.c);

  if (minY > 0) {
    nonContainerBones = nonContainerBones.filter(b => b.y >= minY);
  }

  if (nonContainerBones.length === 0) return children || null;

  const adjustedHeight = capturedHeight ? Math.max(0, capturedHeight - minY) : '100vh';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: adjustedHeight,
        overflow: 'hidden',
      }}
      aria-busy="true"
    >
      {nonContainerBones.map((b, i) => {
        const capturedPxW = (b.w / 100) * (capturedWidth || width);
        const isCircle = b.r === '50%' && Math.abs(capturedPxW - b.h) < 4;
        const adjustedTop = b.y - minY;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: adjustedTop,
              width: isCircle ? b.h : `${b.w}%`,
              height: b.h,
              borderRadius: typeof b.r === 'string' ? b.r : `${b.r}px`,
              backgroundColor: '#e8e8e8',
              animation: 'boneyard-pulse 1.8s ease-in-out infinite',
            }}
          />
        );
      })}
      <style>{`
        @keyframes boneyard-pulse {
          0%, 100% { background-color: #e8e8e8; }
          50% { background-color: #f5f5f5; }
        }
      `}</style>
    </div>
  );
}
