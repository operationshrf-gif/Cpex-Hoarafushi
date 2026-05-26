import {
  LayoutDashboard,
  Package,
  Search,
  Upload,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { AuthSession } from '../../types';

type Page =
  | 'dashboard'
  | 'parcels'
  | 'search'
  | 'import'
  | 'handover'
  | 'users'
  | 'settings'
  | 'activity'
  | 'public-search';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { id: 'parcels', label: 'Parcels', icon: Package, roles: ['admin', 'staff'] },
  { id: 'search', label: 'Search', icon: Search, roles: ['admin', 'staff'] },
  { id: 'import', label: 'Import Parcels', icon: Upload, roles: ['admin', 'staff'] },
  { id: 'handover', label: 'Handover', icon: CheckSquare, roles: ['admin', 'staff'] },
  { id: 'activity', label: 'Activity Log', icon: FileText, roles: ['admin'] },
  { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  session: AuthSession;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  currentPage,
  onNavigate,
  session,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(session.role));

  const handleNav = (page: Page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-40 flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight text-base leading-tight">
                IslandPost
              </div>
              <div className="text-xs text-slate-400 leading-tight">Parcel Management</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                  ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                  size={18}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-400" />}
              </button>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="px-3 py-2 mb-1">
            <div className="text-sm font-medium text-white truncate">{session.fullName}</div>
            <div className="text-xs text-slate-400 capitalize">{session.role} Account</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export type { Page };
