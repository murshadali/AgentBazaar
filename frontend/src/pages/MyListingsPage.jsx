import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, PlusCircle, Edit, Trash2, Shield, Eye, AlertCircle, Sliders, Settings2 } from 'lucide-react';
import api from '../services/api';

export const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick configure modal state
  const [configModalProduct, setConfigModalProduct] = useState(null);
  const [openingAsk, setOpeningAsk] = useState('');
  const [privateMinPrice, setPrivateMinPrice] = useState('');
  const [style, setStyle] = useState('BALANCED');
  const [maxRounds, setMaxRounds] = useState(5);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState('');

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/my-listings');
      setListings(res.data.products || []);
    } catch (err) {
      console.error('[MyListings] Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchMyListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const openConfigModal = (product) => {
    setConfigModalProduct(product);
    setOpeningAsk(product.sellerAgentConfig?.openingAsk || product.price);
    setPrivateMinPrice(product.sellerAgentConfig?.privateMinPrice || Math.round(product.price * 0.85));
    setStyle(product.sellerAgentConfig?.style || 'BALANCED');
    setMaxRounds(product.sellerAgentConfig?.maxRounds || 5);
    setConfigError('');
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigError('');

    try {
      await api.post(`/products/${configModalProduct._id}/agent-config`, {
        openingAsk: Number(openingAsk),
        privateMinPrice: Number(privateMinPrice),
        style,
        maxRounds: Number(maxRounds)
      });
      setConfigModalProduct(null);
      fetchMyListings();
    } catch (err) {
      setConfigError(err.response?.data?.message || 'Failed to update agent config');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Products
          </h1>
        </div>

        <Link
          to="/create-listing"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Listing</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Listings Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            You haven't posted any second-hand items for resale. Create your first listing to start accepting autonomous AI negotiations.
          </p>
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post First Listing</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {listings.map((p) => {
              const image = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
              const hasConfig = p.hasSellerConfig;

              return (
                <div key={p._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <img
                      src={image}
                      alt={p.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.status === 'RESERVED'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : p.status === 'SOLD'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {p.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{p.category}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.title}</h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Price: <strong className="font-mono text-slate-900">₹{p.price.toLocaleString('en-IN')}</strong></span>
                        <span>•</span>
                        <span>Condition: <strong>{p.condition}</strong></span>
                        <span>•</span>
                        <span>{p.location}</span>
                      </div>

                      {/* Seller Agent Config Tag */}
                      <div className="mt-2 flex items-center gap-2">
                        {hasConfig ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            <span>Floor: ₹{p.sellerAgentConfig?.privateMinPrice?.toLocaleString('en-IN')} ({p.sellerAgentConfig?.style})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Price Strategy Not Set</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => openConfigModal(p)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-indigo-700 bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Configure seller agent parameters"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configure Agent</span>
                    </button>

                    <Link
                      to={`/products/${p._id}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-slate-300"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <Link
                      to={`/edit-listing/${p._id}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-slate-300"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                      title="Remove Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seller Agent Config Modal */}
      {configModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Configure Seller Agent
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              <strong className="text-slate-800">{configModalProduct.title}</strong>
            </p>

            {configError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {configError}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Ask Price (₹) *
                </label>
                <input
                  type="number"
                  value={openingAsk}
                  onChange={(e) => setOpeningAsk(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Starting counter-offer price (≤ listing price)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Private Minimum Floor Price (₹) *
                </label>
                <input
                  type="number"
                  value={privateMinPrice}
                  onChange={(e) => setPrivateMinPrice(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Confidential floor price</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strategy Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800"
                  >
                    <option value={3}>3 Rounds</option>
                    <option value={5}>5 Rounds</option>
                    <option value={7}>7 Rounds</option>
                    <option value={10}>10 Rounds</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfigModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
                >
                  {savingConfig ? 'Saving...' : 'Save Agent Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
