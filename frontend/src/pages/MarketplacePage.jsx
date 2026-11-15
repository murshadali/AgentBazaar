import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { NegotiationModal } from '../components/NegotiationModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const categories = [
  'All',
  'Electronics',
  'Mobiles',
  'Computers',
  'Books',
  'Furniture',
  'Vehicles',
  'Fashion',
  'Home Appliances',
  'Other'
];

export const MarketplacePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedProductForNegotiate, setSelectedProductForNegotiate] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedCondition !== 'All') params.condition = selectedCondition;
      if (location.trim()) params.location = location.trim();
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sort) params.sort = sort;

      const res = await api.get('/products', { params });
      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error('[MarketplacePage] Failed to fetch products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedCondition, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleNegotiateClick = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedProductForNegotiate(product);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Marketplace Listings
          </h1>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchProducts}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition-colors"
          title="Refresh listings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-8 shadow-xs space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by product title or description..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-Filters: Condition, Location, Price, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Condition</label>
            <select
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="All">All Conditions</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Location (City)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Aligarh"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Max Price (₹)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-slate-500">Loading marketplace listings...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Active Listings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try adjusting your search keywords, category pills, or price range filters.
          </p>
          <button
            onClick={() => {
              setKeyword('');
              setSelectedCategory('All');
              setSelectedCondition('All');
              setLocation('');
              setMinPrice('');
              setMaxPrice('');
              setPage(1);
            }}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                currentUserId={user?._id}
                onNegotiate={handleNegotiateClick}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-3 py-1 bg-white border border-slate-200 rounded-xl">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Negotiation Modal */}
      <NegotiationModal
        product={selectedProductForNegotiate}
        isOpen={!!selectedProductForNegotiate}
        onClose={() => setSelectedProductForNegotiate(null)}
      />
    </div>
  );
};
