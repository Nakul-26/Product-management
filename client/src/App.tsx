import { useEffect, useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles.css';

type AppRoute = '/dashboard' | '/sales' | '/sales/history' | '/purchases' | '/login';

const normalizePath = (path: string): AppRoute => {
  if (path === '/sales') return '/sales';
  if (path === '/sales/history') return '/sales/history';
  if (path === '/purchases') return '/purchases';
  if (path === '/login') return '/login';
  return '/dashboard';
};

function AppShell() {
  const [route, setRoute] = useState<AppRoute>(normalizePath(window.location.pathname));
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    if (nextRoute === route) return;
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
  };

  useEffect(() => {
    if (!loading && !user && route !== '/login') {
      window.history.replaceState({}, '', '/login');
      setRoute('/login');
    }
  }, [loading, user, route]);

  if (loading) {
    return <main className="app"><p>Loading...</p></main>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <nav className="app-nav">
        <button type="button" className={`btn ${route === '/dashboard' ? 'btn-primary' : 'btn-light'}`} onClick={() => navigate('/dashboard')}>
          Dashboard
        </button>
        <button type="button" className={`btn ${route === '/sales' ? 'btn-primary' : 'btn-light'}`} onClick={() => navigate('/sales')}>
          POS
        </button>
        <button
          type="button"
          className={`btn ${route === '/sales/history' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => navigate('/sales/history')}
        >
          Sales History
        </button>
        {user.role === 'owner' && (
          <button type="button" className={`btn ${route === '/purchases' ? 'btn-primary' : 'btn-light'}`} onClick={() => navigate('/purchases')}>
            Purchases
          </button>
        )}
        <span className="nav-spacer" />
        <span className="muted">{user.name} ({user.role})</span>
        <button type="button" className="btn btn-light" onClick={logout}>Logout</button>
      </nav>

      {route === '/dashboard' && <DashboardPage />}
      {route === '/sales' && <SalesPage />}
      {route === '/sales/history' && <SalesHistoryPage />}
      {route === '/purchases' && user.role === 'owner' && <PurchasesPage />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
