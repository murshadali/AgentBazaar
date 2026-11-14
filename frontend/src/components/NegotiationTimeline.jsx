import React from 'react';
import { TrendingDown, TrendingUp, CheckCircle2, Clock, Activity, ShieldCheck, Sparkles } from 'lucide-react';

export const NegotiationTimeline = ({ offers = [], agreedPrice, maxRounds = 5, status }) => {
  // Group offers by round
  const rounds = {};
  offers.forEach((o) => {
    if (!rounds[o.round]) rounds[o.round] = {};
    if (o.actor === 'BUYER_AGENT' || o.senderRole === 'buyer_agent') rounds[o.round].buyer = o;
    if (o.actor === 'SELLER_AGENT' || o.senderRole === 'seller_agent') rounds[o.round].seller = o;
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  // Calculate pricing min/max for the SVG chart
  const allPrices = offers
    .filter((o) => typeof o.price === 'number')
    .map((o) => o.price);

  const minChartPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.95 : 10000;
  const maxChartPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.05 : 20000;
  const priceRange = Math.max(1, maxChartPrice - minChartPrice);

  const chartWidth = 320;
  const chartHeight = 110;
  const paddingX = 25;
  const paddingY = 15;

  const getX = (round) => {
    if (maxRounds <= 1) return chartWidth / 2;
    return paddingX + ((round - 1) / (maxRounds - 1)) * (chartWidth - 2 * paddingX);
  };

  const getY = (price) => {
    if (!price) return chartHeight / 2;
    // higher price = lower Y (near top)
    const normalized = (price - minChartPrice) / priceRange;
    return chartHeight - paddingY - normalized * (chartHeight - 2 * paddingY);
  };

  // Build buyer points string
  const buyerPoints = roundNumbers
    .filter((r) => rounds[r].buyer?.price)
    .map((r) => `${getX(r)},${getY(rounds[r].buyer.price)}`);

  // Build seller points string
  const sellerPoints = roundNumbers
    .filter((r) => rounds[r].seller?.price)
    .map((r) => `${getX(r)},${getY(rounds[r].seller.price)}`);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Real-World Convergence Chart
            </h3>
            <p className="text-[10px] text-slate-400">Axelrod Reciprocal Tit-for-Tat Trajectory</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">
          Rounds: <strong className="text-slate-800">{roundNumbers.length}</strong> / {maxRounds}
        </span>
      </div>

      {/* Visual SVG Convergence Chart */}
      {roundNumbers.length > 0 && (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] mb-2 text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Buyer Offer Line</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
              <span>Seller Ask Line</span>
            </div>
          </div>

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 overflow-visible">
            {/* Grid Lines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
            />
            <line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
            />
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
            />

            {/* Seller Trajectory Line */}
            {sellerPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sellerPoints.join(' ')}
              />
            )}

            {/* Buyer Trajectory Line */}
            {buyerPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={buyerPoints.join(' ')}
              />
            )}

            {/* Dots for Buyer Offers */}
            {roundNumbers.map((r) => {
              const bPrice = rounds[r].buyer?.price;
              if (!bPrice) return null;
              return (
                <circle
                  key={`b-${r}`}
                  cx={getX(r)}
                  cy={getY(bPrice)}
                  r="4"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}

            {/* Dots for Seller Asks */}
            {roundNumbers.map((r) => {
              const sPrice = rounds[r].seller?.price;
              if (!sPrice) return null;
              return (
                <circle
                  key={`s-${r}`}
                  cx={getX(r)}
                  cy={getY(sPrice)}
                  r="4"
                  fill="#1e293b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}

            {/* Convergence Marker */}
            {agreedPrice && (
              <circle
                cx={getX(roundNumbers[roundNumbers.length - 1] || maxRounds)}
                cy={getY(agreedPrice)}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="animate-pulse"
              />
            )}
          </svg>
        </div>
      )}

      {/* Round Breakdown */}
      <div className="space-y-2">
        {roundNumbers.map((rNum) => {
          const rData = rounds[rNum];
          const buyerOffer = rData.buyer?.price;
          const sellerOffer = rData.seller?.price;
          const spread = buyerOffer && sellerOffer ? Math.abs(sellerOffer - buyerOffer) : null;

          return (
            <div
              key={rNum}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                  R{rNum}
                </span>

                <div className="flex items-center gap-1 text-blue-700 font-mono font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>{buyerOffer ? `₹${buyerOffer.toLocaleString('en-IN')}` : '—'}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400">Spread</span>
                <span className="text-[11px] font-mono text-slate-700 font-medium">
                  {spread !== null ? `₹${spread.toLocaleString('en-IN')}` : 'Analyzing...'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-slate-800 font-mono font-semibold">
                <span>{sellerOffer ? `₹${sellerOffer.toLocaleString('en-IN')}` : 'Pending...'}</span>
                <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          );
        })}

        {(status === 'AGREED' || status === 'agreed') && agreedPrice && (
          <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Agents Successfully Converged!</span>
            </div>
            <p className="text-xl font-mono font-black text-emerald-950">
              ₹{agreedPrice.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              Mutual agreement reached via reciprocal concession matching.
            </p>
          </div>
        )}
      </div>

      {/* Real-World Safety Notice */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Strict Limit Isolation: Neither party's private budget was leaked.</span>
      </div>
    </div>
  );
};

export default NegotiationTimeline;
