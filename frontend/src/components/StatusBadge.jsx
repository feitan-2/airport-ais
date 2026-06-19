export const statusColors = {
  'Confirmed':  'bg-blue-100 text-blue-800',
  'Checked-in': 'bg-green-100 text-green-800',
  'Cancelled':  'bg-red-100 text-red-800',
  'Pending':    'bg-yellow-100 text-yellow-800',
};

const StatusBadge = ({ status }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-slate-100 text-slate-700'}`}>
    {status}
  </span>
);

export default StatusBadge;
