import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Sliders, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  UploadCloud, 
  CheckCircle2, 
  Loader2, 
  Link as LinkIcon 
} from 'lucide-react';
import api from '../services/api';

export const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

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
          navigate('/my-listings');
          return;
        }

        setTitle(p.title);
        setDescription(p.description);
        setPrice(p.price);
        setCondition(p.condition);
        setCategory(p.category);
        setLocation(p.location);
        setImages((p.images && p.images[0]) || '');
        setStatus(p.status);

        if (p.sellerAgentConfig) {
          setOpeningAsk(p.sellerAgentConfig.openingAsk || p.price);
          setPrivateMinPrice(p.sellerAgentConfig.privateMinPrice || Math.round(p.price * 0.85));
          setStyle(p.sellerAgentConfig.style || 'BALANCED');
          setMaxRounds(p.sellerAgentConfig.maxRounds || 5);
        } else {
          setOpeningAsk(p.price);
          setPrivateMinPrice(Math.round(p.price * 0.85));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB.');
      return;
    }

    setError('');
    setUploadingImage(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        setImages(res.data.url);
        setUploadSuccess(true);
      }
    } catch (err) {
      console.error('[Upload Error]:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload image to Cloudinary.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericPrice = Number(price);
    const numericAsk = Number(openingAsk);
    const numericFloor = Number(privateMinPrice);

    if (numericFloor <= 0) {
      setError('Floor price must be greater than zero');
      return;
    }

    if (numericFloor > numericAsk) {
      setError('Floor price cannot exceed opening ask');
      return;
    }

    if (numericAsk > numericPrice) {
      setError('Opening ask cannot exceed listing price');
      return;
    }

    setSaving(true);

    try {
      await api.put(`/products/${id}`, {
        title,
        description,
        price: numericPrice,
        condition,
        category,
        location,
        status,
        images: images ? [images] : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80']
      });

      await api.post(`/products/${id}/agent-config`, {
        openingAsk: numericAsk,
        privateMinPrice: numericFloor,
        style,
        maxRounds: Number(maxRounds)
      });

      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1">
          Edit Product Listing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Update listing description, photos, price, condition, or confidential Seller Agent limits.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Listing Details */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              Listing Details
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Used">Used</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 font-semibold transition-colors"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Photo Management */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Photo
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={images || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
                alt="Product preview"
                className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
              />

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  {uploadingImage ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading new image...</span>
                    </span>
                  ) : uploadSuccess ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Updated on Cloudinary CDN</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-600">Current Product Image</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 truncate max-w-sm">
                  {images || 'No custom image set'}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 transition-colors"
            />
          </div>
        </div>

        {/* Section 2: Seller Agent Settings */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Seller Agent Configuration
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Opening Ask *</label>
              <input
                type="number"
                value={openingAsk}
                onChange={(e) => setOpeningAsk(e.target.value)}
                required
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Private Floor *</label>
              <input
                type="number"
                value={privateMinPrice}
                onChange={(e) => setPrivateMinPrice(e.target.value)}
                required
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Strategy Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
              >
                <option value="FIRM">FIRM (Smaller concessions)</option>
                <option value="BALANCED">BALANCED (Moderate concessions)</option>
                <option value="FLEXIBLE">FLEXIBLE (Faster agreement)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Rounds</label>
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
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
          disabled={saving || uploadingImage}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
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

export default EditListingPage;
