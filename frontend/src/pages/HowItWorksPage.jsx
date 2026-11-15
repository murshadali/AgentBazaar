import React from 'react';
import { ShieldCheck, Zap, Handshake, CheckCircle2, ArrowRight, Lock, Star, Clock, UserCheck, Activity, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorksPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How AgentBazaar Autonomous Negotiation Works
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          AgentBazaar replaces uncomfortable price haggle with two autonomous AI agents operating under Axelrod's Reciprocal Tit-for-Tat bargaining theory, strict privacy isolation, and mandatory dual human approval.
        </p>
      </div>

      {/* 4 Step Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm mb-4">
            1
          </span>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Seller Configures Agent</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The seller lists a product and inputs an Opening Ask and a <strong>confidential Minimum Floor Price</strong> (never disclosed to buyers).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm mb-4">
            2
          </span>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Buyer Deploys Agent</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The buyer inputs a Target Price and a <strong>confidential Maximum Budget Ceiling</strong> (never disclosed to the seller) and clicks Start.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm mb-4">
            3
          </span>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Autonomous Haggle</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Buyer Agent makes the opening offer. Agents exchange counter-offers round-by-round via Gemini and reciprocal concession matching.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm mb-4">
            4
          </span>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Dual Human Approval</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Once prices converge, a Deal Proposal is generated. <strong>Both humans must click Confirm</strong> before meetup details unlock.
          </p>
        </div>
      </div>

      {/* Architectural Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Card 1: Confidential Boundaries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-600">
            <Lock className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Confidential Price Privacy</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Neither party ever sees the counterparty’s confidential limit:
          </p>
          <ul className="text-xs space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Buyer’s Budget Ceiling</strong> is strictly hidden from the seller agent and excluded from all public API endpoints.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Seller’s Floor Price</strong> is strictly hidden from the buyer agent and excluded from all public API endpoints.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Gemini prompts are generated independently with complete isolation: neither prompt ever contains both limits.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Programmatic Guardrail Service */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-amber-600">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Programmatic Guardrails</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All AI decisions are intercepted and validated by backend code before storage:
          </p>
          <ul className="text-xs space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Direction Check:</strong> Buyer offers cannot move backwards (decrease); Seller asks cannot move upwards (increase).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Crossing Check:</strong> If buyer offer meets or exceeds seller ask, it converts into direct Acceptance.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Strict Bound Clamping:</strong> Offers exceeding budget or dropping below floor are clamped immediately.</span>
            </li>
          </ul>
        </div>

        {/* Card 3: Real-World Axelrod Reciprocal Model */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Activity className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Real-World Axelrod Tit-for-Tat Model</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Replaces arbitrary math curves with authentic human bargaining psychology:
          </p>
          <ul className="text-xs space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><strong>Concession Reciprocity:</strong> When an opponent drops their price, our agent reciprocates with a proportional raise.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><strong>Stubbornness Defense:</strong> If an opponent concedes ₹0, our agent holds ground to prevent one-sided exploitation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><strong>Semantic Anchoring:</strong> Offers are justified by item condition (New, Like New, Good, Fair, Used).</span>
            </li>
          </ul>
        </div>

        {/* Card 4: In-Person Exchange & Reputation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-600">
            <Handshake className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Local Handover & Reputation Engine</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Following the peer-to-peer resale model (OLX / Facebook Marketplace):
          </p>
          <ul className="text-xs space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>No in-app payments. Payment is arranged directly between buyer and seller in cash or UPI during physical meetup.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Post-handover ratings (1–5 stars) dynamically compute trust reputation scores for both buyers and sellers.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Ready to Experience Autonomous Haggling?</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Explore our verified listings and configure your confidential offer strategy right now.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-sm transition-colors"
        >
          <span>Explore Marketplace Listings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default HowItWorksPage;
