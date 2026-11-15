import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Shield, 
  Sliders, 
  AlertCircle, 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  Loader2, 
  Link as LinkIcon 
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState(user?.city || 'Aligarh');
  const [imageUrl, setImageUrl] = useState('');

  // Image Upload State
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Seller Agent Settings
  const [openingAsk, setOpeningAsk] = useState('');
  const [privateMinPrice, setPrivateMinPrice] = useState('');
  const [style, setStyle] = useState(user?.defaultStyle || 'BALANCED');
  const [maxRounds, setMaxRounds] = useState(user?.defaultRounds || 5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);

  const handlePriceChange = (val) => {
    setPrice(val);
    if (!openingAsk) setOpeningAsk(val);
    if (!privateMinPrice && val) {
      setPrivateMinPrice(Math.round(Number(val) * 0.85).toString());
    }
  };

  // Cloudinary File Upload Handler
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

    // Show instant local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.url) {
        setImageUrl(res.data.url);
        setImagePreview(res.data.url);
        setUploadSuccess(true);
      } else {
        throw new Error('No URL returned from upload server');
      }
    } catch (err) {
      console.error('[Upload Error]:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload image to Cloudinary.');
      // Keep local preview if available or revert
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview('');
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (uploadingImage) {
      setError('Please wait until your product photo finishes uploading to Cloudinary.');
      return;
    }

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

    isSubmittingRef.current = true;
    setLoading(true);

    const finalImage = imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

    try {
      const res = await api.post('/products', {
        title,
        description,
        price: numericPrice,
        condition,
        category,
        location,
        images: [finalImage],
        openingAsk: numericAsk,
        privateMinPrice: numericFloor,
        style,
        maxRounds: Number(maxRounds)
      });

      navigate(`/products/${res.data.product._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product listing. Please check the fields and try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const calculatedMargin = openingAsk && privateMinPrice 
    ? Math.max(0, Number(openingAsk) - Number(privateMinPrice))
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
          Post New Product Listing
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: Product Details */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              Product Information
            </h2>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apple MacBook Air M2 256GB - Space Gray"
              required
              className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 transition-colors"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Item Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
              >
                <option value="New">New (Unopened / Box Packed)</option>
                <option value="Like New">Like New (Barely used, mint condition)</option>
                <option value="Good">Good (Minor cosmetic wear, fully functional)</option>
                <option value="Fair">Fair (Noticeable wear, functions properly)</option>
                <option value="Used">Used (Well-loved, working)</option>
              </select>
            </div>
          </div>

          {/* Asking Price & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Public Asking Price *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="45000"
                  required
                  min="1"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs sm:text-sm text-slate-900 font-mono transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pickup Location (City / Area) *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Civil Lines, Aligarh"
                required
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Product Image Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Photo *
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50/70 bg-slate-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                  Click to choose a photo or drag & drop here
                </p>
                <p className="text-[11px] text-slate-400">
                  PNG, JPG, JPEG, WEBP up to 10MB • Automatically optimized by Cloudinary CDN
                </p>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-2xl p-3 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-28 h-28 object-cover rounded-xl border border-slate-200 shrink-0"
                />

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    {uploadingImage ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading to Cloudinary...</span>
                      </span>
                    ) : uploadSuccess ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Uploaded to Cloudinary CDN</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-600">Local Image Selected</span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 truncate max-w-sm">
                    {imageUrl || 'Preparing permanent cloud hosting...'}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Change Photo
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe product history, included accessories, physical condition, reason for selling..."
              required
              className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 transition-colors"
            />
          </div>
        </div>

        {/* SECTION 2: Seller Agent Strategy */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Autonomous Seller Agent Configuration
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Opening Ask Price *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={openingAsk}
                  onChange={(e) => setOpeningAsk(e.target.value)}
                  placeholder="44000"
                  required
                  min="1"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs sm:text-sm text-slate-900 font-mono transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Starting counter-offer made by agent (≤ listed price)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Private Minimum Floor Price *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={privateMinPrice}
                  onChange={(e) => setPrivateMinPrice(e.target.value)}
                  placeholder="38000"
                  required
                  min="1"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs sm:text-sm text-slate-900 font-mono transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Confidential lowest price you will accept</p>
            </div>
          </div>

          {/* Dynamic AI Negotiation Margin pill */}
          {calculatedMargin > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-700">
              <span>Agent Negotiation Flexibility Margin:</span>
              <span className="font-mono font-bold text-indigo-700">₹{calculatedMargin.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Negotiation Strategy Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
              >
                <option value="FIRM">FIRM (Smaller concessions, protects higher margin)</option>
                <option value="BALANCED">BALANCED (Standard concession curve)</option>
                <option value="FLEXIBLE">FLEXIBLE (Faster agreement, sells quicker)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Max Negotiation Rounds
              </label>
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 transition-colors"
              >
                <option value={3}>3 Rounds (Fast negotiation)</option>
                <option value={5}>5 Rounds (Standard)</option>
                <option value={7}>7 Rounds (Extensive haggling)</option>
                <option value={10}>10 Rounds (Maximum dialogue)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing Listing...</span>
            </>
          ) : (
            <span>Publish Product Listing</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateListingPage;
