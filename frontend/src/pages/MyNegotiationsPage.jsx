import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MyNegotiationsPage = () => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'as_buyer', 'as_seller'

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/negotiations');
      setNegotiations(res.data.negotiations || []);
    } catch (err) {
      console.error('[MyNegotiations] Failed to load:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const filteredNegotiations = negotiations.filter((n) => {
    const isBuyer = String(n.buyerId?._id || n.buyerId || n.buyer?._id || n.buyer) === String(user?._id);
    const isSeller = String(n.sellerId?._id || n.sellerId || n.seller?._id || n.seller) === String(user?._id);

    if (activeTab === 'as_buyer') return isBuyer;
    if (activeTab === 'as_seller') return isSeller;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            All Negotiations
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'as_buyer', label: 'As Buyer' },
            { id: 'as_seller', label: 'As Seller' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filteredNegotiations.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Negotiations in this Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Deploy an autonomous AI Buyer Agent on any active marketplace listing to negotiate prices for you.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            <span>Explore marketplace listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNegotiations.map((neg) => {
            const isBuyer = String(neg.buyerId?._id || neg.buyerId || neg.buyer?._id || neg.buyer) === String(user?._id);
            const counterparty = isBuyer ? (neg.sellerId || neg.seller) : (neg.buyerId || neg.buyer);
            const product = neg.productId || neg.product || {};
            const lastOffer = neg.latestOffer;

            return (
              <div
                key={neg._id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <img
                    src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
                    alt="product"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        {isBuyer ? 'Buying' : 'Selling'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        neg.status === 'AGREED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : neg.status === 'IN_PROGRESS' || neg.status === 'INITIATED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {neg.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {product.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>With: <strong className="text-slate-800">{counterparty?.name || 'User'}</strong></span>
                      <span>•</span>
                      <span>Rounds: <strong className="text-slate-800">{neg.currentRound}/{neg.maxRounds}</strong></span>
                      {lastOffer && (
                        <>
                          <span>•</span>
                          <span>Last Offer: <strong className="text-indigo-700 font-mono">₹{lastOffer.price?.toLocaleString('en-IN')}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    to={`/negotiations/${neg._id}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Open Arena</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {neg.dealId && (
                    <Link
                      to="/deals"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold"
                    >
                      Deal
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
