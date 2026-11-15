import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} AgentBazaar. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
