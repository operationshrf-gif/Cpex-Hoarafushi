import { useState, useEffect, useCallback } from 'react';
import { Sidebar, type Page } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './pages/Dashboard';
import { ParcelsPage } from './pages/ParcelsPage';
import { SearchPage } from './pages/SearchPage';
import { ImportPage } from './pages/ImportPage';
import { HandoverPage } from './pages/HandoverPage';
import { UsersPage } from './pages/UsersPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { PublicSearch } from './pages/PublicSearch';
import { ToastContainer, type ToastMessage } from './components/ui/Toast';
import { getSession, logout } from './lib/auth';
import { seedInitialData, settingsStorage } from './lib/storage';
import type { AuthSession } from './types';

// ─── Page metadata ───────────────────────────────────────────
const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of parcel operations' },
  parcels: { title: 'Parcels', subtitle: 'Manage all parcel records' },
  search: { title: 'Search', subtitle: 'Search and filter parcel records' },
  import: { title: 'Import Parcels', subtitle: 'Bulk import from Excel or CSV files' },
  handover: { title: 'Parcel Handover', subtitle: 'Process deliveries and record handovers' },
  users: { title: 'User Management', subtitle: 'Manage staff and admin accounts' },
  settings: { title: 'Settings', subtitle: 'Configure application preferences' },
  activity: { title: 'Activity Log', subtitle: 'View system activity and audit trail' },
  'public-search': { title: 'Customer Portal', subtitle: 'Public parcel search' },
};

type AppView = 'home' | 'login' | 'staff' | 'public';

let toastIdCounter = 0;

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<AppView>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pageKey, setPageKey] = useState(0); // Force page remount on navigation

  // Initialize on mount
  useEffect(() => {
    seedInitialData();
    const settings = settingsStorage.get();
    setDarkMode(settings.darkMode);

    // Check for existing session
    const existing = getSession();
    if (existing) {
      setSession(existing);
      setView('staff');
    }
  }, []);

  const addToast = useCallback(
    (type: ToastMessage['type'], message: string, duration?: number) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogin = (s: AuthSession) => {
    setSession(s);
    setView('staff');
    setCurrentPage('dashboard');
    addToast('success', `Welcome back, ${s.fullName}!`);
  };

  const handleLogout = () => {
    logout(session);
    setSession(null);
    setView('home');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    setPageKey((k) => k + 1);
    setSidebarOpen(false);
  };

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    settingsStorage.update({ darkMode: next });
  };

  // ─── Public Customer Portal ───────────────────────────────
  if (view === 'public') {
    return (
      <>
        <PublicSearch onGoToStaff={() => setView('home')} onHome={() => setView('home')} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // ─── Home Landing Page ────────────────────────────────────
  if (view === 'home') {
    return (
      <>
        <HomePage onCustomer={() => setView('public')} onAdmin={() => setView('login')} onHome={() => setView('home')} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // ─── Staff Login ──────────────────────────────────────────
  if (view === 'login' || !session) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onPublicSearch={() => setView('public')}
          onHome={() => setView('home')}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // ─── Staff / Admin Panel ──────────────────────────────────
  const meta = PAGE_META[currentPage];

  const renderPage = () => {
    const props = { key: pageKey };
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...props} session={session} onNavigate={handleNavigate} />;
      case 'parcels':
        return <ParcelsPage {...props} session={session} onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage {...props} session={session} onNavigate={handleNavigate} />;
      case 'import':
        return <ImportPage {...props} session={session} />;
      case 'handover':
        return <HandoverPage {...props} session={session} />;
      case 'users':
        return session.role === 'admin' ? (
          <UsersPage {...props} session={session} />
        ) : (
          <Unauthorized />
        );
      case 'activity':
        return session.role === 'admin' ? <ActivityPage {...props} /> : <Unauthorized />;
      case 'settings':
        return session.role === 'admin' ? <SettingsPage {...props} /> : <Unauthorized />;
      default:
        return <Dashboard {...props} session={session} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''} bg-gray-50`}>
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setPageKey((k) => k + 1); }}
        session={session}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          session={session}
          onMenuToggle={() => setSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
          onNavigatePublic={() => setView('public')}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        You don't have permission to view this page. Contact your administrator.
      </p>
    </div>
  );
}
