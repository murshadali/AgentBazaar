import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Shield, Bot, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState(user?.city || 'Aligarh');
  const [imageUrl, setImageUrl] = useState('');

  // Seller Agent Settings (Section 7)
  const [openingAsk, setOpeningAsk] = useState('');
  const [privateMinPrice, setPrivateMinPrice] = useState('');
  const [style, setStyle] = useState(user?.defaultStyle || 'BALANCED');
  const [maxRounds, setMaxRounds] = useState(user?.defaultRounds || 5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePriceChange = (val) => {
    setPrice(val);
    if (!openingAsk) setOpeningAsk(val);
    if (!privateMinPrice) {
      setPrivateMinPrice(Math.round(Number(val) * 0.85).toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericPrice = Number(price);
    const numericAsk = openingAsk ? Number(openingAsk) : numericPrice;
    const numericFloor = privateMinPrice ? Number(privateMinPrice) : Math.round(numericPrice * 0.85);

    if (numericFloor <= 0) {
      setError('Private minimum acceptable price must be greater than zero.');
      return;
    }

    if (numericFloor > numericAsk) {
      setError('Minimum floor price cannot exceed opening ask.');
      return;
    }

    if (numericAsk > numericPrice) {
      setError('Opening ask cannot exceed the public listing price.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/products', {
        title,
        description,
        price: numericPrice,
        condition,
        category,
        location,
        images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'],
        openingAsk: numericAsk,
        privateMinPrice: numericFloor,
        style,
        maxRounds: Number(maxRounds)
      });

      navigate(`/products/${res.data.product._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
          Create Product Listing
        </h1>
        <p className="text-xs text-slate-500">
          List your pre-owned product and configure your autonomous Seller AI Agent parameters.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Product Basics */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Listing Details
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apple MacBook Air M2 256GB - Space Gray"
              required
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="Electronics">Electronics</option>
                <option value="Mobiles">Mobiles</option>
                <option value="Computers">Computers</option>
                <option value="Books">Books</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Fashion">Fashion</option>
                <option value="Home Appliances">Home Appliances</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Used">Used</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Public Asking Price (₹) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="45000"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pickup Location (City / Area) *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Civil Lines, Aligarh"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe product history, included accessories, physical condition, reason for selling..."
              required
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>
        </div>

        {/* Section 2: Seller Agent Settings (Section 7) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Autonomous Seller Agent Configuration
              </h2>
              <p className="text-[11px] text-slate-500">Autonomous haggle bounds strictly enforced by backend guardrails</p>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold text-indigo-950">Confidential Guardrail:</span> Your Minimum Floor Price is encrypted and never revealed to buyers. The Seller Agent will mathematically reject any counter-offer below your floor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Ask Price (₹) *
              </label>
              <input
                type="number"
                value={openingAsk}
                onChange={(e) => setOpeningAsk(e.target.value)}
                placeholder="44000"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Initial offer made by agent (≤ listed price)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Private Minimum Floor Price (₹) *
              </label>
              <input
                type="number"
                value={privateMinPrice}
                onChange={(e) => setPrivateMinPrice(e.target.value)}
                placeholder="38000"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Confidential lowest price you will accept</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Negotiation Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="FIRM">FIRM (Smaller concessions, protect price)</option>
                <option value="BALANCED">BALANCED (Moderate concessions)</option>
                <option value="FLEXIBLE">FLEXIBLE (Larger concessions to sell fast)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Negotiation Rounds
              </label>
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value={3}>3 Rounds (Fast)</option>
                <option value={5}>5 Rounds (Standard)</option>
                <option value={7}>7 Rounds (Extensive)</option>
                <option value={10}>10 Rounds (Maximum)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs sm:text-sm"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Publish Listing with Autonomous Seller Agent</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
