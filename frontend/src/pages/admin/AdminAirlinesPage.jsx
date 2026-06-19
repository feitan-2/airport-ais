import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import FieldHint from '../../components/FieldHint';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';
const EMPTY = { airline_name: '', airline_code: '' };

const AdminAirlinesPage = () => {
  const [airlines, setAirlines] = useState([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => fetch(`${API_URL}/admin/airlines`).then(r => r.json()).then(setAirlines).catch(() => toast.error('Ошибка'));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ airline_name: a.airline_name, airline_code: a.airline_code }); setModalOpen(true); };

  const validate = () => {
    if (!form.airline_name.trim()) return 'Введите название авиакомпании';
    if (form.airline_name.trim().length > 20) return 'Название не должно превышать 20 символов';
    if (!form.airline_code.trim()) return 'Введите код IATA';
    if (form.airline_code.trim().length < 2 || form.airline_code.trim().length > 3) return 'Код IATA должен содержать 2–3 символа';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const url = editing ? `${API_URL}/admin/airlines/${editing.airline_id}` : `${API_URL}/admin/airlines`;
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { toast.success(editing ? 'Обновлено' : 'Добавлено'); setModalOpen(false); load(); }
    else { const err = await res.json(); toast.error(err.detail || 'Ошибка'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить авиакомпанию?')) return;
    const res = await fetch(`${API_URL}/admin/airlines/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Удалено'); load(); }
    else { const err = await res.json(); toast.error(err.detail || 'Ошибка'); }
  };

  const totalPages = Math.ceil(airlines.length / ITEMS);
  const current = airlines.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Авиакомпании</h2>
        <button onClick={openCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700">+ Добавить</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[400px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">Название</th>
            <th className="text-left p-3">Код IATA</th>
            <th className="text-right p-3">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const a = current[i];
            if (a) return (
              <tr key={a.airline_id} className="hover:bg-slate-50" style={{ height: 53 }}>
                <td className="p-3 font-semibold">{a.airline_name}</td>
                <td className="p-3"><span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">{a.airline_code}</span></td>
                <td className="p-3 text-right space-x-3">
                  <button onClick={() => openEdit(a)} className="text-blue-600 hover:underline font-semibold text-sm">Изменить</button>
                  <button onClick={() => handleDelete(a.airline_id)} className="text-red-500 hover:underline font-semibold text-sm">Удалить</button>
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={3} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать авиакомпанию' : 'Новая авиакомпания'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Название</label>
            <input value={form.airline_name} onChange={e => setForm(p => ({ ...p, airline_name: e.target.value }))}
              placeholder="Aeroflot" maxLength={20} className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Код IATA <FieldHint text="Уникальный код авиакомпании: 2 или 3 латинские буквы. Например: SU, EK, LH" />
            </label>
            <input value={form.airline_code} onChange={e => setForm(p => ({ ...p, airline_code: e.target.value.toUpperCase() }))}
              placeholder="SU" maxLength="3" className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 font-mono" />
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

export default AdminAirlinesPage;
