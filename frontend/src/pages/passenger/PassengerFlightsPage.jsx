import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';

const PassengerFlightsPage = ({ passengerId }) => {
  const [flights, setFlights] = useState([]);
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadFlights = (dest = destination, from = dateFrom, to = dateTo) => {
    const params = new URLSearchParams();
    if (dest) params.append('destination', dest);
    if (from) params.append('date_from', from);
    if (to) params.append('date_to', to);
    fetch(`${API_URL}/passenger/flights?${params}`)
      .then(r => r.json())
      .then(setFlights)
      .catch(() => toast.error('Ошибка загрузки рейсов'));
  };

  useEffect(() => { loadFlights(); }, []);

  const handleBook = async () => {
    const res = await fetch(`${API_URL}/passenger/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flight_id: selected.flight_id, passenger_id: passengerId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Бронирование создано! Билет: ${data.ticket_number}`);
      setModalOpen(false);
      loadFlights();
    } else {
      toast.error(data.detail || 'Ошибка бронирования');
    }
  };

  const totalPages = Math.ceil(flights.length / ITEMS);
  const current = flights.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Доступные рейсы</h2>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="Откуда или куда..." value={destination}
          onChange={e => setDestination(e.target.value)}
          className="border p-3 rounded-lg outline-none focus:border-blue-500 flex-1 min-w-40" />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border p-3 rounded-lg outline-none focus:border-blue-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border p-3 rounded-lg outline-none focus:border-blue-500" />
        <button onClick={() => { setPage(1); loadFlights(); }}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700">
          Найти
        </button>
        <button onClick={() => {
          setDestination(''); setDateFrom(''); setDateTo(''); setPage(1);
          loadFlights('', '', '');
        }} className="text-slate-500 px-4 hover:text-slate-800">
          Сбросить
        </button>
      </div>

      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[650px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">Рейс</th>
            <th className="text-left p-3">Авиакомпания</th>
            <th className="text-left p-3">Маршрут</th>
            <th className="text-left p-3">Дата</th>
            <th className="text-left p-3">Самолёт</th>
            <th className="text-left p-3">Мест свободно</th>
            <th className="text-right p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const f = current[i];
            if (f) return (
              <tr key={f.flight_id} className="hover:bg-slate-50" style={{ height: 53 }}>
                <td className="p-3 font-bold text-blue-600">{f.flight_number}</td>
                <td className="p-3">{f.airline_name}</td>
                <td className="p-3">{f.departure_location} → {f.destination_location}</td>
                <td className="p-3 text-slate-500">{f.departure_datetime?.split('T')[0]}</td>
                <td className="p-3">{f.plane_type}</td>
                <td className="p-3">
                  <span className={f.seats_available > 0 ? 'text-green-600 font-semibold' : 'text-red-500'}>
                    {f.seats_available > 0 ? f.seats_available : 'Нет мест'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => { setSelected(f); setModalOpen(true); }}
                    disabled={f.seats_available === 0}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold ${f.seats_available > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'invisible'}`}>
                    Забронировать
                  </button>
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={7} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Подтверждение бронирования">
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
              <p><span className="font-bold">Рейс:</span> {selected.flight_number}</p>
              <p><span className="font-bold">Маршрут:</span> {selected.departure_location} → {selected.destination_location}</p>
              <p><span className="font-bold">Дата:</span> {selected.departure_datetime?.split('T')[0]}</p>
              <p><span className="font-bold">Авиакомпания:</span> {selected.airline_name}</p>
              <p><span className="font-bold">Самолёт:</span> {selected.plane_type} (вместимость: {selected.plane_capacity})</p>
            </div>
            <p className="text-slate-600 text-sm">После подтверждения будет создано бронирование со статусом <span className="font-bold text-blue-600">Confirmed</span>.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="text-slate-500 font-bold px-4">Отмена</button>
              <button onClick={handleBook} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-200">
                Подтвердить бронирование
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PassengerFlightsPage;
