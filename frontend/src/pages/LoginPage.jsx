import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Key, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-left">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to AgentBazaar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your negotiations, inventory, and confirmed deals
          </p>
        </div>

        {/* Demo Accounts Bar */}
        <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick Demo Logins (Password: password123)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@agentbazaar.com')}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl text-xs font-medium text-slate-700 text-left transition-all shadow-2xs"
            >
              <span className="font-semibold block text-[11px] text-slate-900">Administrator</span>
              <span className="text-[10px] text-slate-400 truncate block">admin@agentbazaar.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('murshad@agentbazaar.com')}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl text-xs font-medium text-slate-700 text-left transition-all shadow-2xs"
            >
              <span className="font-semibold block text-[11px] text-slate-900">Seller</span>
              <span className="text-[10px] text-slate-400 truncate block">murshad@agentbazaar.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('buyer@agentbazaar.com')}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl text-xs font-medium text-slate-700 text-left transition-all shadow-2xs"
            >
              <span className="font-semibold block text-[11px] text-slate-900">Buyer</span>
              <span className="text-[10px] text-slate-400 truncate block">buyer@agentbazaar.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('reseller@agentbazaar.com')}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl text-xs font-medium text-slate-700 text-left transition-all shadow-2xs"
            >
              <span className="font-semibold block text-[11px] text-slate-900">Trader</span>
              <span className="text-[10px] text-slate-400 truncate block">reseller@agentbazaar.com</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
