import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageSquareCode,
  Handshake,
  CheckCircle2,
  Clock,
  PlusCircle,
  Search,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/users/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('[DashboardPage] Failed to fetch stats:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalListings: 0,
    activeListings: 0,
    runningNegotiations: 0,
    pendingDealApprovals: 0,
    confirmedDeals: 0,
    completedDeals: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/create-listing"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Listing</span>
          </Link>
          <Link
            to="/marketplace"
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>

      {/* 6 Metric Stat Cards (Section 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Listings</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {stats.totalListings}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Created by you</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Active Listings</span>
          <span className="text-2xl font-black text-indigo-600 font-mono mt-1 block">
            {stats.activeListings}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Visible to buyers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Running Negs</span>
          <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
            {stats.runningNegotiations}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Active AI sessions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Pending Approvals</span>
          <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
            {stats.pendingDealApprovals}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting consent</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Confirmed Deals</span>
          <span className="text-2xl font-black text-purple-600 font-mono mt-1 block">
            {stats.confirmedDeals}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Ready for pickup</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Completed Deals</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
            {stats.completedDeals}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Handover finished</span>
        </div>
      </div>

      {/* Pending Approvals Alert Banner */}
      {data?.pendingApprovals?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>You Have Deals Requiring Your Review & Approval!</span>
            </div>
            <Link to="/deals" className="text-xs font-bold text-amber-800 hover:underline">
              View All Deals →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.pendingApprovals.map((deal) => (
              <div key={deal._id} className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900 line-clamp-1">{deal.productId?.title}</p>
                  <p className="text-slate-500 text-[11px]">Agreed: <strong className="text-emerald-700 font-mono">₹{deal.agreedPrice?.toLocaleString('en-IN')}</strong></p>
                </div>
                <Link
                  to="/deals"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shrink-0"
                >
                  Review Deal
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Negotiations & Recent Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Negotiations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquareCode className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent AI Negotiations
              </h2>
            </div>
            <Link to="/negotiations" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          {!data?.recentNegotiations?.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent negotiations.</p>
          ) : (
            <div className="space-y-3">
              {data.recentNegotiations.map((neg) => {
                const isBuyer = String(neg.buyerId?._id) === String(user?._id);
                return (
                  <div key={neg._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={(neg.productId?.images && neg.productId.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
                        alt="item"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{neg.productId?.title}</p>
                        <p className="text-slate-500 text-[11px]">
                          Role: <strong className="text-indigo-600 capitalize">{isBuyer ? 'Buyer' : 'Seller'}</strong> • Round {neg.currentRound}/{neg.maxRounds}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/negotiations/${neg._id}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 font-semibold text-[11px] shrink-0"
                    >
                      Arena →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Recent Listings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                My Recent Listings
              </h2>
            </div>
            <Link to="/my-listings" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage All
            </Link>
          </div>

          {!data?.recentListings?.length ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400">You haven't listed any items yet.</p>
              <Link to="/create-listing" className="inline-block text-xs font-bold text-indigo-600 hover:underline">
                + Create your first listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentListings.map((p) => (
                <div key={p._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
                      alt="item"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                      <p className="text-slate-500 text-[11px]">
                        Price: <strong className="font-mono text-slate-800">₹{p.price.toLocaleString('en-IN')}</strong> • Status: <span className="font-semibold text-indigo-600">{p.status}</span>
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/products/${p._id}`}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 font-semibold text-[11px] shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
