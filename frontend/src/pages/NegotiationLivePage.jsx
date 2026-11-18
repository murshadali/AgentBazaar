import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  StepForward,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { AgentChatBubble } from '../components/AgentChatBubble';
import { NegotiationTimeline } from '../components/NegotiationTimeline';

export const NegotiationLivePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const [negotiation, setNegotiation] = useState(null);
  const [offers, setOffers] = useState([]);
  const [userRole, setUserRole] = useState('buyer');
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [thinkingState, setThinkingState] = useState(null);
  const [error, setError] = useState('');

  const chatContainerRef = useRef(null);

  const fetchNegotiation = async () => {
    try {
      const res = await api.get(`/negotiations/${id}`);
      setNegotiation(res.data.negotiation);
      setOffers(res.data.negotiation?.offers || []);
      setUserRole(res.data.userRole || 'buyer');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load negotiation session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiation();
  }, [id]);

  // Real-time Socket.IO event listeners (Section 10)
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join_negotiation', id);

    socket.on('agent_thinking', (data) => {
      setThinkingState(data);
    });

    socket.on('negotiation:offer', (data) => {
      setThinkingState(null);
      setOffers((prev) => {
        const exists = prev.some((o) => o._id === data.offer?._id);
        if (exists) return prev;
        return [...prev, data.offer];
      });
      setNegotiation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentRound: data.round
        };
      });
    });

    socket.on('negotiation:status', (data) => {
      setThinkingState(null);
      setNegotiation((prev) => ({
        ...prev,
        status: data.status,
        agreedPrice: data.agreedPrice || prev?.agreedPrice,
        dealId: data.dealId || prev?.dealId,
        endReason: data.reason || prev?.endReason
      }));
    });

    socket.on('deal:update', (data) => {
      setNegotiation((prev) => ({
        ...prev,
        status: data.status === 'CONFIRMED' ? 'AGREED' : prev?.status,
        dealId: data.dealId || prev?.dealId
      }));
    });

    return () => {
      socket.emit('leave_negotiation', id);
      socket.off('agent_thinking');
      socket.off('negotiation:offer');
      socket.off('negotiation:status');
      socket.off('deal:update');
    };
  }, [socket, id]);

  // Scroll only the chat container feed without jumping or scrolling the page window
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [offers.length, thinkingState]);

  const handleNextTurn = async () => {
    setStepping(true);
    try {
      await api.post(`/negotiations/${id}/turn`);
      await fetchNegotiation();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to step turn');
    } finally {
      setStepping(false);
    }
  };

  const handleSimulate = async () => {
    try {
      await api.post(`/negotiations/${id}/simulate`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start simulation');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this autonomous negotiation?')) return;
    try {
      await api.post(`/negotiations/${id}/cancel`);
      await fetchNegotiation();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel negotiation');
    }
  };

  const handleApproveDeal = async () => {
    const deal = typeof negotiation.dealId === 'object' && negotiation.dealId !== null ? negotiation.dealId : negotiation.deal;
    const dealId = deal?._id || (typeof negotiation.dealId === 'string' ? negotiation.dealId : null);

    if (!dealId) {
      navigate('/deals');
      return;
    }

    const confirmed = window.confirm(
      `Confirm Deal Proposal:\n\nDo you explicitly agree to finalize this transaction at the agreed price of ₹${negotiation.agreedPrice?.toLocaleString('en-IN')}?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await api.post(`/deals/${dealId}/approve`);
      await fetchNegotiation();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve deal proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeal = async () => {
    const deal = typeof negotiation.dealId === 'object' && negotiation.dealId !== null ? negotiation.dealId : negotiation.deal;
    const dealId = deal?._id || (typeof negotiation.dealId === 'string' ? negotiation.dealId : null);

    if (!dealId) {
      navigate('/deals');
      return;
    }

    const reason = prompt('Please enter a reason for declining this deal proposal:');
    if (reason === null) return;

    setActionLoading(true);
    try {
      await api.post(`/deals/${dealId}/reject`, { reason });
      await fetchNegotiation();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline deal proposal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !negotiation) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-rose-600 text-sm mb-4">{error || 'Session not found'}</p>
        <Link to="/marketplace" className="text-indigo-600 hover:underline text-xs font-semibold">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isAgreed = negotiation.status === 'AGREED';
  const isActive = negotiation.status === 'IN_PROGRESS' || negotiation.status === 'INITIATED';
  const product = negotiation.productId || negotiation.product || {};

  const deal = typeof negotiation.dealId === 'object' && negotiation.dealId !== null ? negotiation.dealId : (negotiation.deal || null);
  const isBuyer = userRole === 'buyer';
  const isSeller = userRole === 'seller';
  const myApproval = isBuyer ? deal?.buyerApproval : isSeller ? deal?.sellerApproval : null;
  const hasApproved = myApproval?.status === 'APPROVED';
  const hasRejected = myApproval?.status === 'REJECTED' || deal?.status === 'REJECTED';
  const isConfirmed = deal?.status === 'CONFIRMED';
  const isCompleted = deal?.status === 'COMPLETED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
            alt="product"
            className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 line-clamp-1">{product.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAgreed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isActive
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {negotiation.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>Original Listed Price: <strong className="text-slate-800 font-mono">₹{product.price?.toLocaleString('en-IN')}</strong></span>
              <span>•</span>
              <span>Acting Role: <strong className="text-indigo-600 capitalize font-semibold">{userRole}</strong></span>
            </div>
          </div>
        </div>

        {/* Live Controller Actions */}
        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <button
                onClick={handleNextTurn}
                disabled={stepping || !!thinkingState}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Next Move</span>
              </button>

              <button
                onClick={handleSimulate}
                disabled={!!thinkingState}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Auto Simulation</span>
              </button>

              <button
                onClick={handleCancel}
                title="Cancel negotiation"
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {isAgreed && (
            isConfirmed || isCompleted ? (
              <Link
                to="/deals"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>View Final Deal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : hasApproved ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ✓ You Approved
              </span>
            ) : hasRejected ? (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                Declined
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRejectDeal}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleApproveDeal}
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Approve Deal'}
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Main Grid: Left Chat Feed, Right Timeline Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chat Feed */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col h-[650px] shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Autonomous Negotiation
            </h2>
          </div>

          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-2">
            {offers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <MessageSquare className="w-10 h-10 mb-2 text-slate-300 animate-pulse" />
                <p>Deploying AI agents... The opening offer will appear momentarily.</p>
              </div>
            ) : (
              offers.map((offer, idx) => (
                <AgentChatBubble
                  key={offer._id || idx}
                  offer={offer}
                  isCurrentUserBuyer={userRole === 'buyer'}
                  isCurrentUserSeller={userRole === 'seller'}
                />
              ))
            )}

            {/* Thinking status */}
            {thinkingState && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 animate-pulse">
                <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{thinkingState.message}</span>
              </div>
            )}
          </div>

          {/* Agreement Banner */}
          {isAgreed && (
            isConfirmed || isCompleted ? (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Deal Finalized at ₹{negotiation.agreedPrice?.toLocaleString('en-IN')}!
                    </h4>
                    <p className="text-xs text-slate-600">
                      Both parties have confirmed. Handover meetup details are now unlocked.
                    </p>
                  </div>
                </div>
                <Link
                  to="/deals"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors shadow-2xs"
                >
                  View Meetup Details →
                </Link>
              </div>
            ) : hasRejected ? (
              <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">
                      Deal Proposal Declined
                    </h4>
                    <p className="text-xs text-rose-800">
                      This negotiation deal was declined. No transaction will occur.
                    </p>
                  </div>
                </div>
                <Link
                  to="/marketplace"
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : hasApproved ? (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Approved by you (₹{negotiation.agreedPrice?.toLocaleString('en-IN')})
                    </h4>
                    <p className="text-xs text-slate-600">
                      Waiting for the other party to approve. Once both approve, handover details will unlock.
                    </p>
                  </div>
                </div>
                <Link
                  to="/deals"
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors"
                >
                  Check Status in Deals
                </Link>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Deal Proposed at ₹{negotiation.agreedPrice?.toLocaleString('en-IN')}!
                    </h4>
                    <p className="text-xs text-slate-600">
                      Both parties must approve. You can accept or decline this offer now.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRejectDeal}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Decline Offer
                  </button>
                  <button
                    onClick={handleApproveDeal}
                    disabled={actionLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Deal'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Terminated / No Agreement Banner */}
          {(negotiation.status === 'TERMINATED' || negotiation.status === 'FAILED') && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Negotiation Concluded (No Agreement)
                  </h4>
                  <p className="text-xs text-amber-800">
                    The session reached the round limit. The buyer's maximum budget ceiling could not bridge the gap to the seller's minimum floor price. Neither party's private budget limits were compromised.
                  </p>
                </div>
              </div>
              <Link
                to="/marketplace"
                className="bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors"
              >
                Browse Marketplace →
              </Link>
            </div>
          )}
        </div>

        {/* Right: Convergence Ladder & Confidential Constraints */}
        <div className="lg:col-span-4 space-y-6">
          <NegotiationTimeline
            offers={offers}
            agreedPrice={negotiation.agreedPrice}
            maxRounds={negotiation.maxRounds}
            status={negotiation.status}
          />

          {/* User's Strategy Limits Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-xs space-y-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Your Private Parameters</span>
            </div>

            {userRole === 'buyer' && negotiation.buyerConfigCopy && (
              <div className="space-y-1.5 text-slate-600">
                <p>Desired Target: <strong className="text-slate-900 font-mono">₹{negotiation.buyerConfigCopy.targetPrice?.toLocaleString('en-IN')}</strong></p>
                <p>Budget Ceiling: <strong className="text-indigo-700 font-mono">₹{negotiation.buyerConfigCopy.budgetCeiling?.toLocaleString('en-IN')}</strong></p>
                <p>Strategy Stance: <strong className="text-slate-900 capitalize">{negotiation.buyerConfigCopy.style}</strong></p>
              </div>
            )}

            {userRole === 'seller' && negotiation.sellerConfigCopy && (
              <div className="space-y-1.5 text-slate-600">
                <p>Opening Ask: <strong className="text-slate-900 font-mono">₹{negotiation.sellerConfigCopy.openingAsk?.toLocaleString('en-IN')}</strong></p>
                <p>Floor Limit: <strong className="text-indigo-700 font-mono">₹{negotiation.sellerConfigCopy.privateMinPrice ? `₹${negotiation.sellerConfigCopy.privateMinPrice.toLocaleString('en-IN')}` : 'Protected'}</strong></p>
                <p>Strategy Stance: <strong className="text-slate-900 capitalize">{negotiation.sellerConfigCopy.style}</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
