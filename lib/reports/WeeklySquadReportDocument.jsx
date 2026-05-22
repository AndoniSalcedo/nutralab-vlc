import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { cunninghamPlan } from '@/lib/calculations';

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

function numberOrDash(value, suffix = '') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  return `${Math.round(n).toLocaleString('es-ES')}${suffix}`;
}

function decimalOrDash(value, suffix = '') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  return `${String(Math.round(n * 10) / 10).replace('.', ',')}${suffix}`;
}

function ageFromBirthDate(value) {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : null;
}

function playerTargets(player) {
  const weightKg = Number(player.peso_kg || 0);
  const calc = weightKg
    ? cunninghamPlan({
        weightKg,
        bodyFatPct: player.porcentaje_grasa ? Number(player.porcentaje_grasa) : null,
        leanMassKg: player.masa_magra_kg ? Number(player.masa_magra_kg) : null,
        activityFactor: Number(player.factor_actividad || 1.6),
      })
    : null;

  return {
    kcal: player.kcal_objetivo || calc?.kcal,
    cho: player.cho_objetivo_g || calc?.cho,
    protein: player.proteina_objetivo_g || calc?.protein,
    fat: player.grasa_objetivo_g || calc?.fat,
  };
}

function buildDayType(player, targets) {
  const preferences = player.gustos_preferencias ? ` Ajustar a preferencias: ${player.gustos_preferencias}.` : '';
  const avoid = [player.alergias && `Alergias: ${player.alergias}`, player.intolerancias && `Intolerancias: ${player.intolerancias}`, player.aversiones && `Aversiones: ${player.aversiones}`]
    .filter(Boolean)
    .join(' · ');

  return [
    `Desayuno: porridge o tostadas + fruta + fuente proteica.${preferences}`,
    `Post-entreno: whey 30 g + fruta o bebida con HC. Objetivo diario aprox.: ${numberOrDash(targets.cho, ' g')} HC.`,
    'Comida: arroz/pasta/patata + proteina magra + verdura + AOVE + fruta.',
    'Merienda: yogur de proteina o bocadillo sencillo + fruta + frutos secos.',
    'Cena: pescado/huevos/carne magra + hidrato segun carga + verdura cocida.',
    avoid ? `Evitar/ajustar: ${avoid}.` : 'Evitar novedades el dia de partido y mantener alimentos ya tolerados.',
  ];
}

function defaultHydration(player) {
  const peso = Number(player.peso_kg || 0);
  if (!peso) return ['Objetivo: hidratacion individual pendiente de peso actualizado.', 'Pre: 500 ml a -60 min. Durante: 150-200 ml cada 15 min. Post: reponer 1,5 L por kg perdido.'];
  return [
    `Objetivo: ${Math.round(peso * 40)} ml/dia (+500-750 ml en entreno).`,
    'Pre: 500 ml a -60 min. Durante: 150-200 ml cada 15 min.',
    `Post: 1,5 L por kg perdido en las 4-6 h posteriores.`,
  ];
}

function previewLines(value, fallback, limit = 4) {
  const lines = toLines(value);
  return (lines.length ? lines : fallback).slice(0, limit).map((line) => truncate(line, 132));
}

function truncate(value, max = 150) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
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
  const microcycle = toLines(meta.microcycle);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Microciclo comprimido</Text>
        {microcycle.map((line) => (
          <Text key={line} style={styles.lineItem}>{line}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reglas de la semana</Text>
        {rules.map((line) => (
          <Text key={line} style={styles.lineItem}>{line}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipamiento del buffet</Text>
        {buffet.map((line) => (
          <Text key={line} style={styles.paragraph}>{line}</Text>
        ))}
      </View>

      <Footer meta={meta} />
    </Page>
  );
}

function StatCard({ label, value, hint, last, color }) {
  return (
    <View style={[styles.statCard, last ? styles.statCardLast : null]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

function PlayerPage({ player, meta }) {
  const targets = playerTargets(player);
  const age = ageFromBirthDate(player.fecha_nacimiento);
  const microcycle = toLines(meta.microcycle).slice(0, 3).map((line) => truncate(line, 120));
  const dayType = buildDayType(player, targets).slice(0, 5).map((line) => truncate(line, 138));
  const hydration = previewLines(player.notas_hidratacion, defaultHydration(player), 3);
  const supplementation = previewLines(player.notas_suplementacion, ['Creatina 5 g/dia si esta pautada.', 'Omega-3 y vitamina D segun criterio individual.', 'Nada nuevo el dia de partido.'], 3);
  const protocols = previewLines(player.notas_protocolos, ['Comida principal -3/-4 h: alta en HC, baja en grasa y fibra.', 'Snack -90 min: platano, gel u opcion habitual.', 'Post +30 min: proteina + HC rapidos.'], 3);

  return (
    <Page size="A4" style={[styles.page, styles.pageAlt]} wrap={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.playerTitle}>{truncate(`${player.nombre || ''} ${player.apellidos || ''}`.trim() || 'Jugador', 34)}</Text>
          <Text style={styles.subtitle}>{player.posicion || 'Sin posicion'}</Text>
          <View style={styles.tags}>
            {age ? <Text style={styles.tag}>{age} anos</Text> : null}
            {player.posicion ? <Text style={styles.tag}>{player.posicion}</Text> : null}
          </View>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.rightStrong}>{meta.title || 'Informe semanal'}</Text>
          <Text>{decimalOrDash(player.peso_kg, ' kg')} · talla {decimalOrDash(player.altura_cm, ' cm')}</Text>
          <Text>% grasa {decimalOrDash(player.porcentaje_grasa, '%')} · 6 pliegues {decimalOrDash(player.suma_6_pliegues)}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard label="Kcal/dia" value={numberOrDash(targets.kcal)} hint={player.kcal_objetivo ? 'objetivo fijado' : 'estimado'} />
        <StatCard label="HC (g)" value={numberOrDash(targets.cho)} hint={player.peso_kg ? `≈ ${decimalOrDash(Number(targets.cho || 0) / Number(player.peso_kg), ' g/kg')}` : 'pendiente'} />
        <StatCard label="Proteina (g)" value={numberOrDash(targets.protein)} hint={player.peso_kg ? `≈ ${decimalOrDash(Number(targets.protein || 0) / Number(player.peso_kg), ' g/kg')}` : 'pendiente'} color={COLORS.orange} />
        <StatCard label="Grasas (g)" value={numberOrDash(targets.fat)} hint={player.peso_kg ? `≈ ${decimalOrDash(Number(targets.fat || 0) / Number(player.peso_kg), ' g/kg')}` : 'pendiente'} last />
      </View>

      <View style={styles.columns}>
        <View style={styles.col}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dia tipo</Text>
            {dayType.map((line) => (
              <Text key={line} style={styles.lineItem}>{line}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendario · claves de partido</Text>
            {microcycle.map((line) => (
              <View key={line} style={styles.matchCard}>
                <Text style={styles.matchTitle}>{truncate(line.split('.')[0], 32)}</Text>
                <Text>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.col, styles.colLast]}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hidratacion</Text>
            <View style={styles.box}>
              {hydration.map((line) => <Text key={line} style={styles.paragraph}>{line}</Text>)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suplementacion</Text>
            <View style={styles.box}>
              {supplementation.map((line) => <Text key={line} style={styles.paragraph}>{line}</Text>)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Protocolo individual</Text>
            <View style={styles.box}>
              {protocols.map((line) => <Text key={line} style={styles.paragraph}>{line}</Text>)}
            </View>
            <Text style={styles.warningBox}>No olvides: sueno 8 h, caseina nocturna si esta pautada y cero alcohol entre partidos.</Text>
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
        <PlayerPage key={player.id} player={player} meta={meta} />
      ))}
    </Document>
  );
}
