import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const STATUS_COLORS = {
  red: {
    bg: '#fef2f2',
    text: '#b91c1c',
    dot: '#ef4444',
    border: '#fecaca',
    label: 'Alerta Crítica',
  },
  yellow: {
    bg: '#fffbeb',
    text: '#b45309',
    dot: '#f59e0b',
    border: '#fde68a',
    label: 'Atención',
  },
  green: {
    bg: '#ecfdf5',
    text: '#15803d',
    dot: '#16a34a',
    border: '#a7f3d0',
    label: 'En Objetivo',
  },
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f97316',
    paddingBottom: 8,
    marginBottom: 10,
  },
  headerLeft: {
    maxWidth: 500,
  },
  brandTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ea580c',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8.5,
    color: '#475569',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  teamBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 7,
    color: '#64748b',
  },

  // KPI Summary Strip
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 0.75,
    borderColor: '#e2e8f0',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  kpiCol: {
    flex: 1,
    paddingHorizontal: 8,
    borderRightWidth: 0.75,
    borderRightColor: '#e2e8f0',
  },
  kpiColLast: {
    flex: 1,
    paddingHorizontal: 8,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  kpiDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginRight: 4,
  },
  kpiLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1,
  },
  kpiSubtext: {
    fontSize: 6.8,
    color: '#64748b',
    marginLeft: 3,
  },

  // Active filters section
  filtersSection: {
    backgroundColor: '#fafaf9',
    borderRadius: 6,
    borderWidth: 0.75,
    borderColor: '#e7e5e4',
    padding: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  filtersTitle: {
    fontSize: 6.2,
    fontWeight: 'bold',
    color: '#78716c',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 0.75,
  },
  filterPillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  filterPillText: {
    fontSize: 6.8,
    fontWeight: 'bold',
  },
  filterPillCategory: {
    fontSize: 5.8,
    marginLeft: 3,
    color: '#64748b',
  },

  // Table
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4.5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  thCell: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },

  // Fixed Table Columns
  colIdx: {
    width: '3%',
    textAlign: 'center',
  },
  colPlayer: {
    width: '18%',
    paddingRight: 4,
  },
  colPosition: {
    width: '8%',
  },
  colStatus: {
    width: '8%',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playerName: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  playerPosition: {
    fontSize: 6.2,
    color: '#64748b',
  },

  statusDotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  statusDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotMini: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    marginRight: 2,
  },
  statusCountText: {
    fontSize: 6.5,
    fontWeight: 'bold',
  },

  // Dynamic Metric Cells
  metricCell: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: 2,
  },
  metricValueText: {
    fontSize: 7.2,
    textAlign: 'center',
  },
  metricDateText: {
    fontSize: 5.2,
    color: '#64748b',
    marginTop: 0.5,
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.2,
    color: '#94a3b8',
  },
});

function formatFilterDescription(filter) {
  const { label, operator, value, valueTo, unit } = filter;
  const unitStr = unit ? ` ${unit}` : '';

  if (operator === 'resto') {
    return `${label}: Resto de valores`;
  }
  if (operator === 'between') {
    return `${label}: Entre ${value} y ${valueTo}${unitStr}`;
  }
  return `${label} ${operator} ${value}${unitStr}`;
}

export default function EvolutionFiltersReportDocument({
  teamName = 'Plantilla',
  dateContext = '',
  season = '',
  activeFilters = [],
  columns = [],
  rows = [],
  summary = {},
}) {
  const totalPlayers = summary.totalPlayers || rows.length;
  const totalWithRed = summary.totalWithRed || 0;
  const totalWithYellow = summary.totalWithYellow || 0;
  const totalOptimal = summary.totalOptimal || 0;
  const totalFiltersCount = activeFilters.length;

  const now = new Date();
  const generatedFormatted = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  // Remaining width for metric columns
  // Fixed cols: idx (3%) + player (18%) + position (8%) + status (8%) = 37%
  // Metrics width = 63%
  const numMetricCols = Math.max(1, columns.length);
  const metricColWidthPercent = `${(63 / numMetricCols).toFixed(2)}%`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandTitle}>NUTRALAB · VALENCIA CF</Text>
            <Text style={styles.title}>INFORME DE CONDICIONES Y FILTROS BIOMÉTRICOS</Text>
            <Text style={styles.subtitle}>
              {teamName} · {dateContext} {season ? `· ${season}` : ''} {summary?.filterModeLabel ? `· ${summary.filterModeLabel}` : ''}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.teamBadge}>{teamName}</Text>
            <Text style={styles.metaText}>Generado: {generatedFormatted}</Text>
            <Text style={styles.metaText}>
              Muestra: {totalPlayers} {summary?.isFiltered ? `de ${summary.totalSquad || totalPlayers} jugadores (filtrados)` : 'jugadores'}
            </Text>
          </View>
        </View>

        {/* KPI Strip */}
        <View style={styles.kpiStrip}>
          <View style={styles.kpiCol}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiDot, { backgroundColor: '#64748b' }]} />
              <Text style={styles.kpiLabel}>JUGADORES</Text>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{totalPlayers}</Text>
              <Text style={styles.kpiSubtext}>evaluados</Text>
            </View>
          </View>

          <View style={styles.kpiCol}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiDot, { backgroundColor: STATUS_COLORS.red.dot }]} />
              <Text style={[styles.kpiLabel, { color: STATUS_COLORS.red.text }]}>ALERTAS CRÍTICAS</Text>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: STATUS_COLORS.red.text }]}>{totalWithRed}</Text>
              <Text style={styles.kpiSubtext}>jugadores (rojo)</Text>
            </View>
          </View>

          <View style={styles.kpiCol}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiDot, { backgroundColor: STATUS_COLORS.yellow.dot }]} />
              <Text style={[styles.kpiLabel, { color: STATUS_COLORS.yellow.text }]}>ATENCIÓN / AVISO</Text>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: STATUS_COLORS.yellow.text }]}>{totalWithYellow}</Text>
              <Text style={styles.kpiSubtext}>jugadores (amarillo)</Text>
            </View>
          </View>

          <View style={styles.kpiCol}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiDot, { backgroundColor: STATUS_COLORS.green.dot }]} />
              <Text style={[styles.kpiLabel, { color: STATUS_COLORS.green.text }]}>EN OBJETIVO</Text>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: STATUS_COLORS.green.text }]}>{totalOptimal}</Text>
              <Text style={styles.kpiSubtext}>óptimos (verde)</Text>
            </View>
          </View>

          <View style={styles.kpiColLast}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiDot, { backgroundColor: '#7c3aed' }]} />
              <Text style={styles.kpiLabel}>REGLAS APLICADAS</Text>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{totalFiltersCount}</Text>
              <Text style={styles.kpiSubtext}>filtros activos</Text>
            </View>
          </View>
        </View>

        {/* Active Filters Panel */}
        {activeFilters.length > 0 && (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>
              Reglas y semaforización configuradas ({activeFilters.length})
            </Text>
            <View style={styles.filtersGrid}>
              {activeFilters.map((filter, idx) => {
                const colorConfig = STATUS_COLORS[filter.color] || STATUS_COLORS.red;
                return (
                  <View
                    key={filter.id || idx}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: colorConfig.bg,
                        borderColor: colorConfig.border,
                      },
                    ]}
                  >
                    <View style={[styles.filterPillDot, { backgroundColor: colorConfig.dot }]} />
                    <Text style={[styles.filterPillText, { color: colorConfig.text }]}>
                      {formatFilterDescription(filter)}
                    </Text>
                    <Text style={styles.filterPillCategory}>
                      ({colorConfig.label})
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Data Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.thCell, styles.colIdx]}>#</Text>
            <Text style={[styles.thCell, styles.colPlayer]}>Jugador</Text>
            <Text style={[styles.thCell, styles.colPosition]}>Posición</Text>
            <Text style={[styles.thCell, styles.colStatus]}>Estado</Text>

            {columns.map((col, idx) => (
              <View
                key={`${col.key}_${idx}`}
                style={{
                  width: metricColWidthPercent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <Text style={[styles.thCell, { textAlign: 'center' }]}>
                  {col.label}
                </Text>
                {col.unit && (
                  <Text style={{ fontSize: 5.2, color: '#64748b', textAlign: 'center' }}>
                    ({col.unit})
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {rows.map((row, rowIdx) => {
            const isAlt = rowIdx % 2 === 1;

            return (
              <View
                key={row.id || rowIdx}
                style={[styles.tableRow, isAlt ? styles.tableRowAlt : null]}
                wrap={false}
              >
                <Text style={[styles.colIdx, { fontSize: 6.5, color: '#94a3b8' }]}>
                  {rowIdx + 1}
                </Text>

                <View style={styles.colPlayer}>
                  <Text style={styles.playerName}>{row.name}</Text>
                </View>

                <View style={styles.colPosition}>
                  <Text style={styles.playerPosition}>{row.posicion || '-'}</Text>
                </View>

                <View style={styles.colStatus}>
                  <View style={styles.statusDotGroup}>
                    {row.redAlerts > 0 && (
                      <View style={styles.statusDotItem}>
                        <View style={[styles.statusDotMini, { backgroundColor: STATUS_COLORS.red.dot }]} />
                        <Text style={[styles.statusCountText, { color: STATUS_COLORS.red.text }]}>
                          {row.redAlerts}
                        </Text>
                      </View>
                    )}
                    {row.yellowAlerts > 0 && (
                      <View style={styles.statusDotItem}>
                        <View style={[styles.statusDotMini, { backgroundColor: STATUS_COLORS.yellow.dot }]} />
                        <Text style={[styles.statusCountText, { color: STATUS_COLORS.yellow.text }]}>
                          {row.yellowAlerts}
                        </Text>
                      </View>
                    )}
                    {row.redAlerts === 0 && row.yellowAlerts === 0 && row.greenMatches > 0 && (
                      <View style={styles.statusDotItem}>
                        <View style={[styles.statusDotMini, { backgroundColor: STATUS_COLORS.green.dot }]} />
                        <Text style={[styles.statusCountText, { color: STATUS_COLORS.green.text }]}>
                          {row.greenMatches}
                        </Text>
                      </View>
                    )}
                    {row.redAlerts === 0 && row.yellowAlerts === 0 && row.greenMatches === 0 && (
                      <Text style={{ fontSize: 6.5, color: '#94a3b8' }}>-</Text>
                    )}
                  </View>
                </View>

                {/* Metric Cells */}
                {columns.map((col, cIdx) => {
                  const cell = row.cells?.[col.key] || { value: '-', color: null };
                  const colorConfig = cell.color ? STATUS_COLORS[cell.color] : null;

                  return (
                    <View
                      key={`${col.key}_${cIdx}`}
                      style={[
                        styles.metricCell,
                        {
                          width: metricColWidthPercent,
                          backgroundColor: colorConfig ? colorConfig.bg : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.metricValueText,
                          {
                            color: colorConfig ? colorConfig.text : '#1e293b',
                            fontWeight: colorConfig ? 'bold' : 'normal',
                          },
                        ]}
                      >
                        {cell.value}
                      </Text>
                      {cell.dateStr && (
                        <Text style={styles.metricDateText}>
                          {cell.dateStr}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>NUTRALAB · Valencia CF · Documento de control y seguimiento biométrico</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
