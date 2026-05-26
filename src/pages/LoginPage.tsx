import { useState } from 'react';
import { Package, Lock, User, Eye, EyeOff, Globe, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { login } from '../lib/auth';
import { settingsStorage } from '../lib/storage';
import type { AuthSession } from '../types';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
  onPublicSearch: () => void;
  onHome?: () => void;
}

export function LoginPage({ onLogin, onPublicSearch, onHome }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const settings = settingsStorage.get();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 300));

    const result = login(username.trim(), password);
    setIsLoading(false);

    if (result.success && result.session) {
      onLogin(result.session);
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col">
      <Navbar onHome={onHome} onCustomer={onPublicSearch} onAdmin={() => {}} />

      <div className="flex-1 flex items-center justify-center p-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg mb-4"
                style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}
              >
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Cpex Hoarafushi</h1>
              <p className="text-slate-400 text-sm mt-1">{settings.officeName}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                    autoComplete="username"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/15 transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                    autoComplete="current-password"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/15 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold text-sm hover:from-teal-400 hover:to-cyan-500 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Customer Portal Link */}
            <button
              onClick={onPublicSearch}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Customer Portal
            </button>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            Cpex Hoarafushi Parcel Management System v1.0 · {settings.islandName}
          </p>
        </div>
      </div>
    </div>
  );
}
