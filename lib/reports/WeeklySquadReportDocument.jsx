import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { PlanCardPage } from './NutritionPlanCardDocument';

const COLORS = {
  bg: '#10142f',
  bg2: '#111c35',
  panel: '#1b2140',
  panel2: '#20284b',
  text: '#f7f8ff',
  muted: '#a7adbf',
  teal: '#1fb5a9',
  yellow: '#f2cf63',
  orange: '#ff855d',
  line: '#2d365e',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 7.8,
  },
  pageAlt: {
    backgroundColor: COLORS.bg2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.teal,
    paddingBottom: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 31,
    fontWeight: 700,
    lineHeight: 1.02,
    maxWidth: 310,
  },
  playerTitle: {
    fontSize: 25,
    fontWeight: 700,
    lineHeight: 0.98,
    maxWidth: 330,
  },
  subtitle: {
    color: COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 8.5,
    fontWeight: 700,
    marginTop: 5,
  },
  rightHeader: {
    textAlign: 'right',
    color: COLORS.muted,
    paddingTop: 10,
    maxWidth: 205,
  },
  rightStrong: {
    color: COLORS.text,
    fontSize: 9.5,
    fontWeight: 700,
    marginBottom: 2,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 8.2,
    fontWeight: 700,
    marginBottom: 5,
  },
  paragraph: {
    lineHeight: 1.25,
    marginBottom: 3,
  },
  lineItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
    paddingBottom: 3,
    marginBottom: 3,
    lineHeight: 1.2,
  },
  highlight: {
    color: COLORS.yellow,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    left: 36,
    right: 36,
    bottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: COLORS.muted,
    fontSize: 6.7,
  },
  tags: {
    flexDirection: 'row',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#123f50',
    color: '#68e0d8',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 5,
    fontSize: 7,
    fontWeight: 700,
  },
  meta: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 3,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#31395c',
    borderRadius: 8,
    padding: 8,
    marginRight: 7,
    minHeight: 46,
  },
  statCardLast: {
    marginRight: 0,
  },
  statLabel: {
    color: COLORS.muted,
    textTransform: 'uppercase',
    fontSize: 6.8,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.yellow,
    fontSize: 16,
    fontWeight: 700,
  },
  statHint: {
    color: COLORS.muted,
    fontSize: 6.2,
    marginTop: 1,
  },
  columns: {
    flexDirection: 'row',
  },
  col: {
    flexGrow: 1,
    flexBasis: 0,
    marginRight: 10,
  },
  colLast: {
    marginRight: 0,
  },
  matchCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 7,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
    padding: 7,
    marginBottom: 6,
  },
  matchTitle: {
    color: COLORS.orange,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  box: {
    backgroundColor: COLORS.panel2,
    borderRadius: 7,
    padding: 7,
    marginBottom: 7,
  },
  warningBox: {
    borderWidth: 1,
    borderColor: '#8a4a48',
    borderRadius: 7,
    padding: 6,
    marginTop: 5,
    color: '#ffd7cb',
    fontWeight: 700,
    fontSize: 7,
  },
});

function toLines(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function Footer({ meta }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{meta.author || 'Nutralab'} · {meta.team || 'Plantilla'} · {meta.handle || ''}</Text>
      <Text>Documento generado {formatDate()}</Text>
    </View>
  );
}

function CoverPage({ meta, playersCount }) {
  const microcycle = toLines(meta.microcycle).slice(0, 7);
  const rules = toLines(meta.rules);
  const buffet = toLines(meta.buffet);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{meta.title || 'Informe semanal'}</Text>
          <Text style={styles.subtitle}>{meta.subtitle || `Plan nutricional · ${playersCount} jugadores`}</Text>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.rightStrong}>{meta.team || 'Plantilla'}</Text>
          <Text>{meta.author || 'Nutralab'}</Text>
          <Text>{meta.handle || ''}</Text>
        </View>
      </View>

      <View style={styles.columns}>
        <View style={styles.col}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendario de la semana</Text>
            <View style={styles.box}>
              {microcycle.map((line) => (
                <Text key={line} style={styles.lineItem}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipamiento del buffet</Text>
            <View style={styles.box}>
              {buffet.map((line) => (
                <Text key={line} style={styles.paragraph}>{line}</Text>
              ))}
            </View>
          </View>
        </View>
        <View style={[styles.col, styles.colLast]}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reglas de la semana</Text>
            <View style={styles.box}>
              {rules.map((line) => (
                <Text key={line} style={styles.lineItem}>• {line}</Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      <Footer meta={meta} />
    </Page>
  );
}

import { getTeamDayTypeColor, getTeamDayTypeLabel, getObjectiveLabel } from '@/lib/calculations';
import { formatNumberDecimal } from '@/lib/utils';

const detailStyles = StyleSheet.create({
  page: {
    backgroundColor: '#0a0d1e',
    color: '#ffffff',
    paddingHorizontal: 22,
    paddingVertical: 18,
    fontFamily: 'Helvetica',
    fontSize: 6.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1fb5a9',
    paddingBottom: 6,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  headerSubtitle: {
    color: '#1fb5a9',
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
    justifyContent: 'flex-end',
  },
  headerRightTeam: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#ff7e40',
  },
  headerRightMeta: {
    fontSize: 6,
    color: '#a5adcb',
    marginTop: 1,
  },
  profileBox: {
    backgroundColor: '#151932',
    borderColor: '#2d335a',
    borderWidth: 0.5,
    borderRadius: 5,
    padding: 6,
    marginBottom: 6,
  },
  profileTitle: {
    fontSize: 7.2,
    fontWeight: 700,
    color: '#1fb5a9',
    textTransform: 'uppercase',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2d335a',
    paddingBottom: 2,
  },
  profileGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  profileCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  labelValue: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  label: {
    fontSize: 6.2,
    color: '#a5adcb',
    width: 78,
    fontWeight: 700,
  },
  value: {
    flex: 1,
    fontSize: 6.2,
    color: '#ffffff',
  },
  daysContainer: {
    flexDirection: 'column',
    gap: 3.5,
    marginBottom: 5,
  },
  dayCard: {
    backgroundColor: '#151932',
    borderWidth: 0.5,
    borderColor: '#2d335a',
    borderRadius: 4,
    padding: 4.5,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#20284b',
    paddingBottom: 2,
  },
  dayName: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  dayTypeBadge: {
    fontSize: 5.5,
    fontWeight: 700,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dayMacros: {
    fontSize: 5.8,
    color: '#a5adcb',
    fontWeight: 700,
  },
  mealRow: {
    flexDirection: 'row',
    marginTop: 1,
  },
  mealLabel: {
    width: 65,
    fontSize: 5.8,
    fontWeight: 700,
    color: '#ff7e40',
    textTransform: 'uppercase',
  },
  mealText: {
    flex: 1,
    fontSize: 5.8,
    color: '#e2e8f0',
    lineHeight: 1.15,
  },
  notesBox: {
    backgroundColor: '#0a1628',
    borderColor: '#1e3a8a',
    borderWidth: 0.5,
    borderRadius: 4,
    padding: 5,
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 6.8,
    fontWeight: 700,
    color: '#1fb5a9',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 5.6,
    color: '#dbeafe',
    lineHeight: 1.15,
    marginBottom: 1,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 0.5,
    borderTopColor: '#2d335a',
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#a5adcb',
    fontSize: 5.6,
  },
});

export function PlayerDetailBreakdownPage({ player, plan, meta, teamConfig }) {
  const p = player || {};
  const metrics = plan?.metricas || {
    peso: p.peso_kg,
    grasa: p.porcentaje_grasa,
    masaMagra: p.masa_magra_kg,
    pesoMuscular: p.peso_muscular_pct,
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const notes = plan?.notas?.length ? plan.notas : [];

  const preMatchConfig = p.config_prepartido || plan?.meta?.preMatchConfig || {};
  const preMatchSummary = [];
  if (preMatchConfig.noche?.ingestas) {
    preMatchSummary.push(`Partido noche: ${preMatchConfig.noche.ingestas.join(', ')}`);
  }
  if (preMatchConfig.noche?.dia_anterior) {
    preMatchSummary.push(`24h previas: ${preMatchConfig.noche.dia_anterior}`);
  }

  return (
    <Page size="A4" style={detailStyles.page} wrap={false}>
      <View style={detailStyles.header}>
        <View>
          <Text style={detailStyles.headerTitle}>{p.nombre} {p.apellidos || ''}</Text>
          <Text style={detailStyles.headerSubtitle}>
            {p.posicion || 'Jugador'} · Ficha Descriptiva e Ingestas
          </Text>
        </View>
        <View style={detailStyles.headerRight}>
          <Text style={detailStyles.headerRightTeam}>{meta?.team || 'Valencia CF'}</Text>
          <Text style={detailStyles.headerRightMeta}>{plan?.meta?.nombre || meta?.title || 'Informe Semanal'}</Text>
        </View>
      </View>

      <View style={detailStyles.profileBox}>
        <Text style={detailStyles.profileTitle}>Perfil Clínico, Antropometría y Configuración</Text>
        <View style={detailStyles.profileGrid}>
          <View style={detailStyles.profileCol}>
            <View style={detailStyles.labelValue}>
              <Text style={detailStyles.label}>Antropometría:</Text>
              <Text style={detailStyles.value}>
                {metrics.peso ? `${metrics.peso} kg` : '-'} | Grasa: {metrics.grasa ? `${metrics.grasa}%` : '-'} | Masa magra: {metrics.masaMagra ? `${metrics.masaMagra} kg` : '-'}
              </Text>
            </View>
            <View style={detailStyles.labelValue}>
              <Text style={detailStyles.label}>Contexto clínico:</Text>
              <Text style={detailStyles.value}>{p.contexto_clinico || 'Sin particularidades'}</Text>
            </View>
            <View style={detailStyles.labelValue}>
              <Text style={detailStyles.label}>Intolerancias/Alergias:</Text>
              <Text style={[detailStyles.value, (p.intolerancias || p.alergias) ? { color: '#ff7e40', fontWeight: 700 } : {}]}>
                {[p.alergias ? `Alergias: ${p.alergias}` : null, p.intolerancias ? `Intolerancias: ${p.intolerancias}` : null].filter(Boolean).join(' | ') || 'Ninguna registrada'}
              </Text>
            </View>
          </View>
          <View style={detailStyles.profileCol}>
            <View style={detailStyles.labelValue}>
              <Text style={detailStyles.label}>Objetivo:</Text>
              <Text style={detailStyles.value}>{getObjectiveLabel(p.objetivo) || 'Rendimiento óptimo'}</Text>
            </View>
            <View style={detailStyles.labelValue}>
              <Text style={detailStyles.label}>Preferencias:</Text>
              <Text style={detailStyles.value}>{p.gustos_preferencias || 'No especificadas'}</Text>
            </View>
            <View style={detailStyles.labelValue}>
              <Text style={detailStyles.label}>Comidas pautadas:</Text>
              <Text style={detailStyles.value}>
                {p.num_comidas || 'Comida, Cena'}{p.postentreno ? ' (+ Post-entreno)' : ''}
                {preMatchSummary.length ? ` · Pre-partido: ${preMatchSummary.join(' | ')}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={detailStyles.daysContainer}>
        {daysOfWeek.map((dayKey) => {
          const dayData = plan?.dias?.[dayKey];
          if (!dayData) return null;
          const color = COLORS[getTeamDayTypeColor(dayData.tipoDia, teamConfig)] || COLORS.green;
          const label = getTeamDayTypeLabel(dayData.tipoDia, teamConfig);

          return (
            <View key={dayKey} style={detailStyles.dayCard}>
              <View style={detailStyles.dayHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={detailStyles.dayName}>{dayData.label}</Text>
                  <Text style={[detailStyles.dayTypeBadge, { backgroundColor: `${color}22`, color }]}>
                    {label}
                  </Text>
                </View>
                <Text style={detailStyles.dayMacros}>
                  {dayData.kcal ? `${dayData.kcal} kcal` : ''} · P {dayData.proteina || 0}g · HC {dayData.hidratos || 0}g · G {dayData.grasa || 0}g
                </Text>
              </View>
              <View style={{ flexDirection: 'column', gap: 1 }}>
                {dayData.ingestas.map((meal, idx) => (
                  <View key={idx} style={detailStyles.mealRow}>
                    <Text style={detailStyles.mealLabel}>{meal.nombre}:</Text>
                    <Text style={detailStyles.mealText}>{meal.detalle || '-'}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {notes.length > 0 && (
        <View style={detailStyles.notesBox}>
          <Text style={detailStyles.notesTitle}>Pautas Clínicas e Indicaciones Nutricionales</Text>
          {notes.map((note, idx) => (
            <Text key={idx} style={detailStyles.noteText}>• {note}</Text>
          ))}
        </View>
      )}

      <View style={detailStyles.footer}>
        <Text>Carlos Ferrando · Valencia CF · Documento de Validación de Ingestas</Text>
        <Text>Generado {formatDate()}</Text>
      </View>
    </Page>
  );
}

export default function WeeklySquadReportDocument({ meta, players, teamConfig, includeDetailPages = false }) {
  const includeCover = players.length !== 1;
  const showDetails = Boolean(includeDetailPages || meta?.includeDetailPages);

  return (
    <Document
      title={meta?.title || 'Informe semanal'}
      author={meta?.author || 'Nutralab'}
      subject="Informe nutricional semanal"
    >
      {includeCover ? <CoverPage meta={meta} playersCount={players.length} /> : null}
      {players.map((player) => (
        <React.Fragment key={player.id}>
          <PlanCardPage plan={player.plan} teamConfig={teamConfig} />
          {showDetails ? (
            <PlayerDetailBreakdownPage player={player} plan={player.plan} meta={meta} teamConfig={teamConfig} />
          ) : null}
        </React.Fragment>
      ))}
    </Document>
  );
}

