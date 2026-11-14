import React from 'react';
import { TrendingDown, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export const NegotiationTimeline = ({ offers = [], agreedPrice, maxRounds, status }) => {
  // Group offers by round
  const rounds = {};
  offers.forEach((o) => {
    if (!rounds[o.round]) rounds[o.round] = {};
    if (o.actor === 'BUYER_AGENT' || o.senderRole === 'buyer_agent') rounds[o.round].buyer = o;
    if (o.actor === 'SELLER_AGENT' || o.senderRole === 'seller_agent') rounds[o.round].seller = o;
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Convergence Tracker</span>
        </h3>
        <span className="text-xs text-slate-500">
          Rounds: <strong className="text-slate-800">{roundNumbers.length}</strong> / {maxRounds}
        </span>
      </div>

      <div className="space-y-2.5">
        {roundNumbers.map((rNum) => {
          const rData = rounds[rNum];
          const buyerOffer = rData.buyer?.price;
          const sellerOffer = rData.seller?.price;
          const spread = buyerOffer && sellerOffer ? Math.abs(sellerOffer - buyerOffer) : null;

          return (
            <div
              key={rNum}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[11px]">
                  R{rNum}
                </span>

                {/* Buyer Offer */}
                <div className="flex items-center gap-1 text-indigo-700 font-mono font-semibold">
                  <TrendingUp className="w-3 h-3 text-indigo-500" />
                  <span>
                    {buyerOffer ? `₹${buyerOffer.toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
              </div>

              {/* Spread */}
              <div className="hidden sm:flex flex-col items-center">
                <span className="text-[10px] text-slate-400">Gap</span>
                <span className="text-[10px] font-mono text-slate-600 font-medium">
                  {spread !== null ? `₹${spread.toLocaleString('en-IN')}` : 'Evaluating...'}
                </span>
              </div>

              {/* Seller Ask */}
              <div className="flex items-center gap-1 text-slate-800 font-mono font-semibold">
                <span>
                  {sellerOffer ? `₹${sellerOffer.toLocaleString('en-IN')}` : 'Pending turn...'}
                </span>
                <TrendingDown className="w-3 h-3 text-slate-500" />
              </div>
            </div>
          );
        })}

        {(status === 'AGREED' || status === 'agreed') && agreedPrice && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Agents Successfully Converged!</span>
            </div>
            <p className="text-xl font-mono font-black text-emerald-950">
              ₹{agreedPrice.toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
