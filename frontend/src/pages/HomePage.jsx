import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, Zap, Handshake, ArrowRight, Star, CheckCircle, Search, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { NegotiationModal } from '../components/NegotiationModal';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForNegotiate, setSelectedProductForNegotiate] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/products?limit=4');
        setFeaturedProducts(res.data.products || []);
      } catch (err) {
        console.error('[HomePage] Failed to fetch featured products:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleNegotiateClick = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedProductForNegotiate(product);
  };

  return (
    <div className="text-left">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-2xs">
                <Bot className="w-3.5 h-3.5" />
                <span>Autonomous Agent-to-Agent Negotiation Protocol</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Peer-to-Peer Resale Marketplace with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                  Autonomous AI Haggle
                </span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                No more stressful messaging back and forth. Set your confidential target price and private limits. Two autonomous AI agents negotiate round-by-round within mathematical bounds, with mandatory approval from both humans before any deal is finalized.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/marketplace"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Browse Resale Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/how-it-works"
                  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3.5 rounded-2xl text-xs sm:text-sm border border-slate-300 shadow-2xs transition-all"
                >
                  How Agents Negotiate
                </Link>
              </div>

              {/* Three Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Confidential price limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Strict AI guardrails</span>
                </div>
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dual human approval</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Live Agent Negotiation Preview</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Round 3 / 5
                  </span>
                </div>

                {/* Simulated Buyer Turn */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-indigo-950">Buyer Agent</span>
                      <span className="font-mono font-bold text-indigo-700">Offer: ₹17,000</span>
                    </div>
                    <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                      "Considering the Like New condition of the MacBook, we propose ₹17,000 for a prompt cash deal."
                    </p>
                  </div>
                </div>

                {/* Simulated Seller Turn */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">Seller Agent</span>
                      <span className="font-mono font-bold text-slate-800">Counter: ₹17,500</span>
                    </div>
                    <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                      "I appreciate your offer. In Civil Lines, my lowest counter-offer is ₹17,500."
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-900">Agreed Price: ₹17,500</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    Requires Human Approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Featured Active Listings</h2>
            <p className="text-xs text-slate-500 mt-1">Pre-owned verified items ready for autonomous AI price negotiation</p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                currentUserId={user?._id}
                onNegotiate={handleNegotiateClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Value Overview Banner */}
      <section className="bg-slate-50 border-t border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Why Autonomous Resale Negotiation?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Replacing endless awkward messaging with private algorithmic bargaining and dual human verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Zero Haggling Stress</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure your confidential target and budget limits in seconds. The agents negotiate round-by-round while you go about your day.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Mathematical Guardrails</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Backend code strictly enforces that buyer agents cannot exceed maximum budgets and seller agents cannot sell below minimum floor prices.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Dual Human Approval</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI agents never finalize transactions on their own. Once a price is agreed, both human parties must click Confirm before handover details unlock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Negotiation Modal */}
      <NegotiationModal
        product={selectedProductForNegotiate}
        isOpen={!!selectedProductForNegotiate}
        onClose={() => setSelectedProductForNegotiate(null)}
      />
    </div>
  );
};
