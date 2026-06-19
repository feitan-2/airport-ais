import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import BoardingPassPDF from '../../pdf/BoardingPassPDF';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';

const PassengerBookingsPage = ({ passengerId }) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/passenger/bookings?passenger_id=${passengerId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('Ошибка загрузки бронирований'));
  }, [passengerId]);

  const totalPages = Math.ceil(data.length / ITEMS);
  const current = data.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Мои бронирования</h2>
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[780px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">Рейс</th>
            <th className="text-left p-3">Маршрут</th>
            <th className="text-left p-3">Дата</th>
            <th className="text-left p-3">Авиакомпания</th>
            <th className="text-left p-3">Билет</th>
            <th className="text-left p-3">Статус</th>
            <th className="text-left p-3">Талон</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const b = current[i];
            if (b) return (
              <tr key={b.booking_id} className="hover:bg-slate-50" style={{ height: 53 }}>
                <td className="p-3 font-bold text-blue-600">{b.flight_number}</td>
                <td className="p-3">{b.departure_location} → {b.destination_location}</td>
                <td className="p-3 text-slate-500">{b.departure_datetime?.split('T')[0]}</td>
                <td className="p-3">{b.airline_name}</td>
                <td className="p-3 font-mono text-sm">{b.ticket_number}</td>
                <td className="p-3"><StatusBadge status={b.booking_status} /></td>
                <td className="p-3">
                  {b.booking_status === 'Checked-in' && b.boarding_pass_number ? (
                    <PDFDownloadLink
                      document={<BoardingPassPDF
                        passengerName={b.passenger_fullname}
                        flightNumber={b.flight_number}
                        airline={b.airline_name}
                        departure={b.departure_location}
                        destination={b.destination_location}
                        date={b.departure_datetime}
                        gate={b.gate_number}
                        seat={b.seat_number}
                        boardingPassNumber={b.boarding_pass_number}
                      />}
                      fileName={`boarding_pass_${b.boarding_pass_number}.pdf`}
                    >
                      {({ loading }) => (
                        <button className="text-indigo-600 hover:underline text-sm font-semibold">
                          {loading ? '...' : '🎫 Скачать'}
                        </button>
                      )}
                    </PDFDownloadLink>
                  ) : <span className="text-slate-300 text-sm">—</span>}
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={7} /></tr>;
          })}
        </tbody>
      </table></div>
      {data.length === 0 && (
        <div className="text-center text-slate-400 py-6">У вас нет бронирований</div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default PassengerBookingsPage;
