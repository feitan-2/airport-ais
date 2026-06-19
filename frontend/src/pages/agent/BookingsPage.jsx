import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import EditableStatusCell from '../../components/EditableStatusCell';
import Pagination from '../../components/Pagination';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';

const BookingsPage = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/agent/bookings`)
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('Ошибка загрузки бронирований'));
  }, []);

  const extractError = (detail) => {
    if (!detail) return 'Неизвестная ошибка';
    const m = detail.match(/\) ([^\n]+)/);
    return m ? m[1] : detail;
  };

  const handleStatusSave = async (bookingId, newStatus) => {
    const res = await fetch(`${API_URL}/agent/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_status: newStatus }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error('Ошибка: ' + extractError(err.detail));
      throw new Error();
    }
    setData(prev => prev.map(b => b.booking_id === bookingId ? { ...b, booking_status: newStatus } : b));
  };

  const ft = filter.toLowerCase();
  const filtered = data.filter(b =>
    (b.passenger_fullname?.toLowerCase() || '').includes(ft) ||
    (b.flight_number?.toLowerCase() || '').includes(ft) ||
    (b.ticket_number?.toLowerCase() || '').includes(ft)
  );
  const totalPages = Math.ceil(filtered.length / ITEMS);
  const current = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Все бронирования</h2>
      <input
        type="text"
        placeholder="Поиск по ФИО, рейсу или билету..."
        value={filter}
        onChange={e => { setFilter(e.target.value); setPage(1); }}
        className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 mb-4"
      />
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">Пассажир</th>
            <th className="text-left p-3">Рейс</th>
            <th className="text-left p-3">Билет</th>
            <th className="text-left p-3">Статус</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const b = current[i];
            if (b) return (
              <tr key={b.booking_id} className="hover:bg-slate-50" style={{ height: 53 }}>
                <td className="p-3">{b.passenger_fullname}</td>
                <td className="p-3">{b.flight_number}</td>
                <td className="p-3">{b.ticket_number}</td>
                <td className="p-3"><EditableStatusCell booking={b} onSave={handleStatusSave} /></td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={4} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default BookingsPage;
