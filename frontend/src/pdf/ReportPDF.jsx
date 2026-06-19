import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Roboto', backgroundColor: '#ffffff' },
  header: { marginBottom: 20 },
  title: { fontSize: 18, color: '#1e3a8a', textAlign: 'center', marginBottom: 4 },
  date: { fontSize: 9, color: '#94a3b8', textAlign: 'center' },
  section: { fontSize: 12, marginTop: 18, marginBottom: 8, color: '#1e3a8a', fontWeight: 'bold' },
  table: { borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', borderBottomColor: '#e2e8f0', borderBottomWidth: 1, alignItems: 'center', minHeight: 28 },
  rowAlt: { backgroundColor: '#f8fafc' },
  headerRow: { backgroundColor: '#f1f5f9' },
  th: { padding: '6 8', fontSize: 9, fontWeight: 'bold', color: '#334155' },
  td: { padding: '6 8', fontSize: 9, color: '#475569' },
  col1: { flex: 1.2 },
  col2: { flex: 2 },
  col3: { flex: 1.8 },
  col4: { flex: 1 },
  col5: { flex: 1 },
  col6: { flex: 1 },
});

const fmt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' });

const TableHeader = () => (
  <View style={[styles.row, styles.headerRow]}>
    <Text style={[styles.th, styles.col1]}>Рейс</Text>
    <Text style={[styles.th, styles.col2]}>Направление</Text>
    <Text style={[styles.th, styles.col3]}>Авиакомпания</Text>
    <Text style={[styles.th, styles.col4]}>Вмест.</Text>
    <Text style={[styles.th, styles.col5]}>Зарег.</Text>
    <Text style={[styles.th, styles.col6]}>Загрузка</Text>
  </View>
);

const TableRow = ({ item, alt }) => (
  <View style={[styles.row, alt ? styles.rowAlt : {}]}>
    <Text style={[styles.td, styles.col1]}>{item.flight_number}</Text>
    <Text style={[styles.td, styles.col2]}>{item.destination_location}</Text>
    <Text style={[styles.td, styles.col3]}>{item.airline_name}</Text>
    <Text style={[styles.td, styles.col4]}>{item.capacity}</Text>
    <Text style={[styles.td, styles.col5]}>{item.registered}</Text>
    <Text style={[styles.td, styles.col6]}>{item.occupancy_percentage}%</Text>
  </View>
);

const ReportPDF = ({ data }) => {
  const top5 = [...data].slice(0, 5);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Отчёт о загрузке рейсов</Text>
          <Text style={styles.date}>Сформирован: {fmt.format(new Date())}</Text>
        </View>

        <Text style={styles.section}>Топ-5 загруженных рейсов</Text>
        <View style={styles.table}>
          <TableHeader />
          {top5.map((item, i) => <TableRow key={i} item={item} alt={i % 2 === 1} />)}
        </View>

        <Text style={styles.section}>Полный список рейсов</Text>
        <View style={styles.table}>
          <TableHeader />
          {data.map((item, i) => <TableRow key={i} item={item} alt={i % 2 === 1} />)}
        </View>
      </Page>
    </Document>
  );
};

export default ReportPDF;
