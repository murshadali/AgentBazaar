import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, Shield, X, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NegotiationModal = ({ product, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [targetPrice, setTargetPrice] = useState(0);
  const [budgetCeiling, setBudgetCeiling] = useState(0);
  const [style, setStyle] = useState('BALANCED');
  const [maxRounds, setMaxRounds] = useState(5);
  const [autoRun, setAutoRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product && product.price) {
      const defaultTarget = Math.round(product.price * 0.8);
      const defaultBudget = Math.round(product.price * 0.92);
      setTargetPrice(defaultTarget);
      setBudgetCeiling(defaultBudget);
      setStyle(user?.defaultStyle || 'BALANCED');
      setMaxRounds(user?.defaultRounds || 5);
      setError('');
    }
  }, [product, isOpen, user]);

  if (!isOpen || !product) return null;

  const sellerId = product.sellerId?._id || product.sellerId || product.seller?._id || product.seller;
  const isOwner = user && String(sellerId) === String(user._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isOwner) {
      setError('You are the seller of this product. You cannot negotiate on your own listing.');
      return;
    }

    const numTarget = Number(targetPrice);
    const numBudget = Number(budgetCeiling);

    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Target price must be a valid positive number.');
      return;
    }

    if (isNaN(numBudget) || numBudget < numTarget) {
      setError('Maximum budget ceiling cannot be lower than your target price.');
      return;
    }

    if (numBudget > product.price) {
      setError(`Maximum budget ceiling (₹${numBudget.toLocaleString('en-IN')}) cannot exceed the listed asking price (₹${product.price.toLocaleString('en-IN')}).`);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/negotiations', {
        productId: product._id,
        targetPrice: numTarget,
        budgetCeiling: numBudget,
        style,
        maxRounds: Number(maxRounds),
        autoRun
      });

      const negotiationId = res.data.negotiation?._id;
      if (!negotiationId) {
        throw new Error('Negotiation ID missing in response');
      }

      onClose();
      navigate(`/negotiations/${negotiationId}`);
    } catch (err) {
      console.error('[NegotiationModal] Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to initiate negotiation';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-left">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Make an Offer</h2>
            <p className="text-xs text-slate-600">Configure your confidential price bounds for automated negotiation</p>
          </div>
        </div>

        {/* Product preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <img
              src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
              alt={product.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{product.title}</p>
              <p className="text-xs text-slate-500">
                Listed Price: <span className="text-indigo-600 font-bold font-mono">₹{product.price?.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Warning Note if Owner */}
        {isOwner && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 mb-4">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-900">You own this listing.</p>
              <p className="mt-0.5 text-amber-700">A seller cannot negotiate against their own product listing.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Desired Price (₹) *
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
                disabled={isOwner}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Opening proposal reference</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Budget Ceiling (₹) *
              </label>
              <input
                type="number"
                value={budgetCeiling}
                onChange={(e) => setBudgetCeiling(e.target.value)}
                required
                disabled={isOwner}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Absolute highest price</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Negotiation Strategy Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FIRM', label: 'Firm', desc: 'Smaller concessions, protect price' },
                { id: 'BALANCED', label: 'Balanced', desc: 'Moderate, fair compromises' },
                { id: 'FLEXIBLE', label: 'Flexible', desc: 'Larger concessions to close' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  disabled={isOwner}
                  onClick={() => setStyle(item.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    style === item.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Negotiation Rounds
              </label>
              <select
                value={maxRounds}
                disabled={isOwner}
                onChange={(e) => setMaxRounds(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value={3}>3 Rounds (Quick haggle)</option>
                <option value={5}>5 Rounds (Standard)</option>
                <option value={7}>7 Rounds (Gradual)</option>
                <option value={10}>10 Rounds (Extensive)</option>
              </select>
            </div>

            <div className="pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRun}
                  disabled={isOwner}
                  onChange={(e) => setAutoRun(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">Auto-Simulation</span>
              </label>
              <p className="text-[10px] text-slate-500 ml-6">Run round-by-round automatically</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isOwner}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Deploy Buyer Agent & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
