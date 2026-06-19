import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';

const s = StyleSheet.create({
  page:   { padding: 20, fontFamily: 'Roboto', backgroundColor: '#fff', textAlign: 'center' },
  header: { fontSize: 13, fontWeight: 'bold', borderBottom: '1 solid #333', paddingBottom: 8, marginBottom: 10 },
  label:  { fontSize: 9, color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  big:    { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  medium: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  row:    { fontSize: 11, marginBottom: 6 },
  tag:    { fontSize: 9, color: '#aaa', marginTop: 14, borderTop: '1 solid #eee', paddingTop: 8 },
});

const BaggageTagPDF = ({ passengerName, flightNumber, destination, weight, pieces, tagNumber }) => (
  <Document>
    <Page size={[200, 420]} style={s.page}>
      <Text style={s.header}>БАГАЖНАЯ БИРКА</Text>
      <Text style={s.label}>Рейс</Text>
      <Text style={s.big}>{flightNumber}</Text>
      <Text style={s.label}>Направление</Text>
      <Text style={s.medium}>{destination}</Text>
      <Text style={s.label}>Пассажир</Text>
      <Text style={s.row}>{passengerName}</Text>
      <Text style={s.row}>Вес: {weight} кг  •  Мест: {pieces}</Text>
      <Text style={s.tag}>{tagNumber}</Text>
    </Page>
  </Document>
);

export default BaggageTagPDF;
