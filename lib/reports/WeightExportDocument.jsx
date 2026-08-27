import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const STATUS_COLORS = {
  verde: {
    bg: '#ecfdf5',
    text: '#15803d',
    dot: '#16a34a',
  },
  amarillo: {
    bg: '#fffbeb',
    text: '#b45309',
    dot: '#f59e0b',
  },
  rojo: {
    bg: '#fef2f2',
    text: '#b91c1c',
    dot: '#ef4444',
  },
  sin_registro: {
    bg: '#f8fafc',
    text: '#64748b',
    dot: '#94a3b8',
  },
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f97316',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerLeft: {
    maxWidth: 340,
  },
  brandTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ea580c',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#475569',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 7.5,
    color: '#64748b',
  },
  metricsPanel: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 0.75,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  metricCol: {
    flex: 1,
    paddingHorizontal: 12,
    borderRightWidth: 0.75,
    borderRightColor: '#e2e8f0',
  },
  metricColLast: {
    flex: 1,
    paddingHorizontal: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginRight: 5,
  },
  metricLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1,
  },
  metricSubValue: {
    fontSize: 9.5,
    color: '#64748b',
    marginLeft: 3,
    fontWeight: 'normal',
  },
  metricBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  metricCaption: {
    fontSize: 6.2,
    color: '#64748b',
  },
  distributionWrap: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    paddingTop: 1,
  },
  distributionBar: {
    height: 3.5,
    flexDirection: 'row',
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  distributionSeg: {
    height: '100%',
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 6.8,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  colIndex: { width: '5%' },
  colPlayer: { width: '33%' },
  colPos: { width: '14%' },
  colWeight: { width: '12%', textAlign: 'right' },
  colRef: { width: '12%', textAlign: 'right' },
  colDiff: { width: '11%', textAlign: 'right' },
  colStatus: { width: '13%', paddingLeft: 6 },

  playerName: {
    fontSize: 7.8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  playerPosition: {
    fontSize: 7,
    color: '#64748b',
  },
  weightText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  weightDimmed: {
    fontSize: 7.2,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  refText: {
    fontSize: 7.5,
    color: '#475569',
  },
  diffPositive: {
    fontSize: 7.8,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  diffNegative: {
    fontSize: 7.8,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  diffOptimal: {
    fontSize: 7.8,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
});

export default function WeightExportDocument({
  teamName = 'Plantilla',
  fechaFormatted = '',
  records = [],
  summary = {},
}) {
  const total = records.length;
  const optimoCount = summary.optimo ?? records.filter((r) => r.status === 'verde').length;
  const precaucionCount = summary.precaucion ?? records.filter((r) => r.status === 'amarillo').length;
  const alertaCount = summary.alerta ?? records.filter((r) => r.status === 'rojo').length;
  const conPesoCount = records.filter((r) => r.hasWeight).length;

  const optimoPct = conPesoCount > 0 ? Math.round((optimoCount / conPesoCount) * 100) : 0;
  const precaucionPct = conPesoCount > 0 ? Math.round((precaucionCount / conPesoCount) * 100) : 0;
  const alertaPct = conPesoCount > 0 ? Math.round((alertaCount / conPesoCount) * 100) : 0;

  const now = new Date();
  const printDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Document title={`Informe Pesajes - ${teamName} - ${fechaFormatted}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandTitle}>NUTRALAB · VALENCIA CF</Text>
            <Text style={styles.title}>Informe de Toma de Pesos</Text>
            <Text style={styles.subtitle}>
              Medición registrada el {fechaFormatted}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.teamName}>{teamName}</Text>
            <Text style={styles.metaText}>Generado: {printDate}</Text>
            <Text style={styles.metaText}>Jugadores evaluados: {conPesoCount} / {total}</Text>
          </View>
        </View>

        {/* Unified Executive Metrics Strip */}
        <View style={styles.metricsPanel}>
          <View style={styles.metricsGrid}>
            {/* Col 1: Total */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricDot, { backgroundColor: '#ea580c' }]} />
                <Text style={styles.metricLabel}>TOTAL PLANTILLA</Text>
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{conPesoCount}</Text>
                <Text style={styles.metricSubValue}>/ {total}</Text>
              </View>
              <Text style={styles.metricCaption}>
                {conPesoCount === total ? 'Todos evaluados' : `${total - conPesoCount} sin registrar`}
              </Text>
            </View>

            {/* Col 2: Zona Óptima */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricDot, { backgroundColor: '#16a34a' }]} />
                <Text style={styles.metricLabel}>ZONA ÓPTIMA</Text>
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: '#16a34a' }]}>{optimoCount}</Text>
                {conPesoCount > 0 && (
                  <Text style={[styles.metricBadge, { color: '#166534' }]}>
                    ({optimoPct}%)
                  </Text>
                )}
              </View>
              <Text style={styles.metricCaption}>Desviación ≤ ±0,75 kg</Text>
            </View>

            {/* Col 3: Precaución */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.metricLabel}>PRECAUCIÓN</Text>
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: '#d97706' }]}>{precaucionCount}</Text>
                {conPesoCount > 0 && (
                  <Text style={[styles.metricBadge, { color: '#92400e' }]}>
                    ({precaucionPct}%)
                  </Text>
                )}
              </View>
              <Text style={styles.metricCaption}>Desviación ±0,76 a ±1,50 kg</Text>
            </View>

            {/* Col 4: Alerta */}
            <View style={styles.metricColLast}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.metricLabel}>ALERTA</Text>
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: '#dc2626' }]}>{alertaCount}</Text>
                {conPesoCount > 0 && (
                  <Text style={[styles.metricBadge, { color: '#991b1b' }]}>
                    ({alertaPct}%)
                  </Text>
                )}
              </View>
              <Text style={styles.metricCaption}>Desviación &gt; ±1,50 kg</Text>
            </View>
          </View>

          {/* Slim distribution bar */}
          {conPesoCount > 0 && (
            <View style={styles.distributionWrap}>
              <View style={styles.distributionBar}>
                {optimoPct > 0 && (
                  <View style={[styles.distributionSeg, { width: `${optimoPct}%`, backgroundColor: '#16a34a' }]} />
                )}
                {precaucionPct > 0 && (
                  <View style={[styles.distributionSeg, { width: `${precaucionPct}%`, backgroundColor: '#f59e0b' }]} />
                )}
                {alertaPct > 0 && (
                  <View style={[styles.distributionSeg, { width: `${alertaPct}%`, backgroundColor: '#ef4444' }]} />
                )}
              </View>
            </View>
          )}
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colPlayer]}>Jugador</Text>
            <Text style={[styles.tableHeaderCell, styles.colPos]}>Posición</Text>
            <Text style={[styles.tableHeaderCell, styles.colWeight]}>Peso (kg)</Text>
            <Text style={[styles.tableHeaderCell, styles.colRef]}>Ref. Media</Text>
            <Text style={[styles.tableHeaderCell, styles.colDiff]}>Variación</Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Semáforo</Text>
          </View>

          {records.map((r, index) => {
            const isAlt = index % 2 === 1;
            const statusCfg = STATUS_COLORS[r.status] || STATUS_COLORS.sin_registro;
            const hasWeight = r.hasWeight;

            let diffStyle = styles.diffOptimal;
            if (r.status === 'amarillo') {
              diffStyle = r.diff > 0 ? styles.diffPositive : styles.diffNegative;
            } else if (r.status === 'rojo') {
              diffStyle = r.diff > 0 ? styles.diffPositive : styles.diffNegative;
            }

            const formattedDiff = r.diff !== null && r.diff !== undefined
              ? (r.diff > 0 ? `+${r.diff.toFixed(2)} kg` : `${r.diff.toFixed(2)} kg`)
              : '—';

            return (
              <View
                key={r.id || index}
                style={[styles.tableRow, isAlt && styles.tableRowAlt]}
                wrap={false}
              >
                <Text style={[styles.colIndex, { fontSize: 7, color: '#64748b' }]}>{index + 1}</Text>
                <View style={styles.colPlayer}>
                  <Text style={styles.playerName}>
                    {r.nombre} {r.apellidos || ''}
                  </Text>
                </View>
                <Text style={[styles.colPos, styles.playerPosition]}>
                  {r.posicion || '—'}
                </Text>
                <View style={styles.colWeight}>
                  {hasWeight ? (
                    <Text style={styles.weightText}>{r.peso ? `${r.peso} kg` : '—'}</Text>
                  ) : (
                    <Text style={styles.weightDimmed}>Sin registro</Text>
                  )}
                </View>
                <Text style={[styles.colRef, styles.refText]}>
                  {r.pesoReferencia ? `${r.pesoReferencia} kg` : '—'}
                </Text>
                <Text style={[styles.colDiff, hasWeight ? diffStyle : styles.weightDimmed]}>
                  {hasWeight ? formattedDiff : '—'}
                </Text>
                <View style={[styles.colStatus, styles.statusWrap]}>
                  <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                  <Text style={[styles.statusText, { color: statusCfg.text }]}>
                    {r.statusLabel || (hasWeight ? 'Registrado' : 'Sin registro')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Nutralab VLC · Departamento de Nutrición y Rendimiento</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
