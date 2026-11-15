import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Handshake,
  ShieldCheck,
  Calendar,
  ArrowLeft,
  Lock,
  Trash2,
  Edit,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NegotiationModal } from '../components/NegotiationModal';

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
        setIsOwner(res.data.isOwner);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, user]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      navigate('/my-listings');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-rose-600 text-sm mb-4">{error || 'Product not found'}</p>
        <Link to="/marketplace" className="text-indigo-600 hover:underline text-xs font-semibold">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'];

  const sellerInfo = product.sellerId || product.seller || {};
  const isAvailable = product.status === 'ACTIVE';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery & Description */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo */}
          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            <img
              src={images[selectedImage]}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-indigo-700 border border-indigo-200 shadow-xs backdrop-blur-xs">
                {product.condition}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-slate-800 border border-slate-200 shadow-xs backdrop-blur-xs">
                {product.category}
              </span>
            </div>
            {product.status !== 'ACTIVE' && (
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
                Status: {product.status}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === idx ? 'border-indigo-600 scale-105 shadow-xs' : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Product Overview & Specifications
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>

        {/* Right Column: Pricing, Seller Strategy, Seller Reputation, CTAs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{product.location}</span>
                <span className="mx-1">•</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Listed {new Date(product.createdAt).toLocaleDateString()}</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 leading-snug mb-3">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-medium">Public Asking Price</span>
              </div>
            </div>

            {/* OWNER VIEW: Private Seller Strategy & Controls */}
            {isOwner && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Lock className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Your Confidential Seller Strategy</span>
                  </div>
                  <Link
                    to={`/my-listings`}
                    className="text-[11px] font-bold text-indigo-700 hover:underline"
                  >
                    Configure
                  </Link>
                </div>

                {product.sellerAgentConfig ? (
                  <div className="text-xs text-slate-700 space-y-1 font-mono">
                    <p>Opening Ask: <strong className="text-slate-900">₹{product.sellerAgentConfig.openingAsk?.toLocaleString('en-IN')}</strong></p>
                    <p>Private Floor: <strong className="text-indigo-800">₹{product.sellerAgentConfig.privateMinPrice?.toLocaleString('en-IN')}</strong></p>
                    <p>Style: <strong className="text-slate-900 capitalize">{product.sellerAgentConfig.style}</strong></p>
                    <p>Max Rounds: <strong className="text-slate-900">{product.sellerAgentConfig.maxRounds}</strong></p>
                  </div>
                ) : (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <p className="font-semibold">Seller Agent Not Configured</p>
                    <p className="text-[11px] mt-0.5">Configure your floor price in My Listings to enable buyers to negotiate.</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-indigo-200/80">
                  <Link
                    to={`/edit-listing/${product._id}`}
                    className="text-xs text-slate-700 hover:text-indigo-700 flex items-center gap-1 font-semibold"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Listing</span>
                  </Link>

                  <button
                    onClick={handleDelete}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}

            {/* BUYER VIEW: Start Negotiation Action */}
            {!isOwner && (
              <div className="space-y-3">
                {!isAvailable ? (
                  <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>This listing is currently {product.status.toLowerCase()} and cannot be negotiated.</span>
                  </div>
                ) : !product.hasSellerConfig ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Negotiation Currently Unavailable</span>
                    </p>
                    <p className="text-[11px] text-amber-700">
                      The seller has listed this product at ₹{product.price.toLocaleString('en-IN')} but has not yet activated their AI Seller Agent.
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) navigate('/login');
                        else setNegotiateModalOpen(true);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                    >
                      <Handshake className="w-5 h-5" />
                      <span>Make an Offer</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-500">
                      Private budget bounds. No deal finalized without your dual approval.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Seller Reputation Info */}
            <div className="pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Seller Information & Reputation
              </h4>
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-base font-bold text-indigo-700">
                  {sellerInfo.photo ? (
                    <img src={sellerInfo.photo} alt={sellerInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    sellerInfo.name?.charAt(0) || 'S'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {sellerInfo.name}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{sellerInfo.reputation?.averageRating || '5.0'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {sellerInfo.bio || 'Marketplace Member'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                    <span>{sellerInfo.reputation?.completedDeals || 0} Deals Completed</span>
                    <span>•</span>
                    <span>{sellerInfo.reputation?.totalReviews || 0} Reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Modal */}
      <NegotiationModal
        product={product}
        isOpen={negotiateModalOpen}
        onClose={() => setNegotiateModalOpen(false)}
      />
    </div>
  );
};
