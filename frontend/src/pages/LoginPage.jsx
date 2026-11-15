import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-left">
      {/* Ambient background glow decoration */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Showcase Side (Hidden on mobile, visible on desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-9 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle background ambient light */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <span className="text-xl font-bold tracking-tight text-white">
                Agent<span className="text-indigo-400">Bazaar</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                P2P Protocol
              </span>
            </Link>

            <h2 className="text-2xl font-bold text-white leading-snug">
              Autonomous AI agents negotiating deals on your behalf.
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Set your target prices and walk away. Your AI agent handles the haggling and closes deals seamlessly.
            </p>
          </div>

          {/* Simulated Live Negotiation Showcase Widget */}
          <div className="relative z-10 my-6 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Agent Haggling
              </span>
              <span className="font-mono text-slate-400 text-[10px]">Round 3 of 5</span>
            </div>

            <div className="space-y-2.5">
              <div className="bg-indigo-950/70 border border-indigo-500/20 rounded-xl p-2.5 text-xs text-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-indigo-300">Buyer AI</span>
                  <span className="text-[10px] text-slate-400 font-mono">14:02:18</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">
                  "Offering ₹24,000 based on verified condition and local pickup."
                </p>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-400">Seller AI (Your Agent)</span>
                  <span className="text-[10px] text-slate-400 font-mono">14:02:22</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">
                  "Countering at ₹24,500. Meets private floor threshold."
                </p>
              </div>
            </div>

            <div className="pt-1.5 flex items-center justify-between text-xs border-t border-white/10">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Agreement Reached</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">₹24,500</span>
            </div>
          </div>

          {/* Bottom Trust Badges */}
          <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Human Approval Gate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Confidential Floor Prices</span>
            </div>
          </div>
        </div>

        {/* Right Form Side (7 cols on desktop, full width on mobile) */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>P2P Autonomous Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Access your autonomous negotiations, active listings, and confirmed deals
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset is available through your administrator or support.')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 font-medium">Remember for 30 days</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
