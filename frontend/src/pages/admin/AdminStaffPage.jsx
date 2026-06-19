import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import FieldHint from '../../components/FieldHint';
import { API_URL } from '../../api';
import { ITEMS } from '../../constants';

const StaffTable = ({ data, page, setPage, onEdit, onDelete, columns }) => {
  const totalPages = Math.ceil(data.length / ITEMS);
  const current = data.slice((page - 1) * ITEMS, page * ITEMS);
  return (
    <>
      <div className="overflow-x-auto"><table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr className="text-slate-500 border-b text-sm uppercase">
            {columns.map(c => <th key={c.key} className="text-left p-3">{c.label}</th>)}
            <th className="text-right p-3">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: ITEMS }).map((_, i) => {
            const row = current[i];
            if (row) return (
              <tr key={i} className="hover:bg-slate-50" style={{ height: 53 }}>
                {columns.map((c, ci) => <td key={c.key} className={`p-3${ci === 0 ? ' font-semibold' : ''}`}>{row[c.key]}</td>)}
                <td className="p-3 text-right space-x-3">
                  <button onClick={() => onEdit(row)} className="text-blue-600 hover:underline font-semibold text-sm">Изменить</button>
                  <button onClick={() => onDelete(row)} className="text-red-500 hover:underline font-semibold text-sm">Удалить</button>
                </td>
              </tr>
            );
            return <tr key={`ph-${i}`} style={{ height: 53 }}><td colSpan={columns.length + 1} /></tr>;
          })}
        </tbody>
      </table></div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
};

const AdminStaffPage = () => {
  const [tab, setTab] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [controllers, setControllers] = useState([]);
  const [agentPage, setAgentPage] = useState(1);
  const [ctrlPage, setCtrlPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullname: '', position: '' });

  const loadAgents = () => fetch(`${API_URL}/admin/agents`).then(r => r.json()).then(setAgents);
  const loadControllers = () => fetch(`${API_URL}/admin/controllers`).then(r => r.json()).then(setControllers);

  useEffect(() => { loadAgents(); loadControllers(); }, []);

  const openCreate = () => { setEditing(null); setForm({ fullname: '', position: '' }); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    const nameKey = tab === 'agents' ? 'agent_fullname' : 'controller_fullname';
    const posKey = tab === 'agents' ? 'agent_post' : 'controller_post';
    setForm({ fullname: row[nameKey], position: row[posKey] });
    setModalOpen(true);
  };

  const validate = () => {
    if (!form.fullname.trim()) return 'Введите ФИО';
    if (form.fullname.trim().length > 50) return 'ФИО не должно превышать 50 символов';
    if (!form.position.trim()) return 'Введите должность';
    if (form.position.trim().length > 20) return 'Должность не должна превышать 20 символов';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const isAgent = tab === 'agents';
    const body = isAgent
      ? { agent_fullname: form.fullname, agent_post: form.position }
      : { controller_fullname: form.fullname, controller_post: form.position };
    const idKey = isAgent ? 'agent_id' : 'controller_id';
    const base = isAgent ? '/admin/agents' : '/admin/controllers';
    const url = editing ? `${API_URL}${base}/${editing[idKey]}` : `${API_URL}${base}`;
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success(editing ? 'Обновлено' : 'Добавлено');
      setModalOpen(false);
      isAgent ? loadAgents() : loadControllers();
    } else {
      const err = await res.json();
      toast.error(err.detail || 'Ошибка');
    }
  };

  const handleDelete = async (row) => {
    if (!confirm('Удалить запись?')) return;
    const isAgent = tab === 'agents';
    const idKey = isAgent ? 'agent_id' : 'controller_id';
    const base = isAgent ? '/admin/agents' : '/admin/controllers';
    const res = await fetch(`${API_URL}${base}/${row[idKey]}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Удалено'); isAgent ? loadAgents() : loadControllers(); }
    else { const err = await res.json(); toast.error(err.detail || 'Ошибка'); }
  };

  const agentCols = [{ key: 'agent_fullname', label: 'ФИО' }, { key: 'agent_post', label: 'Должность' }];
  const ctrlCols = [{ key: 'controller_fullname', label: 'ФИО' }, { key: 'controller_post', label: 'Должность' }];

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Управление персоналом</h2>
        <button onClick={openCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700">+ Добавить</button>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        <button onClick={() => setTab('agents')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${tab === 'agents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Агенты по регистрации ({agents.length})
        </button>
        <button onClick={() => setTab('controllers')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors ${tab === 'controllers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Служба контроля ({controllers.length})
        </button>
      </div>

      {tab === 'agents'
        ? <StaffTable data={agents} page={agentPage} setPage={setAgentPage} onEdit={openEdit} onDelete={handleDelete} columns={agentCols} />
        : <StaffTable data={controllers} page={ctrlPage} setPage={setCtrlPage} onEdit={openEdit} onDelete={handleDelete} columns={ctrlCols} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать' : (tab === 'agents' ? 'Новый агент' : 'Новый контролёр')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ФИО</label>
            <input value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
              placeholder="Иванов Иван Иванович" maxLength={50} className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Должность <FieldHint text={tab === 'agents' ? 'Не более 20 символов. Например: Старший агент, Агент по регистрации' : 'Не более 20 символов. Например: Офицер безопасности, Контролёр'} />
            </label>
            <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
              placeholder={tab === 'agents' ? 'Агент по регистрации' : 'Контролёр службы безопасности'} maxLength={20} className="w-full border p-3 rounded-lg outline-none focus:border-blue-500" />
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

export default AdminStaffPage;
