import React, { useState } from 'react';
import { Bot, Sparkles, ChevronDown, ChevronUp, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const AgentChatBubble = ({ offer, isCurrentUserBuyer, isCurrentUserSeller }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isBuyerAgent = offer.actor === 'BUYER_AGENT' || offer.senderRole === 'buyer_agent';
  const isAccept = offer.action === 'ACCEPT';
  const isReject = offer.action === 'REJECT';

  return (
    <div className={`flex gap-3 mb-5 ${isBuyerAgent ? 'flex-row' : 'flex-row-reverse'} text-left`}>
      {/* Agent Avatar */}
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
        isBuyerAgent
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-800 text-white'
      }`}>
        <Bot className="w-5 h-5" />
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 border transition-all shadow-xs ${
        isBuyerAgent
          ? 'bg-indigo-50/60 border-indigo-100 rounded-tl-xs'
          : 'bg-white border-slate-200 rounded-tr-xs'
      }`}>
        {/* Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isBuyerAgent ? 'text-indigo-700' : 'text-slate-800'}`}>
              {isBuyerAgent ? 'Buyer AI Agent' : 'Seller AI Agent'}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
              Round {offer.round}
            </span>
          </div>

          {/* Action & Price Tag */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
              isAccept
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : isReject
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}>
              {offer.action || 'OFFER'}
            </span>

            {offer.price !== null && offer.price !== undefined && (
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold bg-indigo-600 text-white shadow-2xs">
                ₹{offer.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Conversational Message */}
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed mb-2">
          {offer.message}
        </p>

        {/* Guardrail Intervention Note if present */}
        {offer.guardrailCorrected && offer.guardrailNote && (
          <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-mono flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <span>[Guardrail verified: {offer.guardrailNote}]</span>
          </div>
        )}

        <div className="mt-1 text-right">
          <span className="text-[10px] text-slate-400">
            {offer.createdAt ? new Date(offer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
