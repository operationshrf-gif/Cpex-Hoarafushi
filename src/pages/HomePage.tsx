import { Navbar } from '../components/layout/Navbar';
import { Package, Users } from 'lucide-react';

interface HomePageProps {
  onCustomer: () => void;
  onAdmin: () => void;
  onHome?: () => void;
}

export function HomePage({ onCustomer, onAdmin, onHome }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col">
      <Navbar onHome={onHome} onCustomer={onCustomer} onAdmin={onAdmin} />

      <header className="w-full">
        <div className="max-w-4xl mx-auto w-full text-center py-6">
          <img src="logo.svg" alt="CPEX Logo" className="mx-auto mb-3 w-36 h-auto bg-transparent" />
          <h1 className="text-3xl sm:text-4xl font-extrabold font-post text-white text-center mt-2">CPEX Hoarafushi Connect</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
          onClick={onCustomer}
          className="relative flex items-center justify-center h-56 rounded-2xl bg-white/6 border border-white/20 hover:bg-white/10 transition-colors shadow-lg"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-xl bg-teal-400/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white text-lg font-semibold">Customer Portal</h3>
          </div>
        </button>

        <button
          onClick={onAdmin}
          className="relative flex items-center justify-center h-56 rounded-2xl bg-white/6 border border-white/20 hover:bg-white/10 transition-colors shadow-lg"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-xl bg-cyan-400/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white text-lg font-semibold">Admin Portal</h3>
          </div>
        </button>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
