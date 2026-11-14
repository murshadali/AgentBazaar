import React from 'react';
import { Bot, ShieldCheck, Handshake, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white text-slate-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900">
                Agent<span className="text-indigo-600">Bazaar</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-4">
              An AI-powered peer-to-peer resale marketplace where autonomous Buyer and Seller AI agents negotiate fair market prices within strict human-defined confidential bounds, requiring dual human consent to finalize every deal.
            </p>
            <div className="text-[11px] text-slate-500 space-y-0.5 border-l-2 border-indigo-200 pl-3">
              <p className="font-semibold text-slate-700">Department of Computer Science, Aligarh Muslim University</p>
              <p>M.C.A Semester III Mini Project (CAMS3P01)</p>
              <p>Submitted by: Murshad Ali (Faculty No: 25CAMSA131, Enrolment: GR0829)</p>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Core Architecture</span>
            </h4>
            <ul className="text-xs space-y-2 text-slate-500">
              <li>MERN Stack (MongoDB, Express, React, Node)</li>
              <li>Google Gemini API (`@google/generative-ai`)</li>
              <li>Programmatic Guardrail Service (NFR2)</li>
              <li>Boulware Concession Fallback Engine</li>
              <li>Socket.IO Bidirectional Streaming</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Handshake className="w-4 h-4 text-emerald-600" />
              <span>Key Features</span>
            </h4>
            <ul className="text-xs space-y-2 text-slate-500">
              <li><Link to="/how-it-works" className="hover:text-indigo-600">How Negotiation Works</Link></li>
              <li><Link to="/marketplace" className="hover:text-indigo-600">Browse Active Listings</Link></li>
              <li>Confidential Bounds Protection</li>
              <li>Dual Human Approval Gate</li>
              <li>Local In-Person Handover</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AgentBazaar. Built for MCA Academic Mini Project.</p>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600 font-medium">Autonomous Multi-Agent Engine Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
