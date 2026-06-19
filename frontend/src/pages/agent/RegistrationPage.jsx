import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PDFDownloadLink, Font } from '@react-pdf/renderer';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import FieldHint from '../../components/FieldHint';
import BaggageTagPDF from '../../pdf/BaggageTagPDF';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';

const RegistrationPage = ({ agentId }) => {
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [gates, setGates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [baggageTag, setBaggageTag] = useState(null);

  useEffect(() => {
    Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' });
    loadQueue();
  }, []);

  const loadQueue = () => {
    fetch(`${API_URL}/agent/queue`)
      .then(r => r.json())
      .then(setQueue)
      .catch(() => toast.error('Ошибка загрузки очереди'));
  };

  const openModal = (passenger) => {
    setSelected(passenger);
    setGates(passenger.available_gates || []);
    setBaggageTag(null);
    setModalOpen(true);
  };

  const extractError = (detail) => {
    if (!detail) return 'Неизвестная ошибка';
    const m = detail.match(/\) ([^\n]+)/);
    return m ? m[1] : detail;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const seat = fd.get('seat').toUpperCase();
    const gate = fd.get('gate');
    const bags = parseInt(fd.get('bags')) || 0;
    const weight = parseFloat(fd.get('weight')) || 0;

    if (!/^[1-9][0-9]?[A-F]$/.test(seat)) {
      toast.error('Неверный формат места. Пример: 12A (число 1–99 и буква A–F)');
      return;
    }
    if (bags < 0 || bags > 5) {
      toast.error('Количество мест багажа: от 0 до 5');
      return;
    }
    if (weight < 0) {
      toast.error('Вес багажа не может быть отрицательным');
      return;
    }
    if (bags > 0 && weight === 0) {
      toast.error('Укажите вес багажа');
      return;
    }
    if (weight > 0 && bags === 0) {
      toast.error('Укажите количество мест багажа');
      return;
    }
    if (bags > 0 && weight / bags > 32) {
      toast.error(`Превышен лимит: ${(weight / bags).toFixed(1)} кг на место. Максимум 32 кг на одно место (стандарт IATA)`);
      return;
    }

    const url = `${API_URL}/agent/register?booking_id=${selected.id}&seat=${seat}&gate=${gate}&agent_id=${agentId}&bags=${bags}&weight=${weight}`;
    const res = await fetch(url, { method: 'POST' });
    const resData = await res.json();

    if (res.ok) {
      if (bags > 0 && weight > 0) {
        setBaggageTag({
          passengerName: selected.name,
          flightNumber: selected.flight_number,
          destination: selected.destination_location,
          weight, pieces: bags,
          tagNumber: resData.tag_numbers?.[0] || `BAG-${selected.id}`,
        });
      } else {
        toast.success('Регистрация успешна!');
        setModalOpen(false);
        loadQueue();
      }
    } else {
      toast.error('Ошибка: ' + extractError(resData.detail));
    }
  };

  const ft = filter.toLowerCase();
  const filtered = queue.filter(b =>
    (b.name?.toLowerCase() || '').includes(ft) ||
    (b.ticket?.toLowerCase() || '').includes(ft) ||
    (b.passport?.toLowerCase() || '').includes(ft)
  );
  const totalPages = Math.ceil(filtered.length / ITEMS);
  const current = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Регистрация пассажиров</h2>
      <input
        type="text"
        placeholder="Поиск по ФИО, билету или паспорту..."
        value={filter}
        onChange={e => { setFilter(e.target.value); setPage(1); }}
        className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 mb-4"
      />

      {filtered.length === 0 && (
        <div className="bg-white rounded-lg shadow border p-10 text-center text-slate-500">
          Нет пассажиров, ожидающих регистрацию
        </div>
      )}

      <div className="grid gap-4">
        {current.map(b => (
          <div key={b.id} className="bg-white p-5 rounded-lg shadow border flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{b.name}</div>
              <div className="text-slate-500 text-sm">Паспорт: {b.passport}</div>
              <div className="text-slate-500 text-sm">Билет: {b.ticket}</div>
              <div className="text-blue-600 font-semibold text-sm mt-1">
                Рейс: {b.flight_number} → {b.destination_location}
              </div>
            </div>
            <button
              onClick={() => openModal(b)}
              className="bg-blue-600 text-white px-5 py-2 rounded-md font-bold hover:bg-blue-700"
            >
              Регистрация
            </button>
          </div>
        ))}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); loadQueue(); }} title={baggageTag ? 'Регистрация завершена' : 'Оформление посадки'}>
        {baggageTag ? (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-3">✓</div>
            <p className="text-slate-600 mb-4">Багаж: {baggageTag.pieces} мест, {baggageTag.weight} кг</p>
            <PDFDownloadLink document={<BaggageTagPDF {...baggageTag} />} fileName={`baggage_${baggageTag.tagNumber}.pdf`}>
              {({ loading }) => (
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold mb-3">
                  {loading ? 'Формирование...' : 'Скачать багажную бирку'}
                </button>
              )}
            </PDFDownloadLink>
            <button onClick={() => { setModalOpen(false); setBaggageTag(null); loadQueue(); }} className="w-full text-slate-500 font-bold py-2">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {selected && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-2">
                <span className="font-bold">{selected.name}</span> — {selected.flight_number} → {selected.destination_location}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Место <FieldHint text="Формат: число от 1 до 99 и буква от A до F. Например: 1A, 12C, 99F" />
              </label>
              <input name="seat" placeholder="Напр: 12A" required maxLength="3"
                className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Выход на посадку</label>
              <select name="gate" className="w-full border p-3 rounded-lg outline-none bg-white">
                {gates.map(g => <option key={g} value={g}>Выход {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Кол-во мест багажа <FieldHint text="От 0 до 5 мест. Стандарт: 1 место в эконом, до 2 в бизнес-классе. Дополнительные места оплачиваются отдельно" />
              </label>
              <input type="number" name="bags" min="0" max="5" defaultValue="0"
                className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Общий вес багажа (кг) <FieldHint text="Суммарный вес всех мест. Максимум 32 кг на одно место (стандарт IATA). Стандартный вес — 23 кг на место" />
              </label>
              <input type="number" name="weight" min="0" max="160" step="0.1" defaultValue="0"
                className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 font-bold px-4">Отмена</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-200">Подтвердить</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationPage;
