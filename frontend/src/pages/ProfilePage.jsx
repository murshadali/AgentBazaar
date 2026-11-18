import React, { useState, useEffect } from 'react';
import {
  User,
  Star,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  Sliders,
  Award,
  Sparkles,
  MessageSquare,
  Flag,
  X,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reportingReview, setReportingReview] = useState(null); // Review object being reported
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || user?.location || 'Aligarh',
    bio: user?.bio || 'P2P resale marketplace buyer and seller',
    defaultStyle: user?.defaultStyle || 'BALANCED',
    defaultRounds: user?.defaultRounds || 5
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || user.location || 'Aligarh',
        bio: user.bio || 'P2P resale marketplace buyer and seller',
        defaultStyle: user.defaultStyle || 'BALANCED',
        defaultRounds: user.defaultRounds || 5
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      const fetchReviews = async () => {
        try {
          const res = await api.get(`/reviews/user/${user._id}`);
          setReviews(res.data.reviews || []);
        } catch (err) {
          console.error('[Profile] Failed to fetch reviews:', err.message);
        } finally {
          setLoadingReviews(false);
        }
      };

      fetchReviews();
    }
  }, [user?._id]);

  const handleOpenReportModal = (rev) => {
    setReportingReview(rev);
    setReportReason('');
    setReportError('');
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportReason || !reportReason.trim()) {
      setReportError('Please provide a reason for reporting.');
      return;
    }

    setReportSubmitting(true);
    setReportError('');
    try {
      await api.post(`/reviews/${reportingReview._id}/flag`, { reason: reportReason.trim() });
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reportingReview._id ? { ...r, flagged: true, flagReason: reportReason.trim() } : r
        )
      );
      setMessage({ type: 'success', text: 'Review has been reported to the administrator for moderation.' });
      setReportingReview(null);
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateProfile(formData);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile and negotiation preferences saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const getStyleDescription = (style) => {
    switch (style) {
      case 'FIRM':
        return 'Small concessions. Strongly defends your target or opening price.';
      case 'BALANCED':
        return 'Moderate, steady concessions. Balances target price with deal closing probability.';
      case 'FLEXIBLE':
        return 'Accelerated concessions. Prioritizes quick convergence and high completion rate.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6">
        {message.text && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {user?.role || 'USER'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Member
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {user?.city || 'Aligarh'}
                  </span>
                  {user?.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {user?.phone}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2">{user?.bio}</p>
              </div>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing ? (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Edit Profile & Autonomous Agent Defaults</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Immutable)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Bio</label>
                <textarea
                  rows="2"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>

            {/* Negotiation Defaults */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Default Negotiation Style</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {['FIRM', 'BALANCED', 'FLEXIBLE'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultStyle: style })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.defaultStyle === style
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-800">{style}</div>
                    <div className="text-xs text-slate-500 mt-1">{getStyleDescription(style)}</div>
                  </button>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Default Maximum Negotiation Rounds: <span className="text-blue-600 font-bold">{formData.defaultRounds}</span>
                  </label>
                  <span className="text-xs text-slate-400">1 to 10 rounds</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.defaultRounds}
                  onChange={(e) => setFormData({ ...formData, defaultRounds: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Reputation and Performance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Average Rating</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {Number(user?.reputation?.averageRating || 5.0).toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">From {user?.reputation?.totalReviews || 0} peer review(s)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Completed Deals</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {user?.reputation?.completedDeals || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Successfully handed over</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Negotiation Style</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {user?.defaultStyle || 'BALANCED'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Max {user?.defaultRounds || 5} rounds per session</p>
          </div>
        </div>

        {/* User Reviews */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Community Feedback & Reviews ({reviews.length})</span>
          </h2>

          {loadingReviews ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No reviews yet. Complete your first deal handover to build your reputation score!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {rev.reviewerId?.name || rev.reviewer?.name || 'Anonymous Peer'}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                      {rev.flagged ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Reported to Admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReportModal(rev)}
                          className="text-[11px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                          title="Report abusive or fake review to administrator"
                        >
                          <Flag className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.comment || 'Smooth peer handover.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Review Reason Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                  <Flag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Report Review to Admin</h3>
                  <p className="text-[11px] text-slate-400">Flag inappropriate, fake, or abusive feedback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Review Preview */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Selected Review</span>
              <p className="text-slate-700 italic text-[11px]">"{reportingReview.comment || 'No comment text'}"</p>
            </div>

            {/* Quick Reason Suggestions */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700">Quick Reason Tag</label>
              <div className="flex flex-wrap gap-1.5">
                {['Abusive language', 'Spam / Advertisement', 'Fake / Inaccurate Review', 'Harassment'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setReportReason(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      reportReason === tag
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Explanation / Reason Details *
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this review violates platform safety guidelines..."
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {reportError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  disabled={reportSubmitting}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{reportSubmitting ? 'Reporting...' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
