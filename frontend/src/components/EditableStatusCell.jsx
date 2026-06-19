import { useState } from 'react';
import { statusColors } from './StatusBadge';

const EditableStatusCell = ({ booking, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(booking.booking_status);

  const handleSave = async () => {
    setIsEditing(false);
    if (status === booking.booking_status) return;
    try {
      await onSave(booking.booking_id, status);
    } catch {
      setStatus(booking.booking_status);
    }
  };

  const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center';

  if (isEditing) {
    return (
      <div className="relative inline-block">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          autoFocus
          className={`${base} ${statusColors[status] || 'bg-slate-100 text-slate-800'} appearance-none border-2 border-blue-500 pr-8`}
        >
          <option value="Confirmed">Confirmed</option>
          <option value="Checked-in">Checked-in</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Pending">Pending</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
      </div>
    );
  }

  return (
    <span onClick={() => setIsEditing(true)} className={`${base} ${statusColors[status] || 'bg-slate-100 text-slate-800'} cursor-pointer`}>
      {status}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 opacity-50" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
      </svg>
    </span>
  );
};

export default EditableStatusCell;
