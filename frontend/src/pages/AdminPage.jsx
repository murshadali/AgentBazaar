import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Package,
  Handshake,
  Bot,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Sliders
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
    setActionLoading(true);
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setNotification({ type: 'success', text: `User status changed to ${nextStatus}.` });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Failed to update user' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this listing? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/admin/products/${productId}`);
      setNotification({ type: 'success', text: 'Listing removed by administrator.' });
      fetchListings();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Failed to remove listing' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Administrator Command Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Marketplace health, user governance, autonomous engine audits, and listing moderation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {notification && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Sliders },
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'listings', label: `Listings (${listings.length})`, icon: Package },
            { id: 'deals', label: `Deals Audit (${deals.length})`, icon: Handshake },
            { id: 'reviews', label: `Flagged Reviews (${reviews.length})`, icon: Flag }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Total Users</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</div>
                <p className="text-[11px] text-slate-400 mt-1">Single buyer/seller role</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Active Listings</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.activeListings || 0} <span className="text-xs text-slate-400 font-normal">/ {stats?.totalProducts || 0} total</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Available for negotiation</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>Running Negotiations</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.runningNegotiations || 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Autonomous agent sessions</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Handshake className="w-4 h-4 text-blue-600" />
                  <span>Completed Deals</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.completedDeals || 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{stats?.confirmedDeals || 0} confirmed / {stats?.pendingDealApprovals || 0} pending</p>
              </div>
            </div>

            {/* Architecture and System Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autonomous Negotiation Protocol & Safety Status</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="font-bold text-slate-800 mb-1">Strict Limit Isolation</div>
                  <p className="text-slate-600">
                    Buyer budget ceiling and Seller minimum price are held in memory isolation. Prompts and API responses never leak counterparty thresholds.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="font-bold text-slate-800 mb-1">Dual Human Approval Gate</div>
                  <p className="text-slate-600">
                    Neither agent can finalize a deal. Agreement only reserves inventory; transaction confirms after both humans approve agreed price.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="font-bold text-slate-800 mb-1">Programmatic Guardrails</div>
                  <p className="text-slate-600">
                    Backend validates every AI action: price limits, non-reversing monotonic concessions, round ceilings, and sanitized responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">Registered Users Governance</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reputation</th>
                    <th className="py-3 px-4">Strategy</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter(
                      (u) =>
                        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-slate-400 text-[11px]">{u.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.city || 'Aligarh'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
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
                          ⭐ {Number(u.reputation?.averageRating || 5.0).toFixed(1)} ({u.reputation?.completedDeals || 0} deals)
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {u.defaultStyle || 'BALANCED'} ({u.defaultRounds || 5} rds)
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.role !== 'ADMIN' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleToggleUserStatus(u._id, u.status)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                u.status === 'ACTIVE'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Listings Moderation */}
        {activeTab === 'listings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">Marketplace Listings Moderation</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation</th>
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
                          <div className="font-semibold text-slate-900">{p.title}</div>
                          <div className="text-slate-400 text-[11px]">{p.condition} • {p.city || p.location}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{p.price?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.seller?.name || 'Seller'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'RESERVED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : p.status === 'SOLD'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status !== 'REMOVED' ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleRemoveProduct(p._id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Removed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Deals Audit */}
        {activeTab === 'deals' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Deals & Agreement Audit Trail</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Agreed Price</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Approvals</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {d.product?.title || 'Product Listing'}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">
                        ₹{d.finalPrice?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{d.buyer?.name || 'Buyer'}</td>
                      <td className="py-3 px-4 text-slate-600">{d.seller?.name || 'Seller'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        Buyer: {d.buyerApproval?.status || 'PENDING'} • Seller: {d.sellerApproval?.status || 'PENDING'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
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
          </div>
        )}

        {/* Tab 5: Flagged Reviews */}
        {activeTab === 'reviews' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Flagged Community Feedback</h2>
            {reviews.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span>Zero flagged reviews. Platform trust community is clean and compliant.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-slate-900">
                        Reviewer: {r.reviewer?.name} ➔ Reviewee: {r.reviewee?.name}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Flagged
                      </span>
                    </div>
                    <p className="text-slate-700 mb-1">"{r.comment}"</p>
                    <div className="text-[11px] text-slate-400">Rating: {r.rating} / 5 stars</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
