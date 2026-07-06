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

export default function WeeklySquadReportDocument({ meta, players }) {
  const includeCover = players.length !== 1;

  return (
    <Document
      title={meta.title || 'Informe semanal'}
      author={meta.author || 'Nutralab'}
      subject="Informe nutricional semanal"
    >
      {includeCover ? <CoverPage meta={meta} playersCount={players.length} /> : null}
      {players.map((player) => (
        <PlanCardPage key={player.id} plan={player.plan} />
      ))}
    </Document>
  );
}
