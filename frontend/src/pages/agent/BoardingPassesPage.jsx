import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Pagination from '../../components/Pagination';
import BaggageTagPDF from '../../pdf/BaggageTagPDF';
import BoardingPassPDF from '../../pdf/BoardingPassPDF';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';

const BoardingPassesPage = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/agent/boarding-passes`)
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('Ошибка загрузки талонов'));
  }, []);

  const ft = filter.toLowerCase();
  const filtered = data.filter(b => (b.passenger_fullname?.toLowerCase() || '').includes(ft));
  const totalPages = Math.ceil(filtered.length / ITEMS);
  const current = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Выданные посадочные талоны</h2>
      <input
        type="text"
        placeholder="Поиск по ФИО пассажира..."
        value={filter}
        onChange={e => { setFilter(e.target.value); setPage(1); }}
        className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 mb-4"
      />
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[820px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">№ талона</th>
            <th className="text-left p-3">Пассажир</th>
            <th className="text-left p-3">Рейс</th>
            <th className="text-left p-3">Выход</th>
            <th className="text-left p-3">Место</th>
            <th className="text-left p-3">Время</th>
            <th className="text-left p-3">Багаж</th>
            <th className="text-left p-3">Скачать</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const bp = current[i];
            if (bp) return (
              <tr key={bp.boarding_pass_id} className="hover:bg-slate-50" style={{ height: 53 }}>
                <td className="p-3 font-mono font-bold text-blue-600">{bp.boarding_pass_number}</td>
                <td className="p-3 font-bold text-slate-700">{bp.passenger_fullname}</td>
                <td className="p-3">{bp.flight_number}</td>
                <td className="p-3">{bp.gate_number}</td>
                <td className="p-3">{bp.seat_number}</td>
                <td className="p-3 text-slate-500">{new Date(bp.boarding_time).toLocaleString()}</td>
                <td className="p-3">
                  {bp.baggage_pieces > 0 ? (
                    <PDFDownloadLink
                      document={<BaggageTagPDF passengerName={bp.passenger_fullname} flightNumber={bp.flight_number}
                        destination={bp.destination_location} weight={bp.baggage_weight}
                        pieces={bp.baggage_pieces} tagNumber={bp.tag_numbers || `BAG-${bp.boarding_pass_id}`} />}
                      fileName={`baggage_${bp.boarding_pass_id}.pdf`}
                    >
                      {({ loading }) => (
                        <button className="text-blue-600 hover:underline text-sm font-semibold">
                          {loading ? '...' : `${bp.baggage_weight} кг · Бирка`}
                        </button>
                      )}
                    </PDFDownloadLink>
                  ) : <span className="text-slate-400 text-sm">—</span>}
                </td>
                <td className="p-3">
                  <PDFDownloadLink
                    document={<BoardingPassPDF
                      passengerName={bp.passenger_fullname}
                      flightNumber={bp.flight_number}
                      airline={bp.airline_name}
                      departure={bp.departure_location}
                      destination={bp.destination_location}
                      date={bp.departure_datetime}
                      gate={bp.gate_number}
                      seat={bp.seat_number}
                      boardingPassNumber={bp.boarding_pass_number}
                    />}
                    fileName={`boarding_pass_${bp.boarding_pass_number}.pdf`}
                  >
                    {({ loading }) => (
                      <button className="text-indigo-600 hover:underline text-sm font-semibold">
                        {loading ? '...' : '🎫 Талон'}
                      </button>
                    )}
                  </PDFDownloadLink>
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={8} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default BoardingPassesPage;
