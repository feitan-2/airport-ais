import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../api';

const ControlPage = ({ controllerId }) => {
  const [inputId, setInputId] = useState('');
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!inputId) return;
    setLoading(true);
    setPass(null);
    try {
      const res = await fetch(`${API_URL}/control/scan/${inputId}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || 'Талон не найден');
      } else {
        setPass(await res.json());
      }
    } catch {
      toast.error('Ошибка связи с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(
        `${API_URL}/control/approve/${pass.boarding_pass_id}?controller_id=${controllerId}`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success('Прохождение контроля зафиксировано!');
        const fresh = await fetch(`${API_URL}/control/scan/${pass.boarding_pass_number}`);
        if (fresh.ok) setPass(await fresh.json());
        else setPass(prev => ({ ...prev, controller_id: controllerId }));
      } else {
        toast.error(data.detail || 'Ошибка');
      }
    } catch {
      toast.error('Ошибка связи с сервером');
    }
  };

  const isChecked = pass?.controller_id !== null && pass?.controller_id !== undefined;

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Контроль посадочных талонов</h2>

      <form onSubmit={handleScan} className="bg-white rounded-lg shadow border p-6 mb-6">
        <label className="block text-sm font-bold text-slate-600 mb-2">Номер посадочного талона</label>
        <p className="text-xs text-slate-400 mb-3">Введите 6-значный номер талона (напечатан на посадочном талоне пассажира)</p>
        <div className="flex gap-3">
          <input
            type="number"
            min="100000"
            max="999999"
            value={inputId}
            onChange={e => { if (e.target.value.length <= 6) setInputId(e.target.value); }}
            placeholder="Например: 204815"
            className="flex-1 border p-3 rounded-lg outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '...' : 'Найти'}
          </button>
        </div>
      </form>

      {pass && (
        <div className={`bg-white rounded-lg shadow border p-6 ${isChecked ? 'border-green-300' : 'border-blue-300'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800">Талон №{pass.boarding_pass_number}</h3>
            {isChecked ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">✓ Проверен</span>
            ) : (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">Ожидает проверки</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold">Пассажир</p>
              <p className="font-semibold">{pass.passenger_fullname}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold">Паспорт</p>
              <p className="font-semibold">{pass.passenger_passport}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold">Рейс</p>
              <p className="font-semibold text-blue-600">{pass.flight_number}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold">Направление</p>
              <p className="font-semibold">{pass.destination_location}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold">Место</p>
              <p className="font-semibold">{pass.seat_number}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold">Выход</p>
              <p className="font-semibold">{pass.gate_number}</p>
            </div>
          </div>

          {isChecked ? (
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
              Проверен: {pass.controller_fullname || 'контролёр'} — {pass.boarding_time ? new Date(pass.boarding_time).toLocaleString() : ''}
            </div>
          ) : (
            <button
              onClick={handleApprove}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 mt-2"
            >
              Подтвердить прохождение контроля
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPage;
