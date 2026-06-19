const menuItems = {
  admin: [
    { key: 'flights',     label: 'Рейсы' },
    { key: 'planes',      label: 'Самолёты' },
    { key: 'airlines',    label: 'Авиакомпании' },
    { key: 'staff',       label: 'Персонал' },
    { key: 'reports',     label: 'Отчёты' },
  ],
  agent: [
    { key: 'bookings',        label: 'Бронирования' },
    { key: 'registration',    label: 'Регистрация' },
    { key: 'boarding-passes', label: 'Талоны' },
  ],
  controller: [
    { key: 'control', label: 'Контроль' },
  ],
  passenger: [
    { key: 'flights',   label: 'Рейсы' },
    { key: 'my-bookings', label: 'Мои бронирования' },
  ],
};

const roleLabels = {
  admin:      'Администратор',
  agent:      'Агент',
  controller: 'Контролёр',
  passenger:  'Пассажир',
};

const Sidebar = ({ role, displayName, currentView, onNavigate, onLogout }) => {
  const items = menuItems[role] || [];
  return (
    <nav className="w-52 xl:w-64 bg-slate-900 text-white p-4 xl:p-6 shadow-xl flex flex-col shrink-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-blue-400">Аэропорт Систем</h1>
        <div className="mt-3 px-2 py-2 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 uppercase">{roleLabels[role]}</p>
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
        </div>
      </div>

      <div className="space-y-1 flex-1">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full text-left p-3 rounded transition-colors duration-150 ${
              currentView === item.key ? 'bg-blue-600' : 'hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        onClick={onLogout}
        className="mt-6 w-full text-left p-3 rounded text-slate-400 hover:bg-red-900/40 hover:text-red-300 transition-colors duration-150"
      >
        Выйти
      </button>
    </nav>
  );
};

export default Sidebar;
