import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Bot, UserCheck, AlertCircle } from 'lucide-react';

const conditionBadgeStyles = {
  'New': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Like New': 'bg-teal-50 text-teal-700 border-teal-200',
  'Good': 'bg-blue-50 text-blue-700 border-blue-200',
  'Fair': 'bg-amber-50 text-amber-700 border-amber-200',
  'Used': 'bg-slate-100 text-slate-700 border-slate-200'
};

export const ProductCard = ({ product, onNegotiate, currentUserId }) => {
  const image = (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
  const sellerId = product.sellerId?._id || product.sellerId || product.seller?._id || product.seller;
  const isOwner = currentUserId && String(sellerId) === String(currentUserId);
  const sellerInfo = product.sellerId || product.seller || {};

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col group text-left">
      {/* Thumbnail */}
      <Link to={`/products/${product._id}`} className="relative h-48 w-full overflow-hidden bg-slate-100 block">
        <img
          src={image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-xs ${conditionBadgeStyles[product.condition] || 'bg-slate-100 text-slate-700'}`}>
            {product.condition}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200 shadow-xs backdrop-blur-xs">
            {product.category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{sellerInfo.reputation?.averageRating || '5.0'}</span>
            </div>
          </div>

          <Link to={`/products/${product._id}`}>
            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 hover:text-indigo-600 transition-colors mb-2">
              {product.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          {isOwner ? (
            <Link
              to={`/products/${product._id}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-semibold transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Your Listing</span>
            </Link>
          ) : product.hasSellerConfig === false ? (
            <button
              type="button"
              disabled
              title="Seller has not configured an AI Seller Agent for this listing yet."
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 py-2 px-3 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Negotiate Disabled</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNegotiate ? onNegotiate(product) : null}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-transparent py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Negotiate with AI</span>
            </button>
          )}

          <Link
            to={`/products/${product._id}`}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};
