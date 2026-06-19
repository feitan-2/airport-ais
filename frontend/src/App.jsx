import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Sidebar from './components/Sidebar';

import AdminFlightsPage  from './pages/admin/AdminFlightsPage';
import AdminPlanesPage   from './pages/admin/AdminPlanesPage';
import AdminAirlinesPage from './pages/admin/AdminAirlinesPage';
import AdminStaffPage    from './pages/admin/AdminStaffPage';
import ReportsPage       from './pages/admin/ReportsPage';

import BookingsPage      from './pages/agent/BookingsPage';
import RegistrationPage  from './pages/agent/RegistrationPage';
import BoardingPassesPage from './pages/agent/BoardingPassesPage';

import ControlPage       from './pages/controller/ControlPage';

import PassengerFlightsPage  from './pages/passenger/PassengerFlightsPage';
import PassengerBookingsPage from './pages/passenger/PassengerBookingsPage';

const defaultViews = {
  admin:      'flights',
  agent:      'bookings',
  controller: 'control',
  passenger:  'flights',
};

const App = () => {
  const [authPage, setAuthPage] = useState('login'); 
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('airport_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('airport_session');
    if (saved) {
      const s = JSON.parse(saved);
      return defaultViews[s.role] || 'flights';
    }
    return 'flights';
  });

  const handleLogin = (data) => {
    localStorage.setItem('airport_session', JSON.stringify(data));
    setSession(data);
    setCurrentView(defaultViews[data.role] || 'flights');
  };

  const handleLogout = () => {
    localStorage.removeItem('airport_session');
    setSession(null);
  };

  const navigate = (view) => setCurrentView(view);

  if (!session) {
    return (
      <>
        <Toaster position="top-center" />
        {authPage === 'login'
          ? <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage('register')} />
          : <RegisterPage onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />
        }
      </>
    );
  }

  const { role, entity_id, display_name } = session;

  const renderPage = () => {
    if (role === 'admin') {
      if (currentView === 'flights')  return <AdminFlightsPage />;
      if (currentView === 'planes')   return <AdminPlanesPage />;
      if (currentView === 'airlines') return <AdminAirlinesPage />;
      if (currentView === 'staff')    return <AdminStaffPage />;
      if (currentView === 'reports')  return <ReportsPage />;
    }
    if (role === 'agent') {
      if (currentView === 'bookings')        return <BookingsPage />;
      if (currentView === 'registration')    return <RegistrationPage agentId={entity_id} />;
      if (currentView === 'boarding-passes') return <BoardingPassesPage />;
    }
    if (role === 'controller') {
      return <ControlPage controllerId={entity_id} />;
    }
    if (role === 'passenger') {
      if (currentView === 'flights')     return <PassengerFlightsPage passengerId={entity_id} />;
      if (currentView === 'my-bookings') return <PassengerBookingsPage passengerId={entity_id} />;
    }
    return <div className="text-slate-500">Страница не найдена</div>;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar
        role={role}
        displayName={display_name}
        currentView={currentView}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-4 md:p-6 xl:p-10 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
