import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import FieldHint from '../../components/FieldHint';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';
const EMPTY = { flight_number: '', departure_location: '', destination_location: '', departure_datetime: '', airline_id: '', plane_id: '' };

const AdminFlightsPage = () => {
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    fetch(`${API_URL}/admin/flights`).then(r => r.json()).then(setFlights).catch(() => toast.error('Ошибка загрузки рейсов'));
    fetch(`${API_URL}/admin/airlines-list`).then(r => r.json()).then(setAirlines);
    fetch(`${API_URL}/admin/planes-list`).then(r => r.json()).then(setPlanes);
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (f) => {
    setEditing(f);
    setForm({
      flight_number: f.flight_number,
      departure_location: f.departure_location,
      destination_location: f.destination_location,
      departure_datetime: f.departure_datetime?.split('T')[0] || '',
      airline_id: f.airline_id,
      plane_id: f.plane_id,
    });
    setModalOpen(true);
  };

  const validate = () => {
    if (!form.flight_number.trim()) return 'Введите номер рейса';
    if (form.flight_number.trim().length > 50) return 'Номер рейса не должен превышать 50 символов';
    if (!form.departure_location.trim()) return 'Введите аэропорт отправления';
    if (form.departure_location.trim().length > 100) return 'Аэропорт отправления не должен превышать 100 символов';
    if (!form.destination_location.trim()) return 'Введите аэропорт назначения';
    if (form.destination_location.trim().length > 100) return 'Аэропорт назначения не должен превышать 100 символов';
    if (!form.departure_datetime) return 'Выберите дату вылета';
    if (form.departure_datetime < new Date().toISOString().split('T')[0]) return 'Дата вылета не может быть в прошлом';
    if (!form.airline_id) return 'Выберите авиакомпанию';
    if (!form.plane_id) return 'Выберите самолёт';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const url = editing ? `${API_URL}/admin/flights/${editing.flight_id}` : `${API_URL}/admin/flights`;
    const method = editing ? 'PUT' : 'POST';
    const payload = { ...form, airline_id: Number(form.airline_id), plane_id: Number(form.plane_id) };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast.success(editing ? 'Рейс обновлён' : 'Рейс создан');
      setModalOpen(false);
      loadAll();
    } else {
      const err = await res.json();
      toast.error(err.detail || 'Ошибка');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить рейс?')) return;
    const res = await fetch(`${API_URL}/admin/flights/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Рейс удалён'); loadAll(); }
    else { const err = await res.json(); toast.error(err.detail || 'Ошибка удаления'); }
  };

  const ft = filter.toLowerCase();
  const filtered = flights.filter(f =>
    (f.flight_number?.toLowerCase() || '').includes(ft) ||
    (f.destination_location?.toLowerCase() || '').includes(ft) ||
    (f.airline_name?.toLowerCase() || '').includes(ft)
  );
  const totalPages = Math.ceil(filtered.length / ITEMS);
  const current = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Управление рейсами</h2>
        <button onClick={openCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700">+ Добавить рейс</button>
      </div>
      <input type="text" placeholder="Поиск по номеру, направлению или авиакомпании..."
        value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
        className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 mb-4" />
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[700px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">Рейс</th>
            <th className="text-left p-3">Авиакомпания</th>
            <th className="text-left p-3">Маршрут</th>
            <th className="text-left p-3">Самолёт</th>
            <th className="text-left p-3">Места (всего / своб.)</th>
            <th className="text-left p-3">Дата</th>
            <th className="text-right p-3">Действия</th>
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
                <td className="p-3 text-slate-500">{f.plane_type}</td>
                <td className="p-3">
                  <span className="text-slate-500">{f.capacity_int}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className={f.seats_available === 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{f.seats_available}</span>
                </td>
                <td className="p-3 text-slate-500">{f.departure_datetime?.split('T')[0]}</td>
                <td className="p-3 text-right space-x-3">
                  <button onClick={() => openEdit(f)} className="text-blue-600 hover:underline font-semibold text-sm">Изменить</button>
                  <button onClick={() => handleDelete(f.flight_id)} className="text-red-500 hover:underline font-semibold text-sm">Удалить</button>
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={7} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать рейс' : 'Новый рейс'}>
        <div className="space-y-4">
          {[
            { label: 'Номер рейса', key: 'flight_number', placeholder: 'SU100', max: 50 },
            { label: 'Откуда', key: 'departure_location', placeholder: 'Moscow (SVO)', max: 100 },
            { label: 'Куда', key: 'destination_location', placeholder: 'New York (JFK)', max: 100 },
          ].map(({ label, key, placeholder, max }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{label}</label>
              <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} maxLength={max} className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Дата вылета <FieldHint text="Нельзя выбрать дату в прошлом — только сегодня или позже" />
            </label>
            <input type="date" value={form.departure_datetime} onChange={e => setForm(p => ({ ...p, departure_datetime: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Авиакомпания</label>
            <select value={form.airline_id} onChange={e => setForm(p => ({ ...p, airline_id: e.target.value }))}
              className="w-full border p-3 rounded-lg outline-none bg-white">
              <option value="">Выберите авиакомпанию</option>
              {airlines.map(a => <option key={a.airline_id} value={a.airline_id}>{a.airline_name} ({a.airline_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Самолёт</label>
            <select value={form.plane_id} onChange={e => setForm(p => ({ ...p, plane_id: e.target.value }))}
              className="w-full border p-3 rounded-lg outline-none bg-white">
              <option value="">Выберите самолёт</option>
              {planes.map(p => <option key={p.plane_id} value={p.plane_id}>{p.plane_type} ({p.plane_capacity} мест)</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="text-slate-500 font-bold px-4">Отмена</button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold">Сохранить</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFlightsPage;
