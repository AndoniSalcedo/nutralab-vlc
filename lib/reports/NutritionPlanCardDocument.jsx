import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { PLAN_DAY_TYPES, sanitizePlanData } from '@/lib/nutrition-plan-card';

const COLORS = {
  top: '#254d5c',
  bg: '#101229',
  panel: '#1d1f46',
  panelAlt: '#292b5c',
  text: '#ffffff',
  muted: '#aab0c8',
  teal: '#38c6b4',
  orange: '#ff8b52',
  purple: '#bd7df4',
  green: '#63d69b',
  line: '#ff785f',
  note: '#071e36',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: 'Helvetica',
    fontSize: 7,
    padding: 0,
  },
  topBand: {
    height: 52,
    backgroundColor: COLORS.top,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: {
    color: '#cad6df',
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 34,
    paddingTop: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  position: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 3,
  },
  rule: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.line,
    marginTop: 8,
    marginHorizontal: 22,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#161839',
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 6.5,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.orange,
  },
  sectionTitle: {
    textAlign: 'center',
    color: '#b9c7df',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginTop: 23,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 9,
  },
  macroBox: {
    flex: 1,
    backgroundColor: COLORS.panelAlt,
    borderRadius: 3,
    padding: 10,
    alignItems: 'center',
    minHeight: 78,
  },
  macroBoxMiddle: {
    backgroundColor: COLORS.panel,
  },
  macroLabel: {
    color: COLORS.teal,
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  macroKcal: {
    color: COLORS.orange,
    fontSize: 18,
    fontWeight: 700,
    marginTop: 4,
  },
  macroUnit: {
    color: COLORS.muted,
    fontSize: 6,
  },
  macroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginTop: 10,
  },
  macroStat: {
    alignItems: 'center',
  },
  macroStatValue: {
    fontSize: 8,
    fontWeight: 700,
  },
  macroStatLabel: {
    color: COLORS.muted,
    fontSize: 5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#333962',
    marginVertical: 10,
  },
  mealHeaders: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 5,
  },
  mealHeader: {
    flex: 1,
    backgroundColor: COLORS.top,
    color: COLORS.teal,
    textAlign: 'center',
    paddingVertical: 5,
    fontSize: 6,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  mealColumns: {
    flexDirection: 'row',
    gap: 9,
  },
  mealColumn: {
    flex: 1,
  },
  mealBox: {
    minHeight: 34,
    backgroundColor: COLORS.panel,
    padding: 5,
    marginBottom: 3,
  },
  mealName: {
    color: COLORS.orange,
    fontSize: 6.2,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealDetail: {
    color: COLORS.muted,
    fontSize: 5.8,
    lineHeight: 1.25,
  },
  notes: {
    backgroundColor: COLORS.note,
    marginTop: 11,
    padding: 9,
    textAlign: 'center',
    color: '#d8e9f8',
    fontSize: 6.2,
  },
  footer: {
    marginTop: 11,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 6.2,
  },
});

function formatNumber(value, suffix = '') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  return `${String(Math.round(n * 10) / 10).replace('.', ',')}${suffix}`;
}

function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  return String(Math.round(n).toLocaleString('es-ES'));
}

function truncate(value, max = 92) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function Metric({ label, value, color }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function MacroCard({ item, index }) {
  const isTraining = item?.key === 'entreno' || index === 2;
  const isMatch = item?.key === 'partido';

  return (
    <View style={[styles.macroBox, isTraining ? styles.macroBoxMiddle : null]}>
      <Text style={[styles.macroLabel, isMatch ? { color: COLORS.orange } : null]}>{item.kcalLabel}</Text>
      <Text style={styles.macroKcal}>{formatInt(item.kcal)}</Text>
      <Text style={styles.macroUnit}>kcal</Text>
      <View style={styles.macroStats}>
        <View style={styles.macroStat}>
          <Text style={[styles.macroStatValue, { color: COLORS.purple }]}>{formatInt(item.proteina)} g</Text>
          <Text style={styles.macroStatLabel}>Proteína</Text>
        </View>
        <View style={styles.macroStat}>
          <Text style={[styles.macroStatValue, { color: COLORS.teal }]}>{formatInt(item.hidratos)} g</Text>
          <Text style={styles.macroStatLabel}>Hidratos</Text>
        </View>
        <View style={styles.macroStat}>
          <Text style={[styles.macroStatValue, { color: COLORS.orange }]}>{formatInt(item.grasa)} g</Text>
          <Text style={styles.macroStatLabel}>Grasas</Text>
        </View>
      </View>
    </View>
  );
}

export default function NutritionPlanCardDocument({ data }) {
  const plan = sanitizePlanData(data);
  const notes = plan?.notas?.length ? plan.notas : [];

  return (
    <Document title={plan?.meta?.nombre || 'Ficha nutricional'} author="Nutralab" subject="Ficha nutricional">
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.topBand}>
          <Text style={styles.topText}>Valencia CF · Nutrición Deportiva · Temporada 2025/26</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{truncate(plan?.jugador?.nombre || 'Jugador', 28)}</Text>
          <Text style={styles.position}>{plan?.jugador?.posicion || 'Sin posición'}</Text>
          <View style={styles.rule} />

          <View style={styles.metrics}>
            <Metric label="Peso" value={formatNumber(plan?.metricas?.peso, ' kg')} color={COLORS.orange} />
            <Metric label="Grasa" value={formatNumber(plan?.metricas?.grasa, ' %')} />
            <Metric label="M. magra" value={formatNumber(plan?.metricas?.masaMagra, ' kg')} color={COLORS.green} />
            <Metric label="Objetivo" value={plan?.metricas?.pesoObjetivo ? `~${formatNumber(plan.metricas.pesoObjetivo, ' kg')}` : '-'} color={COLORS.teal} />
          </View>

          <Text style={styles.sectionTitle}>Distribución calórica por tipo de día</Text>
          <View style={styles.macroRow}>
            {PLAN_DAY_TYPES.map((dayType, index) => (
              <MacroCard key={dayType.key} item={plan.tiposDia[dayType.key]} index={index} />
            ))}
          </View>

          <View style={styles.separator} />

          <View style={styles.mealHeaders}>
            {PLAN_DAY_TYPES.map((dayType) => (
              <Text key={dayType.key} style={[styles.mealHeader, dayType.key === 'partido' ? { color: COLORS.orange } : null]}>
                {plan.tiposDia[dayType.key].label}
              </Text>
            ))}
          </View>
          <View style={styles.mealColumns}>
            {PLAN_DAY_TYPES.map((dayType) => (
              <View key={dayType.key} style={styles.mealColumn}>
                {plan.tiposDia[dayType.key].ingestas.map((meal, index) => (
                  <View key={`${dayType.key}-${meal.nombre}-${index}`} style={styles.mealBox}>
                    <Text style={styles.mealName}>{meal.nombre}</Text>
                    <Text style={styles.mealDetail}>{truncate(meal.detalle, 118)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {notes.length ? (
            <Text style={styles.notes}>{notes.map((note) => truncate(note, 70)).join('   ·   ')}</Text>
          ) : null}

          <Text style={styles.footer}>Carlos Ferrando · Valencia CF · @c.ferrando · Nutricionista Deportivo y Clínico</Text>
        </View>
      </Page>
    </Document>
  );
}
