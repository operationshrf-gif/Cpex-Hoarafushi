import { Package, Home, Users } from 'lucide-react';

interface NavbarProps {
  onHome?: () => void;
  onCustomer?: () => void;
  onAdmin?: () => void;
}

export function Navbar({ onHome, onCustomer, onAdmin }: NavbarProps) {
  return (
    <header className="w-full bg-white/5 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-white">CPEX Hoarafushi</div>
              <div className="text-xs text-slate-300">Parcel Management</div>
            </div>
          </button>
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={onCustomer}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span className="hidden md:inline">Customer Portal</span>
          </button>

          <button
            onClick={onAdmin}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Admin Portal</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
