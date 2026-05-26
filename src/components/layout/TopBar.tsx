import { Menu, Bell, Globe, Moon, Sun } from 'lucide-react';
import type { AuthSession } from '../../types';

interface TopBarProps {
  title: string;
  subtitle?: string;
  session: AuthSession;
  onMenuToggle: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  onNavigatePublic: () => void;
}

export function TopBar({
  title,
  subtitle,
  onMenuToggle,
  darkMode,
  onToggleDark,
  onNavigatePublic,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 hidden sm:block truncate">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            title="Public Search Portal"
            onClick={onNavigatePublic}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden md:inline">Customer Portal</span>
          </button>
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
