import React, { useState, useEffect } from 'react';
import { Handshake, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Star, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DealCard } from '../components/DealCard';
import { ReviewModal } from '../components/ReviewModal';

export const DealsPage = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
  const [reviewingDeal, setReviewingDeal] = useState(null);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deals');
      setDeals(res.data.deals || []);
    } catch (err) {
      console.error('[DealsPage] Failed to fetch deals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const filteredDeals = deals.filter((d) => {
    if (filter === 'ALL') return true;
    return (d.status || '').toUpperCase() === filter;
  });

  const pendingCount = deals.filter(
    (d) => (d.status || '').toUpperCase() === 'PENDING_APPROVAL'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Handshake className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Deals & Handover Coordination</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dual human approval gate, physical handover coordinates, and post-transaction feedback
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDeals}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh Deals"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingCount} Pending Approval</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          {[
            { id: 'ALL', label: `All Deals (${deals.length})` },
            { id: 'PENDING_APPROVAL', label: `Pending Approval (${deals.filter((d) => (d.status || '').toUpperCase() === 'PENDING_APPROVAL').length})` },
            { id: 'CONFIRMED', label: `Confirmed (${deals.filter((d) => (d.status || '').toUpperCase() === 'CONFIRMED').length})` },
            { id: 'COMPLETED', label: `Completed (${deals.filter((d) => (d.status || '').toUpperCase() === 'COMPLETED').length})` },
            { id: 'CANCELLED', label: `Cancelled (${deals.filter((d) => (d.status || '').toUpperCase() === 'CANCELLED').length})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-3" />
            <p className="text-xs text-slate-500">Loading your deals...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Handshake className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Deals in this Section</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When Buyer and Seller AI agents reach an agreed price, a deal proposal is generated. Both human parties must review and approve the agreed price before it is confirmed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal._id}
                deal={deal}
                currentUserId={user?._id}
                onUpdated={fetchDeals}
                onReviewClick={(d) => setReviewingDeal(d)}
              />
            ))}
          </div>
        )}

        {/* Review & Rating Modal */}
        {reviewingDeal && (
          <ReviewModal
            deal={reviewingDeal}
            isOpen={Boolean(reviewingDeal)}
            onClose={() => setReviewingDeal(null)}
            onSuccess={() => {
              setReviewingDeal(null);
              fetchDeals();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DealsPage;
