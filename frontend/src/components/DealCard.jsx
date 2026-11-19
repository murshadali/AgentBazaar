import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  Handshake,
  Star,
  ShieldCheck,
  Edit3,
  XCircle
} from 'lucide-react';
import api from '../services/api';

export const DealCard = ({ deal, currentUserId, onUpdated, onReviewClick }) => {
  const [loading, setLoading] = useState(false);
  const [editingHandover, setEditingHandover] = useState(false);
  const [reasonModalMode, setReasonModalMode] = useState(null); // null | 'reject' | 'cancel'
  const [reasonInput, setReasonInput] = useState('');
  const [handoverForm, setHandoverForm] = useState({
    location: deal.handover?.location || '',
    timeWindow: deal.handover?.timeWindow || '',
    contactNumber: deal.handover?.contactNumber || '',
    notes: deal.handover?.notes || '',
    suggestedByBuyerTimeWindow: deal.handover?.suggestedByBuyerTimeWindow || ''
  });

  const isBuyer = String(deal.buyerId?._id || deal.buyerId || deal.buyer?._id || deal.buyer) === String(currentUserId);
  const isSeller = String(deal.sellerId?._id || deal.sellerId || deal.seller?._id || deal.seller) === String(currentUserId);

  const buyerApproved = deal.buyerApproval?.status === 'APPROVED' || deal.buyerApproved;
  const sellerApproved = deal.sellerApproval?.status === 'APPROVED' || deal.sellerApproved;
  const hasUserApproved = (isBuyer && buyerApproved) || (isSeller && sellerApproved);

  const isConfirmed = deal.status === 'CONFIRMED';
  const isCompleted = deal.status === 'COMPLETED';
  const isPending = deal.status === 'PENDING_APPROVAL';

  const handleApprove = async () => {
    // Confirmation dialog containing the exact agreed price (Section 11)
    const confirmed = window.confirm(
      `Confirm Deal Proposal:\n\nDo you explicitly agree to finalize this transaction at the agreed price of ₹${deal.agreedPrice?.toLocaleString('en-IN')}?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.post(`/deals/${deal._id}/approve`);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve deal');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setReasonInput('');
    setReasonModalMode('reject');
  };

  const handleCancel = () => {
    setReasonInput('');
    setReasonModalMode('cancel');
  };

  const handleConfirmReasonSubmit = async (e) => {
    e.preventDefault();
    const endpoint = reasonModalMode === 'reject' ? `/deals/${deal._id}/reject` : `/deals/${deal._id}/cancel`;

    setLoading(true);
    try {
      await api.post(endpoint, { reason: reasonInput.trim() });
      setReasonModalMode(null);
      setReasonInput('');
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${reasonModalMode} deal`);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const confirmed = window.confirm(
      'Confirm Transaction Completion:\n\nHave you met in-person and completed both the physical product handover and payment exchange?'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.post(`/deals/${deal._id}/complete`);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete deal');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHandover = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/deals/${deal._id}/handover`, handoverForm);
      setEditingHandover(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update handover details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm text-left relative">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {deal.productId?.title || deal.product?.title || 'Product Resale Deal'}
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Agreed Final Price</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            ₹{deal.agreedPrice?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Dual Human Approval Status (FR8) */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Approval Status</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Buyer Approval */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            buyerApproved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              {buyerApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              )}
              <span className="text-xs font-semibold">
                Buyer: {deal.buyerId?.name?.split(' ')[0] || deal.buyer?.name?.split(' ')[0] || 'Buyer'}
              </span>
            </div>
            <span className="text-[11px] font-bold">
              {buyerApproved ? 'Approved ✓' : 'Awaiting Approval'}
            </span>
          </div>

          {/* Seller Approval */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            sellerApproved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              {sellerApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              )}
              <span className="text-xs font-semibold">
                Seller: {deal.sellerId?.name?.split(' ')[0] || deal.seller?.name?.split(' ')[0] || 'Seller'}
              </span>
            </div>
            <span className="text-[11px] font-bold">
              {sellerApproved ? 'Approved ✓' : 'Awaiting Approval'}
            </span>
          </div>
        </div>
      </div>

      {/* STATE 1: PENDING APPROVAL */}
      {isPending && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p className="leading-relaxed">
              Autonomous agents have negotiated this price. Neither party is bound until both humans approve. Handover pickup coordinates and phone numbers remain masked until confirmation.
            </p>
          </div>

          {!hasUserApproved ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Approve Deal</span>
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 text-center text-xs text-slate-600 border border-slate-200">
              You have submitted your approval. Waiting for counterparty confirmation.
            </div>
          )}
        </div>
      )}

      {/* STATE 2: CONFIRMED or COMPLETED — Handover Coordination */}
      {(isConfirmed || isCompleted) && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Handover Coordination Details
                </h4>
              </div>
              {isConfirmed && isSeller && (
                <button
                  onClick={() => setEditingHandover(!editingHandover)}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{editingHandover ? 'Cancel' : 'Edit Coordinates'}</span>
                </button>
              )}
            </div>

            {editingHandover ? (
              <form onSubmit={handleSaveHandover} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pickup Meeting Address</label>
                  <input
                    type="text"
                    value={handoverForm.location}
                    onChange={(e) => setHandoverForm({ ...handoverForm, location: e.target.value })}
                    required
                    placeholder="e.g. Civil Lines near University Gate 2"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Time Window</label>
                    <input
                      type="text"
                      value={handoverForm.timeWindow}
                      onChange={(e) => setHandoverForm({ ...handoverForm, timeWindow: e.target.value })}
                      placeholder="e.g. 5:00 PM - 6:30 PM"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={handoverForm.contactNumber}
                      onChange={(e) => setHandoverForm({ ...handoverForm, contactNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Handover Coordinates
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Pickup Location</span>
                    <span className="font-bold text-slate-900">
                      {deal.handover?.location || deal.productId?.location || deal.product?.location || deal.sellerId?.city || deal.seller?.city || 'Coordinate with seller'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Meeting Time</span>
                    <span className="font-bold text-slate-900">{deal.handover?.timeWindow || 'Flexible'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Unlocked Contact Phone</span>
                    <span className="font-bold text-indigo-700 font-mono">
                      {deal.handover?.contactNumber || deal.sellerId?.phone || deal.buyerId?.phone || 'Provided'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Direct Payment Notice</span>
                    <span className="text-slate-600 text-[11px]">Cash / UPI in person outside the app.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs for Confirmed state */}
          {isConfirmed && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Handover Completed (Item & Payment Exchanged)</span>
              </button>

              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300 text-xs font-semibold transition-colors"
              >
                Cancel Deal
              </button>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transaction Completed</span>
              </span>
              {!deal.hasUserReviewed ? (
                <button
                  onClick={() => onReviewClick ? onReviewClick(deal) : null}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-slate-900" />
                  <span>Leave Review</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>Review Submitted</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* REJECTED / CANCELLED STATES */}
      {(deal.status === 'REJECTED' || deal.status === 'CANCELLED') && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <strong>{deal.status === 'REJECTED' ? 'Proposal Declined' : 'Deal Cancelled'}:</strong>{' '}
          {deal.cancellationReason || deal.rejectionReason || 'Transaction concluded without final agreement.'}
        </div>
      )}

      {/* Minimal Decline / Cancel Reason Popup */}
      {reasonModalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReasonSubmit}
            className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-5 space-y-3 text-xs"
          >
            <h3 className="font-bold text-slate-900 text-sm">
              {reasonModalMode === 'reject' ? 'Decline Deal Proposal' : 'Cancel Confirmed Deal'}
            </h3>
            <input
              type="text"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Enter reason..."
              autoFocus
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReasonModalMode(null)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
              >
                {loading
                  ? 'Processing...'
                  : reasonModalMode === 'reject'
                  ? 'Decline'
                  : 'Confirm Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
