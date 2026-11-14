import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Shield, Bot, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Seller Agent Config
  const [openingAsk, setOpeningAsk] = useState('');
  const [privateMinPrice, setPrivateMinPrice] = useState('');
  const [style, setStyle] = useState('BALANCED');
  const [maxRounds, setMaxRounds] = useState(5);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data.product;
        if (!res.data.isOwner) {
          alert('You are not authorized to edit this listing');
          navigate('/');
          return;
        }

        setTitle(p.title || '');
        setDescription(p.description || '');
        setPrice(p.price || '');
        setCondition(p.condition || 'Good');
        setCategory(p.category || 'Electronics');
        setLocation(p.location || '');
        setImages((p.images && p.images[0]) || '');
        setStatus(p.status || 'ACTIVE');

        if (p.sellerAgentConfig) {
          setOpeningAsk(p.sellerAgentConfig.openingAsk || p.price);
          setPrivateMinPrice(p.sellerAgentConfig.privateMinPrice || '');
          setStyle(p.sellerAgentConfig.style || 'BALANCED');
          setMaxRounds(p.sellerAgentConfig.maxRounds || 5);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load listing for editing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const numericPrice = Number(price);

    try {
      await api.put(`/products/${id}`, {
        title,
        description,
        price: numericPrice,
        condition,
        category,
        location,
        images: images ? [images] : [],
        status
      });

      if (privateMinPrice) {
        await api.post(`/products/${id}/agent-config`, {
          openingAsk: openingAsk ? Number(openingAsk) : numericPrice,
          privateMinPrice: Number(privateMinPrice),
          style,
          maxRounds: Number(maxRounds)
        });
      }

      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel</span>
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
          Edit Product Listing
        </h1>
        <p className="text-xs text-slate-500">
          Update listing description, price, condition, or confidential Seller Agent limits.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Listing Overview
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="SOLD">SOLD</option>
                <option value="REMOVED">REMOVED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              value={images}
              onChange={(e) => setImages(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
            />
          </div>
        </div>

        {/* Section 2: Seller Agent Settings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Seller Agent Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Ask (₹)</label>
              <input
                type="number"
                value={openingAsk}
                onChange={(e) => setOpeningAsk(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Private Floor (₹)</label>
              <input
                type="number"
                value={privateMinPrice}
                onChange={(e) => setPrivateMinPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Strategy Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="FIRM">FIRM</option>
                <option value="BALANCED">BALANCED</option>
                <option value="FLEXIBLE">FLEXIBLE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Rounds</label>
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value={3}>3 Rounds</option>
                <option value={5}>5 Rounds</option>
                <option value={7}>7 Rounds</option>
                <option value={10}>10 Rounds</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs sm:text-sm"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Listing Changes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
