import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const extractCode = (location) => {
  const match = (location || '').match(/\((\w+)\)/);
  return match ? match[1] : (location || '');
};

const extractCity = (location) => (location || '').replace(/\s*\(.*?\)/, '').trim();

const fmt = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const s = StyleSheet.create({
  page:       { padding: 20, fontFamily: 'Roboto', backgroundColor: '#fff' },
  topBar:     { backgroundColor: '#1e3a5f', borderRadius: 4, padding: '8 12', marginBottom: 12,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitle:   { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  topAirline: { color: '#93c5fd', fontSize: 9 },

  label:      { fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  value:      { fontSize: 11, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  valueLg:    { fontSize: 20, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 4 },
  valueSm:    { fontSize: 9, color: '#64748b', marginBottom: 8 },

  route:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#f8fafc', borderRadius: 4, padding: '10 12', marginBottom: 12 },
  routeCol:   { alignItems: 'center', flex: 1 },
  routeCode:  { fontSize: 26, fontWeight: 'bold', color: '#1e3a5f' },
  routeCity:  { fontSize: 8, color: '#64748b', textAlign: 'center' },
  arrow:      { fontSize: 18, color: '#cbd5e1', marginHorizontal: 6 },

  row2:       { flexDirection: 'row', gap: 12, marginBottom: 4 },
  col:        { flex: 1 },

  divider:    { borderBottom: '1 dashed #e2e8f0', marginVertical: 10 },
  dividerSolid: { borderBottom: '1 solid #e2e8f0', marginVertical: 8 },

  highlight:  { backgroundColor: '#eff6ff', borderRadius: 4, padding: '8 12',
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: 10 },
  hlLabel:    { fontSize: 7.5, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 3 },
  hlValue:    { fontSize: 24, fontWeight: 'bold', color: '#1e3a5f' },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
  bpNum:      { fontSize: 8, color: '#64748b', fontWeight: 'bold' },
});

const BoardingPassPDF = ({
  passengerName,
  flightNumber,
  airline,
  departure,
  destination,
  date,
  gate,
  seat,
  boardingPassNumber,
}) => (
  <Document>
    <Page size={[340, 480]} style={s.page}>

      {/* Шапка */}
      <View style={s.topBar}>
        <Text style={s.topTitle}>ПОСАДОЧНЫЙ ТАЛОН</Text>
        <Text style={s.topAirline}>{airline || '—'}</Text>
      </View>

      {/* Пассажир */}
      <Text style={s.label}>Пассажир</Text>
      <Text style={s.valueLg}>{(passengerName || '').toUpperCase()}</Text>

      {/* Маршрут */}
      <View style={s.route}>
        <View style={s.routeCol}>
          <Text style={s.routeCode}>{extractCode(departure)}</Text>
          <Text style={s.routeCity}>{extractCity(departure)}</Text>
        </View>
        <Text style={s.arrow}>→</Text>
        <View style={s.routeCol}>
          <Text style={s.routeCode}>{extractCode(destination)}</Text>
          <Text style={s.routeCity}>{extractCity(destination)}</Text>
        </View>
      </View>

      <View style={s.dividerSolid} />

      {/* Рейс и дата */}
      <View style={s.row2}>
        <View style={s.col}>
          <Text style={s.label}>Рейс</Text>
          <Text style={s.value}>{flightNumber}</Text>
        </View>
        <View style={s.col}>
          <Text style={s.label}>Дата</Text>
          <Text style={s.value}>{fmt(date)}</Text>
        </View>
      </View>

      {/* Выход и место — крупно */}
      <View style={s.highlight}>
        <View>
          <Text style={s.hlLabel}>Выход (Gate)</Text>
          <Text style={s.hlValue}>{gate || '—'}</Text>
        </View>
        <View>
          <Text style={s.hlLabel}>Место (Seat)</Text>
          <Text style={s.hlValue}>{seat || '—'}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Подвал */}
      <View style={s.footer}>
        <Text style={s.footerText}>АИС «Аэропорт» · Сохраните этот документ</Text>
        <Text style={s.bpNum}>Талон № {boardingPassNumber}</Text>
      </View>

    </Page>
  </Document>
);

export default BoardingPassPDF;
