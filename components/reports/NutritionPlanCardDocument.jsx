import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { sanitizePlanData } from '@/lib/engine';
import { getTeamDayTypeColor, getTeamDayTypeLabel } from '@/config/nutrition-days';
import { buildPlanTokens } from '@/config/plan-themes';
import { formatInteger, formatNumberDecimal } from '@/lib/utils';

const LEFT_DAYS = ['lunes', 'martes', 'miercoles', 'jueves'];
const RIGHT_DAYS = ['viernes', 'sabado', 'domingo'];

function makeStyles(k) {
  const u = (n) => Math.round(n * k * 100) / 100;
  return StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: u(6.8),
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: u(26),
    paddingTop: u(18),
    paddingBottom: u(15),
  },
  heroClub: {
    fontSize: u(6.4),
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: u(7),
  },
  heroName: {
    fontSize: u(26),
    fontWeight: 700,
    lineHeight: 1,
  },
  heroPosition: {
    fontSize: u(8.5),
    marginTop: u(5),
    letterSpacing: 0.4,
  },
  heroRight: {
    alignItems: 'flex-end',
  },
  heroPlan: {
    fontSize: u(6.4),
    marginBottom: u(7),
  },
  tiles: {
    flexDirection: 'row',
    gap: u(5),
  },
  tile: {
    width: u(60),
    borderRadius: u(5),
    paddingVertical: u(5),
    paddingHorizontal: u(7),
  },
  tileLabel: {
    fontSize: u(5.3),
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: u(2),
  },
  tileValue: {
    fontSize: u(11.5),
    fontWeight: 700,
  },
  body: {
    flex: 1,
    paddingHorizontal: u(26),
    paddingTop: u(14),
    paddingBottom: u(10),
  },
  contentGrid: {
    flexDirection: 'row',
    gap: u(10),
    flex: 1,
  },
  column: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: u(7),
  },
  card: {
    borderRadius: u(7),
    borderWidth: 0.6,
    padding: u(8),
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: u(10.5),
    fontWeight: 700,
    marginRight: u(6),
  },
  pill: {
    borderRadius: u(8),
    paddingVertical: u(1.8),
    paddingHorizontal: u(6),
    fontSize: u(5.7),
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  kcal: {
    fontSize: u(11),
    fontWeight: 700,
  },
  kcalUnit: {
    fontSize: u(6),
    fontWeight: 400,
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: u(5),
    gap: u(11),
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroText: {
    fontSize: u(6.5),
  },
  meals: {
    marginTop: u(6),
    gap: u(2),
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: u(4),
    paddingVertical: u(3),
    paddingHorizontal: u(5),
  },
  mealName: {
    width: u(54),
    fontSize: u(5.9),
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: u(0.5),
  },
  mealDetail: {
    flex: 1,
    fontSize: u(6.6),
    lineHeight: 1.22,
  },
  panelTitle: {
    fontSize: u(6.8),
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingBottom: u(4),
    marginBottom: u(4),
    borderBottomWidth: 0.5,
  },
  itemRow: {
    paddingVertical: u(3),
    paddingHorizontal: u(5),
    borderRadius: u(4),
    marginBottom: u(2),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    flex: 1,
    fontSize: u(6.9),
    fontWeight: 700,
  },
  badge: {
    fontSize: u(5.8),
    fontWeight: 700,
    borderRadius: u(3),
    paddingHorizontal: u(4),
    paddingVertical: u(1),
    marginLeft: u(5),
  },
  itemTitleBlock: {
    fontSize: u(6.9),
    fontWeight: 700,
  },
  itemMeta: {
    fontSize: u(6),
    marginTop: u(1),
    lineHeight: 1.25,
  },
  subTitle: {
    fontSize: u(5.8),
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginTop: u(4),
    marginBottom: u(3),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkBox: {
    width: u(5),
    height: u(5),
    borderRadius: u(1.3),
    borderWidth: 0.8,
    marginRight: u(5),
    marginTop: u(1.2),
  },
  noteRow: {
    flexDirection: 'row',
    marginBottom: u(3),
  },
  noteDot: {
    width: u(2.8),
    height: u(2.8),
    borderRadius: u(2),
    marginRight: u(6),
    marginTop: u(2.7),
  },
  noteText: {
    flex: 1,
    fontSize: u(6.6),
    lineHeight: 1.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    paddingTop: u(5),
    marginTop: u(8),
    fontSize: u(5.8),
  },
  });
}

const styleCache = new Map();
function getStyles(k) {
  if (!styleCache.has(k)) styleCache.set(k, makeStyles(k));
  return styleCache.get(k);
}

function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    Number.isNaN(d.getTime()) ? new Date() : d
  );
}

/**
 * La ficha es una sola página A4. Si el contenido no cabe, react-pdf crea una segunda página,
 * así que se estima la altura necesaria y se reduce proporcionalmente tipografía y espacios
 * (factor `k`, mínimo 0.68) hasta que quepa.
 */
const A4_HEIGHT = 841.89;
const CHARS_PER_LINE = 58; // caracteres por línea del detalle de una comida con k = 1
const MIN_SCALE = 0.68;

function estimateHeight(plan, { supplements, protocols, notes }, k) {
  const cpl = CHARS_PER_LINE / k;
  const lines = (text, per = cpl * 1.2) => Math.max(1, Math.ceil(String(text || '').length / per));

  const day = (dayKey) => {
    const d = plan?.dias?.[dayKey];
    if (!d) return 0;
    const meals = (d.ingestas || []).reduce((n, m) => n + lines(m.detalle, cpl) * 8.1 + 8, 0);
    return 46 + meals;
  };
  const sum = (keys) => keys.reduce((n, key) => n + day(key), 0) + (keys.length - 1) * 7;

  const suppH = supplements.length
    ? 28 + supplements.reduce((n, x) => n + 15 + (x.timing ? 8 : 0) + (x.notas ? 8 * lines(x.notas) : 0), 0)
    : 0;
  const protH = protocols.reduce(
    (n, pr) =>
      n + 28 +
      (pr.timeline || []).reduce((m, step) => m + 15 + (step.description ? 8 * lines(step.description) : 0), 0) +
      (pr.checklist?.length ? 14 + pr.checklist.reduce((m, c) => m + 15 + (c.description ? 8 * lines(c.description) : 0), 0) : 0),
    0
  );
  const notesH = notes.length ? 28 + notes.reduce((n, x) => n + 4 + 8.6 * lines(x), 0) : 0;

  const left = sum(['lunes', 'martes', 'miercoles', 'jueves']) + (suppH ? 7 + suppH : 0);
  const right = sum(['viernes', 'sabado', 'domingo']) + (protH ? 7 + protH : 0) + (notesH ? 7 + notesH : 0);
  return (Math.max(left, right) + 100 /* cabecera */ + 38 /* pie y márgenes */) * k;
}

function estimateScale(plan, content) {
  for (let k = 1; k > MIN_SCALE; k -= 0.02) {
    if (estimateHeight(plan, content, k) <= A4_HEIGHT) return Math.round(k * 100) / 100;
  }
  return MIN_SCALE;
}

function MacroItem({ label, value, t, st }) {
  return (
    <Text style={[st.macroText, { color: t.itemText }]}>
      {label} <Text style={{ color: t.cardBodyText, fontWeight: 700 }}>{formatInteger(value)} g</Text>
    </Text>
  );
}

function Day({ dayData, teamConfig, t, st }) {
  const colorName = getTeamDayTypeColor(dayData.tipoDia, teamConfig);
  const label = getTeamDayTypeLabel(dayData.tipoDia, teamConfig);
  return (
    <View style={[st.card, { backgroundColor: t.boxBg, borderColor: t.boxBorder }]}>
      <View style={st.dayHeader}>
        <View style={st.dayTitleGroup}>
          <Text style={[st.dayName, { color: t.cardBodyText }]}>{dayData.label}</Text>
          <Text style={[st.pill, { color: t.dayColor(colorName), backgroundColor: t.dayTint(colorName) }]}>{label}</Text>
        </View>
        <Text style={[st.kcal, { color: t.cardBodyText }]}>
          {formatInteger(dayData.kcal)} <Text style={[st.kcalUnit, { color: t.muted }]}>kcal</Text>
        </Text>
      </View>

      <View style={st.macroRow}>
        <MacroItem label="Proteína" value={dayData.proteina} t={t} st={st} />
        <MacroItem label="Hidratos" value={dayData.hidratos} t={t} st={st} />
        <MacroItem label="Grasa" value={dayData.grasa} t={t} st={st} />
      </View>

      <View style={st.meals}>
        {dayData.ingestas.map((meal, index) => (
          <View key={index} style={[st.mealRow, { backgroundColor: t.itemBg }]} wrap={false}>
            <Text style={[st.mealName, { color: t.accentText }]}>{meal.nombre}</Text>
            <Text style={[st.mealDetail, { color: t.itemText }]}>{meal.detalle || '—'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Panel({ title, t, st, children }) {
  return (
    <View style={[st.card, { backgroundColor: t.boxBg, borderColor: t.boxBorder }]}>
      <Text style={[st.panelTitle, { color: t.accentText, borderBottomColor: t.boxBorder }]}>{title}</Text>
      {children}
    </View>
  );
}

export function PlanCardPage({ plan, teamConfig }) {
  const t = buildPlanTokens(teamConfig?.planColors);
  const clubName = teamConfig?.nombre || 'Club';

  const notes = plan?.notas?.length ? plan.notas : [];
  const supplements = Array.isArray(plan?.suplementacion) ? plan.suplementacion : [];
  const protocols = Array.isArray(plan?.protocolos) ? plan.protocolos : [];
  const st = getStyles(estimateScale(plan, { supplements, protocols, notes }));

  const stats = [
    ['Peso', formatNumberDecimal(plan?.metricas?.peso, ' kg', 1)],
    ['Grasa', formatNumberDecimal(plan?.metricas?.grasa, ' %', 1)],
    ['Músculo', formatNumberDecimal(plan?.metricas?.pesoMuscular, ' %', 1)],
  ];

  return (
    <Page size="A4" style={[st.page, { backgroundColor: t.cardBodyBg, color: t.cardBodyText }]}>
      <View style={[st.hero, { backgroundColor: t.cardTopBg }]}>
        <View>
          <Text style={[st.heroClub, { color: t.topMuted }]}>{clubName} · Nutrición deportiva</Text>
          <Text style={[st.heroName, { color: t.cardTopText }]}>{plan?.jugador?.nombre || 'Jugador'}</Text>
          <Text style={[st.heroPosition, { color: t.topMuted }]}>{plan?.jugador?.posicion || 'Sin posición'}</Text>
        </View>
        <View style={st.heroRight}>
          <Text style={[st.heroPlan, { color: t.topMuted }]}>{plan?.meta?.nombre || 'Plan de nutrición'} · {formatDate(plan?.meta?.fecha)}</Text>
          <View style={st.tiles}>
            {stats.map(([label, value]) => (
              <View key={label} style={[st.tile, { backgroundColor: t.topTile }]}>
                <Text style={[st.tileLabel, { color: t.topMuted }]}>{label}</Text>
                <Text style={[st.tileValue, { color: t.cardTopText }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={st.body}>
        <View style={st.contentGrid}>
          <View style={st.column}>
            {LEFT_DAYS.map((dayKey) => (
              <Day key={dayKey} dayData={plan.dias[dayKey]} teamConfig={teamConfig} t={t} st={st} />
            ))}

            {supplements.length > 0 && (
              <Panel title="Suplementación pautada" t={t} st={st}>
                {supplements.map((supp, index) => (
                  <View key={index} style={[st.itemRow, { backgroundColor: t.itemBg }]} wrap={false}>
                    <View style={st.itemHeader}>
                      <Text style={[st.itemTitle, { color: t.cardBodyText }]}>{supp.nombre}</Text>
                      {supp.dosis ? <Text style={[st.badge, { color: t.accentText, backgroundColor: t.chipBg }]}>{supp.dosis}</Text> : null}
                    </View>
                    {supp.timing ? <Text style={[st.itemMeta, { color: t.itemText }]}>{supp.timing}</Text> : null}
                    {supp.notas ? <Text style={[st.itemMeta, { color: t.muted }]}>{supp.notas}</Text> : null}
                  </View>
                ))}
              </Panel>
            )}
          </View>

          <View style={st.column}>
            {RIGHT_DAYS.map((dayKey) => (
              <Day key={dayKey} dayData={plan.dias[dayKey]} teamConfig={teamConfig} t={t} st={st} />
            ))}

            {protocols.map((prot, pIdx) => (
              <Panel key={prot.id || pIdx} title={prot.name || 'Protocolo de partido'} t={t} st={st}>
                {prot.timeline?.map((step, sIdx) => (
                  <View key={step.id || sIdx} style={[st.itemRow, { backgroundColor: t.itemBg }]} wrap={false}>
                    <View style={st.itemHeader}>
                      <Text style={[st.itemTitle, { color: t.cardBodyText }]}>{step.title}</Text>
                      {step.timeLabel ? <Text style={[st.badge, { color: t.accentText, backgroundColor: t.chipBg }]}>{step.timeLabel}</Text> : null}
                    </View>
                    {step.description ? <Text style={[st.itemMeta, { color: t.itemText }]}>{step.description}</Text> : null}
                  </View>
                ))}
                {prot.checklist?.length > 0 && (
                  <View>
                    <Text style={[st.subTitle, { color: t.muted }]}>Checklist</Text>
                    {prot.checklist.map((item, cIdx) => (
                      <View key={item.id || cIdx} style={[st.itemRow, st.checkRow, { backgroundColor: t.itemBg }]} wrap={false}>
                        <View style={[st.checkBox, { borderColor: t.accentText }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[st.itemTitleBlock, { color: t.cardBodyText }]}>{item.title}</Text>
                          {item.description ? <Text style={[st.itemMeta, { color: t.itemText }]}>{item.description}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Panel>
            ))}

            {notes.length > 0 && (
              <Panel title="Indicaciones de la semana" t={t} st={st}>
                {notes.map((note, index) => (
                  <View key={index} style={st.noteRow}>
                    <View style={[st.noteDot, { backgroundColor: t.accentText }]} />
                    <Text style={[st.noteText, { color: t.itemText }]}>{note}</Text>
                  </View>
                ))}
              </Panel>
            )}
          </View>
        </View>

        <View style={[st.footer, { borderTopColor: t.boxBorder }]}>
          <Text style={{ color: t.muted }}>{clubName} · Nutrición deportiva y rendimiento</Text>
        </View>
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

const coverStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 9,
    fontSize: 6.8,
  },
  body: {
    paddingHorizontal: 32,
    paddingTop: 26,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 12,
    marginBottom: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.05,
    maxWidth: 340,
  },
  subtitle: {
    fontSize: 9.5,
    marginTop: 7,
  },
  rightHeader: {
    textAlign: 'right',
    maxWidth: 200,
    lineHeight: 1.4,
  },
  rightStrong: {
    fontSize: 10,
    fontWeight: 700,
  },
  columns: {
    flexDirection: 'row',
    gap: 24,
  },
  col: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
  },
  line: {
    paddingVertical: 4.5,
    borderBottomWidth: 0.4,
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 22,
    borderTopWidth: 0.5,
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
  },
});

function CoverSection({ title, lines, bullet, t }) {
  return (
    <View style={coverStyles.section}>
      <Text style={[coverStyles.sectionTitle, { color: t.accentText, borderBottomColor: t.cardBodyText }]}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={[coverStyles.line, { color: t.itemText, borderBottomColor: t.boxBorder }]}>
          {bullet ? '–  ' : ''}{line}
        </Text>
      ))}
    </View>
  );
}

function CoverPage({ meta, playerName, teamConfig }) {
  const t = buildPlanTokens(teamConfig?.planColors);

  return (
    <Page size="A4" style={[coverStyles.page, { backgroundColor: t.cardBodyBg, color: t.cardBodyText }]}>
      <View style={[coverStyles.topBar, { backgroundColor: t.cardTopBg, color: t.cardTopText }]}>
        <Text>{meta.team || teamConfig?.nombre || ''} · Nutrición deportiva</Text>
        <Text>{formatDate()}</Text>
      </View>

      <View style={coverStyles.body}>
        <View style={[coverStyles.header, { borderBottomColor: t.cardBodyText }]}>
          <View>
            <Text style={[coverStyles.title, { color: t.cardBodyText }]}>{meta.title || 'Informe semanal'}</Text>
            <Text style={[coverStyles.subtitle, { color: t.accentText }]}>{meta.subtitle || `Plan nutricional · ${playerName}`}</Text>
          </View>
          <View style={coverStyles.rightHeader}>
            <Text style={[coverStyles.rightStrong, { color: t.cardBodyText }]}>{meta.team || ''}</Text>
            <Text style={{ color: t.muted }}>{meta.author || 'Nutralab'}</Text>
            <Text style={{ color: t.muted }}>{meta.handle || ''}</Text>
          </View>
        </View>

        <View style={coverStyles.columns}>
          <View style={coverStyles.col}>
            <CoverSection title="Calendario de la semana" lines={toLines(meta.microcycle).slice(0, 7)} t={t} />
            <CoverSection title="Equipamiento del buffet" lines={toLines(meta.buffet)} t={t} />
          </View>
          <View style={coverStyles.col}>
            <CoverSection title="Reglas de la semana" lines={toLines(meta.rules)} bullet t={t} />
          </View>
        </View>
      </View>

      <View style={[coverStyles.footer, { borderTopColor: t.boxBorder }]} fixed>
        <Text style={{ color: t.muted }}>{meta.author || 'Nutralab'} · {meta.team || ''} · {meta.handle || ''}</Text>
        <Text style={{ color: t.muted }}>Documento generado {formatDate()}</Text>
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
        <CoverPage meta={weeklyReportMeta} playerName={plan.jugador?.nombre || 'Jugador'} teamConfig={teamConfig} />
      )}
      <PlanCardPage plan={plan} teamConfig={teamConfig} />
    </Document>
  );
}
