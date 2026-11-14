import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  Play,
  StepForward,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
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
  const [thinkingState, setThinkingState] = useState(null);
  const [error, setError] = useState('');

  const chatBottomRef = useRef(null);

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

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [offers, thinkingState]);

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
            <Link
              to="/deals"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>View Deal Proposal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Left Chat Feed, Right Timeline Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chat Feed */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col h-[650px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Autonomous Negotiation Stream
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Socket.IO Live</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {offers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Bot className="w-10 h-10 mb-2 text-slate-300 animate-pulse" />
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
                <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{thinkingState.message}</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Agreement Banner */}
          {isAgreed && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Deal Proposed at ₹{negotiation.agreedPrice?.toLocaleString('en-IN')}!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Both buyer and seller must confirm and approve before meetup details unlock.
                  </p>
                </div>
              </div>
              <Link
                to="/deals"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0 shadow-xs"
              >
                Approve Deal →
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
              <span>Your Private Parameters (Confidential)</span>
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
