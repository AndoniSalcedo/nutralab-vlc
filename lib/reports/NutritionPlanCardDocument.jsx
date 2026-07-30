import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { sanitizePlanData } from '@/lib/nutrition-plan-card';
import { getTeamDayTypeColor, getTeamDayTypeLabel } from '@/lib/calculations';
import { formatNumberDecimal } from '@/lib/utils';

const COLORS = {
  top: '#10142f',
  bg: '#0a0d1e',
  panel: '#151932',
  panelAlt: '#1f2448',
  text: '#ffffff',
  muted: '#a5adcb',
  teal: '#1fb5a9',
  orange: '#ff7e40',
  purple: '#b86ff6',
  green: '#54d38a',
  blue: '#3b82f6',
  red: '#ef4444',
  line: '#2d335a',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: 'Helvetica',
    fontSize: 6.8,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.teal,
    paddingBottom: 6,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.orange,
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
    justifyContent: 'flex-end',
  },
  teamText: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.muted,
  },
  metaText: {
    fontSize: 6.5,
    color: COLORS.muted,
    marginTop: 2,
  },
  metricsBand: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderWidth: 0.5,
    borderColor: COLORS.line,
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 5.5,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  metricValue: {
    fontSize: 9.5,
    fontWeight: 700,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  column: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  dayBox: {
    backgroundColor: COLORS.panel,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: COLORS.line,
    padding: 6,
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
    paddingBottom: 3,
    marginBottom: 4,
  },
  dayName: {
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  dayBadge: {
    fontSize: 5.8,
    fontWeight: 700,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  macrosLine: {
    fontSize: 6.2,
    color: COLORS.muted,
    marginBottom: 4,
    fontWeight: 700,
  },
  mealsList: {
    flexDirection: 'column',
    gap: 2.5,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mealName: {
    fontWeight: 700,
    width: 60,
    color: COLORS.orange,
    fontSize: 6.2,
    textTransform: 'uppercase',
  },
  mealDetail: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 6.2,
    lineHeight: 1.15,
  },
  notesBox: {
    backgroundColor: '#0a1628',
    borderColor: '#1e3a8a',
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 6,
    flex: 1,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.teal,
    textTransform: 'uppercase',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 2,
  },
  noteItem: {
    fontSize: 6.2,
    color: '#dbeafe',
    lineHeight: 1.2,
    marginBottom: 3,
  },
  supplementsBox: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 6,
    flex: 1,
  },
  supplementsTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.orange,
    textTransform: 'uppercase',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
    paddingBottom: 2,
  },
  supplementRow: {
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 0.2,
    borderBottomColor: '#1f2937',
  },
  supplementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supplementName: {
    fontSize: 6.5,
    fontWeight: 700,
    color: COLORS.text,
  },
  supplementDose: {
    fontSize: 6.2,
    fontWeight: 700,
    color: COLORS.teal,
  },
  supplementMeta: {
    fontSize: 5.5,
    color: COLORS.muted,
    marginTop: 1,
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: COLORS.muted,
    fontSize: 6,
  },
});

function formatWeight(value) {
  return formatNumberDecimal(value, ' kg', 1);
}

function formatGrasa(value) {
  return formatNumberDecimal(value, ' %', 1);
}

function formatNumber(value, unit = '') {
  return formatNumberDecimal(value, unit, 0);
}

export function PlanCardPage({ plan, teamConfig }) {
  const notes = plan?.notas?.length ? plan.notas : [];
  const supplements = Array.isArray(plan?.suplementacion) ? plan.suplementacion : [];

  const leftDays = ['lunes', 'martes', 'miercoles', 'jueves'];
  const rightDays = ['viernes', 'sabado', 'domingo'];

  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{plan?.jugador?.nombre || 'Jugador'}</Text>
          <Text style={styles.subtitle}>{plan?.jugador?.posicion || 'Sin posición'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.teamText}>VALENCIA CF · NUTRICIÓN DEPORTIVA</Text>
          <Text style={styles.metaText}>{plan?.meta?.nombre || 'Plan de Nutrición'}</Text>
        </View>
      </View>

      <View style={styles.metricsBand}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Peso</Text>
          <Text style={[styles.metricValue, { color: COLORS.orange }]}>{formatWeight(plan?.metricas?.peso)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Grasa</Text>
          <Text style={styles.metricValue}>{formatGrasa(plan?.metricas?.grasa)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>% P. Muscular Lee&cols</Text>
          <Text style={[styles.metricValue, { color: COLORS.green }]}>{formatGrasa(plan?.metricas?.pesoMuscular)}</Text>
        </View>
      </View>

      <View style={styles.contentGrid}>
        <View style={styles.column}>
          {leftDays.map((dayKey) => {
            const dayData = plan.dias[dayKey];
            const color = COLORS[getTeamDayTypeColor(dayData.tipoDia, teamConfig)] || COLORS.green;
            const label = getTeamDayTypeLabel(dayData.tipoDia, teamConfig);
            return (
              <View key={dayKey} style={styles.dayBox}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{dayData.label}</Text>
                  <Text style={[styles.dayBadge, { backgroundColor: `${color}22`, color }]}>{label}</Text>
                </View>
                <Text style={styles.macrosLine}>
                  {formatNumber(dayData.kcal, ' kcal')} · P {formatNumber(dayData.proteina, 'g')} · HC {formatNumber(dayData.hidratos, 'g')} · G {formatNumber(dayData.grasa, 'g')}
                </Text>
                <View style={styles.mealsList}>
                  {dayData.ingestas.map((meal, index) => (
                    <View key={index} style={styles.mealRow}>
                      <Text style={styles.mealName}>{meal.nombre}</Text>
                      <Text style={styles.mealDetail}>{meal.detalle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.column}>
          {rightDays.map((dayKey) => {
            const dayData = plan.dias[dayKey];
            const color = COLORS[getTeamDayTypeColor(dayData.tipoDia, teamConfig)] || COLORS.green;
            const label = getTeamDayTypeLabel(dayData.tipoDia, teamConfig);
            return (
              <View key={dayKey} style={styles.dayBox}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{dayData.label}</Text>
                  <Text style={[styles.dayBadge, { backgroundColor: `${color}22`, color }]}>{label}</Text>
                </View>
                <Text style={styles.macrosLine}>
                  {formatNumber(dayData.kcal, ' kcal')} · P {formatNumber(dayData.proteina, 'g')} · HC {formatNumber(dayData.hidratos, 'g')} · G {formatNumber(dayData.grasa, 'g')}
                </Text>
                <View style={styles.mealsList}>
                  {dayData.ingestas.map((meal, index) => (
                    <View key={index} style={styles.mealRow}>
                      <Text style={styles.mealName}>{meal.nombre}</Text>
                      <Text style={styles.mealDetail}>{meal.detalle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {supplements.length > 0 && (
            <View style={styles.supplementsBox}>
              <Text style={styles.supplementsTitle}>Suplementación Pautada</Text>
              {supplements.map((supp, index) => (
                <View key={index} style={styles.supplementRow}>
                  <View style={styles.supplementHeader}>
                    <Text style={styles.supplementName}>{supp.nombre}</Text>
                    {supp.dosis ? <Text style={styles.supplementDose}>{supp.dosis}</Text> : null}
                  </View>
                  {supp.timing ? <Text style={styles.supplementMeta}>Momento: {supp.timing}</Text> : null}
                  {supp.notas ? <Text style={styles.supplementMeta}>{supp.notas}</Text> : null}
                </View>
              ))}
            </View>
          )}

          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Indicaciones de la semana</Text>
            {notes.map((note, index) => (
              <Text key={index} style={styles.noteItem}>• {note}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Carlos Ferrando · Valencia CF · Clínico y Deportivo</Text>
        <Text>Generado automáticamente por Nutralab</Text>
      </View>
    </Page>
  );
}

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

const coverStyles = StyleSheet.create({
  page: {
    backgroundColor: '#10142f',
    color: '#f7f8ff',
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 7.8,
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
  box: {
    backgroundColor: '#20284b',
    borderRadius: 7,
    padding: 7,
    marginBottom: 7,
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
});

function CoverPage({ meta, playerName }) {
  const microcycle = toLines(meta.microcycle).slice(0, 7);
  const rules = toLines(meta.rules);
  const buffet = toLines(meta.buffet);

  return (
    <Page size="A4" style={coverStyles.page}>
      <View style={coverStyles.header}>
        <View>
          <Text style={coverStyles.title}>{meta.title || 'Informe semanal'}</Text>
          <Text style={coverStyles.subtitle}>{meta.subtitle || `Plan nutricional · ${playerName}`}</Text>
        </View>
        <View style={coverStyles.rightHeader}>
          <Text style={coverStyles.rightStrong}>{meta.team || 'Valencia CF'}</Text>
          <Text>{meta.author || 'Nutralab'}</Text>
          <Text>{meta.handle || ''}</Text>
        </View>
      </View>

      <View style={coverStyles.columns}>
        <View style={coverStyles.col}>
          <View style={coverStyles.section}>
            <Text style={coverStyles.sectionTitle}>Calendario de la semana</Text>
            <View style={coverStyles.box}>
              {microcycle.map((line) => (
                <Text key={line} style={coverStyles.lineItem}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={coverStyles.section}>
            <Text style={coverStyles.sectionTitle}>Equipamiento del buffet</Text>
            <View style={coverStyles.box}>
              {buffet.map((line) => (
                <Text key={line} style={coverStyles.paragraph}>{line}</Text>
              ))}
            </View>
          </View>
        </View>
        <View style={[coverStyles.col, coverStyles.colLast]}>
          <View style={coverStyles.section}>
            <Text style={coverStyles.sectionTitle}>Reglas de la semana</Text>
            <View style={coverStyles.box}>
              {rules.map((line) => (
                <Text key={line} style={coverStyles.lineItem}>• {line}</Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={coverStyles.footer} fixed>
        <Text>{meta.author || 'Nutralab'} · {meta.team || 'Valencia CF'} · {meta.handle || ''}</Text>
        <Text>Documento generado {formatDate()}</Text>
      </View>
    </Page>
  );
}

export default function NutritionPlanCardDocument({ data, weeklyReportMeta, teamConfig }) {
  const plan = sanitizePlanData(data, teamConfig);
  if (!plan) return null;
  return (
    <Document title={plan.meta?.nombre || 'Ficha nutricional'} author="Nutralab" subject="Ficha nutricional">
      {weeklyReportMeta && (
        <CoverPage meta={weeklyReportMeta} playerName={plan.jugador?.nombre || 'Jugador'} />
      )}
      <PlanCardPage plan={plan} teamConfig={teamConfig} />
    </Document>
  );
}
