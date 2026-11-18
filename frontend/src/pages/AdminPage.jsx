import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  Handshake,
  MessageSquare,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  ExternalLink,
  Trash2,
  Sliders,
  Star,
  MapPin,
  Eye,
  X,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, listings, deals, reviews
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [deals, setDeals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [inspectingDeal, setInspectingDeal] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('[Admin] Failed to fetch stats:', err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('[Admin] Failed to fetch users:', err.message);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await api.get('/admin/products');
      setListings(res.data.products || []);
    } catch (err) {
      console.error('[Admin] Failed to fetch listings:', err.message);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await api.get('/admin/deals');
      setDeals(res.data.deals || []);
    } catch (err) {
      console.error('[Admin] Failed to fetch deals:', err.message);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get('/admin/reviews/flagged');
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('[Admin] Failed to fetch flagged reviews:', err.message);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchListings(), fetchDeals(), fetchReviews()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change this user status to ${nextStatus}?`)) return;

    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setNotification({ type: 'success', text: `User account is now ${nextStatus}.` });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Failed to update user' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this listing? It will no longer be visible on the marketplace.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/admin/products/${productId}`);
      setNotification({ type: 'success', text: 'Listing removed from marketplace.' });
      fetchListings();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Failed to remove listing' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReview = async (reviewId) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/reviews/${reviewId}/dismiss`);
      setNotification({ type: 'success', text: 'Review flag dismissed. Marked compliant.' });
      fetchReviews();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Failed to dismiss flag' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this abusive review? User reputation will be recalculated.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setNotification({ type: 'success', text: 'Abusive review deleted successfully.' });
      fetchReviews();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Failed to delete review' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6">
        {/* Header without icon, without subtitle paragraph, without supervisor mode badge */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAll}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold border border-slate-200 bg-white shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Sliders, badge: null },
            { id: 'users', label: 'Users', icon: Users, badge: users.length },
            { id: 'listings', label: 'Listings', icon: Package, badge: listings.length },
            { id: 'deals', label: 'Deals', icon: Handshake, badge: deals.length },
            { id: 'reviews', label: 'Flagged Reviews', icon: Flag, badge: reviews.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Core Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Total Users</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</div>
                <p className="text-[11px] text-slate-400 mt-1">Registered members</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Active Listings</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.activeListings || 0}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {stats?.totalProducts || 0}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Live in marketplace</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span>Negotiations</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.runningNegotiations || 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Ongoing dialogues</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Handshake className="w-4 h-4 text-indigo-600" />
                  <span>Completed Deals</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.completedDeals || 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {stats?.confirmedDeals || 0} confirmed / {stats?.pendingDealApprovals || 0} pending
                </p>
              </div>
            </div>

            {/* Dashboard Content: Recent Deals & Platform Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Deals Table (2 Columns) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Deals Activity</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Latest finalized price agreements across buyers and sellers</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('deals')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>View All Deals</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {deals.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No deals finalized yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Agreed Price</th>
                          <th className="py-3 px-4">Parties</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deals.slice(0, 5).map((d) => (
                          <tr key={d._id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 line-clamp-1">
                                {d.product?.title || 'Product Listing'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-indigo-700">
                              ₹{(d.agreedPrice || d.finalPrice || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              <div>{d.buyer?.name || 'Buyer'} (B)</div>
                              <div>{d.seller?.name || 'Seller'} (S)</div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  d.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : d.status === 'CONFIRMED'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : d.status === 'PENDING_APPROVAL'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Platform Distribution & Quick Overview (1 Column) */}
              <div className="space-y-6">
                {/* Listings Breakdown */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Marketplace Inventory</h3>
                    <button
                      onClick={() => setActiveTab('listings')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Active Available Listings</span>
                      <strong className="text-emerald-700 font-bold">{stats?.activeListings || 0}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Under Negotiation / Reserved</span>
                      <strong className="text-amber-700 font-bold">
                        {listings.filter((p) => p.status === 'RESERVED').length}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Sold Items</span>
                      <strong className="text-indigo-700 font-bold">
                        {listings.filter((p) => p.status === 'SOLD').length}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Moderated / Removed</span>
                      <strong className="text-rose-700 font-bold">
                        {listings.filter((p) => p.status === 'REMOVED').length}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Community Moderation Status */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Community Trust</h3>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Inspect
                    </button>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-rose-600 shrink-0" />
                        <span><strong>{reviews.length}</strong> flagged review(s) pending review</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px]"
                      >
                        Review
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Zero flagged reviews. Feedback community is clean.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: USERS ================= */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Users</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage registered user accounts and access permissions.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reputation</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter(
                      (u) =>
                        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.city?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.name}</div>
                              <div className="text-slate-400 text-[11px]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.city || 'Aligarh'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                            <span className="font-semibold">{Number(u.reputation?.averageRating || 5.0).toFixed(1)}</span>
                            <span className="text-slate-400 text-[11px]">({u.reputation?.completedDeals || 0} deals)</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.role !== 'ADMIN' ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleToggleUserStatus(u._id, u.status)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors ${
                                u.status === 'ACTIVE'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">Administrator</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: LISTINGS MODERATION ================= */}
        {activeTab === 'listings' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Listing Moderation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Supervise active marketplace listings and take down policy-violating products.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by title or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings
                    .filter(
                      (p) =>
                        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.images && p.images[0] ? (
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/products/${p._id}`}
                                className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                              >
                                {p.title}
                              </Link>
                              <div className="text-slate-400 text-[11px]">
                                {p.condition} • {p.city || p.location || 'Aligarh'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{p.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{p.price?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="font-medium">{p.seller?.name || 'Seller'}</div>
                          <div className="text-[10px] text-slate-400">{p.seller?.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'RESERVED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : p.status === 'SOLD'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/products/${p._id}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {p.status !== 'REMOVED' ? (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleRemoveProduct(p._id)}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Taken Down</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: DEALS ================= */}
        {activeTab === 'deals' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Deals Supervision</h2>
                <p className="text-xs text-slate-500 mt-0.5">Audit finalized agreements, verify dual approvals, and supervise handovers.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Agreed Price</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Dual Human Approvals</th>
                    <th className="py-3 px-4">Deal Status</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{d.product?.title || 'Marketplace Item'}</div>
                        <div className="text-slate-400 text-[11px]">ID: {d._id?.slice(-6)}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700 text-sm">
                        ₹{(d.agreedPrice || d.finalPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{d.buyer?.name || 'Buyer'}</div>
                        <div className="text-[10px] text-slate-400">{d.buyer?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{d.seller?.name || 'Seller'}</div>
                        <div className="text-[10px] text-slate-400">{d.seller?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {(() => {
                          const isBuyerAppr = d.buyerApproval?.status === 'APPROVED' || d.buyerApproval?.approved === true || d.status === 'CONFIRMED' || d.status === 'COMPLETED';
                          const isSellerAppr = d.sellerApproval?.status === 'APPROVED' || d.sellerApproval?.approved === true || d.status === 'CONFIRMED' || d.status === 'COMPLETED';
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded font-bold ${isBuyerAppr ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                Buyer: {isBuyerAppr ? 'Approved' : 'Pending'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${isSellerAppr ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                Seller: {isSellerAppr ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === 'CONFIRMED'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : d.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectingDeal(d)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: FLAGGED REVIEWS ================= */}
        {activeTab === 'reviews' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Flagged Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">Inspect reported reviews, dismiss false reports, or purge abusive comments.</p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 text-sm">Community Feedback Clean</p>
                <p className="text-slate-400 mt-0.5">There are no flagged or reported user reviews pending moderation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div key={r._id} className="p-5 rounded-2xl border border-rose-200 bg-rose-50/20 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{r.reviewer?.name || 'Reviewer'}</span>
                        <span className="text-slate-400">➔</span>
                        <span>{r.reviewee?.name || 'Reviewee'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        <span>Reported</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 italic">
                      "{r.comment}"
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 font-semibold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{r.rating} / 5</span>
                      </div>
                      <div>
                        Reason: <strong className="text-rose-700">{r.flagReason || 'Policy Violation'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleDismissReview(r._id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
                      >
                        Dismiss Flag (Keep)
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleDeleteReview(r._id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Review</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= DEAL INSPECTION MODAL ================= */}
        {inspectingDeal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Deal Inspection & Handover Audit</h3>
                <button
                  onClick={() => setInspectingDeal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                  <div className="text-xs text-indigo-900 font-bold">{inspectingDeal.product?.title || 'Product Listing'}</div>
                  <div className="text-sm font-black text-indigo-700">
                    Agreed Price: ₹{(inspectingDeal.agreedPrice || inspectingDeal.finalPrice || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="font-bold text-slate-700">Buyer</span>
                    <p className="font-semibold text-slate-900 mt-1">{inspectingDeal.buyer?.name}</p>
                    <p className="text-[11px] text-slate-500">{inspectingDeal.buyer?.email}</p>
                    <p className="text-[11px] text-slate-500">{inspectingDeal.buyer?.phone || 'No phone'}</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="font-bold text-slate-700">Seller</span>
                    <p className="font-semibold text-slate-900 mt-1">{inspectingDeal.seller?.name}</p>
                    <p className="text-[11px] text-slate-500">{inspectingDeal.seller?.email}</p>
                    <p className="text-[11px] text-slate-500">{inspectingDeal.seller?.phone || 'No phone'}</p>
                  </div>
                </div>

                {/* Handover Details */}
                {(() => {
                  const handoverInfo = inspectingDeal.handover || inspectingDeal.handoverDetails;
                  return (
                    <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span>Physical Handover Details</span>
                      </span>
                      {handoverInfo ? (
                        <div className="space-y-1 text-slate-600 text-[11px]">
                          <p>Location: <strong className="text-slate-800">{handoverInfo.location || handoverInfo.meetingLocation || inspectingDeal.product?.location || 'Flexible (In-person)'}</strong></p>
                          <p>Meeting Time: <strong className="text-slate-800">{handoverInfo.timeWindow || (handoverInfo.scheduledDate ? new Date(handoverInfo.scheduledDate).toLocaleString() : 'Flexible')}</strong></p>
                          <p>Contact Phone: <strong className="text-indigo-700 font-mono">{handoverInfo.contactNumber || inspectingDeal.seller?.phone || inspectingDeal.buyer?.phone || 'Provided upon deal confirmation'}</strong></p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-[11px]">Handover coordination pending buyer/seller scheduling.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Approvals */}
                {(() => {
                  const isBuyerAppr = inspectingDeal.buyerApproval?.status === 'APPROVED' || inspectingDeal.buyerApproval?.approved === true || inspectingDeal.status === 'CONFIRMED' || inspectingDeal.status === 'COMPLETED';
                  const isSellerAppr = inspectingDeal.sellerApproval?.status === 'APPROVED' || inspectingDeal.sellerApproval?.approved === true || inspectingDeal.status === 'CONFIRMED' || inspectingDeal.status === 'COMPLETED';
                  return (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                      <span>Buyer Approved: <strong className={isBuyerAppr ? 'text-emerald-700' : 'text-slate-700'}>{isBuyerAppr ? 'Yes' : 'No'}</strong></span>
                      <span>Seller Approved: <strong className={isSellerAppr ? 'text-emerald-700' : 'text-slate-700'}>{isSellerAppr ? 'Yes' : 'No'}</strong></span>
                      <span>Deal Status: <strong className="text-indigo-600 uppercase">{inspectingDeal.status}</strong></span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInspectingDeal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;