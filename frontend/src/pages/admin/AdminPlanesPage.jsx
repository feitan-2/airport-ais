import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import FieldHint from '../../components/FieldHint';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';
const EMPTY = { plane_type: '', plane_capacity: '' };

const AdminPlanesPage = () => {
  const [planes, setPlanes] = useState([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => fetch(`${API_URL}/admin/planes`).then(r => r.json()).then(setPlanes).catch(() => toast.error('Ошибка'));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ plane_type: p.plane_type, plane_capacity: p.plane_capacity }); setModalOpen(true); };

  const validate = () => {
    if (!form.plane_type.trim()) return 'Введите тип самолёта';
    if (form.plane_type.trim().length > 25) return 'Тип самолёта не должен превышать 25 символов';
    const cap = Number(form.plane_capacity);
    if (!form.plane_capacity || isNaN(cap) || cap < 1) return 'Вместимость должна быть не менее 1';
    if (cap > 1000) return 'Вместимость не должна превышать 1000 мест';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const url = editing ? `${API_URL}/admin/planes/${editing.plane_id}` : `${API_URL}/admin/planes`;
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { toast.success(editing ? 'Обновлено' : 'Добавлено'); setModalOpen(false); load(); }
    else { const err = await res.json(); toast.error(err.detail || 'Ошибка'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить самолёт?')) return;
    const res = await fetch(`${API_URL}/admin/planes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Удалено'); load(); }
    else { const err = await res.json(); toast.error(err.detail || 'Ошибка'); }
  };

  const totalPages = Math.ceil(planes.length / ITEMS);
  const current = planes.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Авиапарк</h2>
        <button onClick={openCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700">+ Добавить самолёт</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            <th className="text-left p-3">Тип самолёта</th>
            <th className="text-left p-3">Вместимость</th>
            <th className="text-right p-3">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const p = current[i];
            if (p) return (
              <tr key={p.plane_id} className="hover:bg-slate-50" style={{ height: 53 }}>
                <td className="p-3 font-semibold">{p.plane_type}</td>
                <td className="p-3">{p.plane_capacity} мест</td>
                <td className="p-3 text-right space-x-3">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline font-semibold text-sm">Изменить</button>
                  <button onClick={() => handleDelete(p.plane_id)} className="text-red-500 hover:underline font-semibold text-sm">Удалить</button>
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={3} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать самолёт' : 'Новый самолёт'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Тип самолёта</label>
            <input value={form.plane_type} onChange={e => setForm(p => ({ ...p, plane_type: e.target.value }))}
              placeholder="Boeing 737" maxLength={25} className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Вместимость (мест) <FieldHint text="Количество пассажирских мест: от 1 до 1000" />
            </label>
            <input type="number" min="1" max="1000" value={form.plane_capacity} onChange={e => setForm(p => ({ ...p, plane_capacity: e.target.value }))}
              placeholder="150" className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
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

export default AdminPlanesPage;
