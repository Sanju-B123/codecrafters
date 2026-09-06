import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { DISCLAIMER_TEXT } from '@/constants';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs text-left">
      {/* Disclaimer Banner */}
      <div className="bg-slate-950 border-b border-slate-800 py-3.5 px-4 text-center">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-amber-300 font-medium text-xs">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{DISCLAIMER_TEXT}</span>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand & Purpose */}
        <div className="md:col-span-2 space-y-3">
          <div className="text-white font-bold text-base flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-bharat-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4 text-saffron-400" />
            </div>
            <span>BharatStandards<span className="text-saffron-500">.AI</span></span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
            India's Intelligent Standards & BIS Compliance Copilot. Accelerating quality conformity, standards transparency, and procedural navigation across Indian manufacturing and consumer ecosystems.
          </p>
          <div className="pt-2 text-[11px] text-slate-500">
            Smart India Hackathon Prototype • National Standards Framework
          </div>
        </div>

        {/* Product Capabilities */}
        <div>
          <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">
            Platform
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products/new" className="hover:text-white transition-colors">Check My Product</Link></li>
            <li><Link to="/standards" className="hover:text-white transition-colors">Standards Explorer</Link></li>
            <li><Link to="/compliance" className="hover:text-white transition-colors">Compliance Engine</Link></li>
            <li><Link to="/assistant" className="hover:text-white transition-colors">AI Standards Copilot</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">BIS Journey Roadmap</Link></li>
          </ul>
        </div>

        {/* Authoritative Information */}
        <div>
          <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">
            Official Resources
          </h4>
          <ul className="space-y-2 text-xs">
            <li><a href="https://www.bis.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bureau of Indian Standards</a></li>
            <li><a href="https://manakonline.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Manak Online Portal</a></li>
            <li><a href="https://www.services.bis.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">e-BIS Certification</a></li>
            <li><a href="https://nabl-india.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">NABL Laboratory Portal</a></li>
          </ul>
        </div>

        {/* Required Policies & Information */}
        <div>
          <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">
            Governance & Legal
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/#about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/#privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            <li><Link to="/#security" className="hover:text-white transition-colors">Security</Link></li>
            <li><Link to="/#terms" className="hover:text-white transition-colors">Terms</Link></li>
            <li><Link to="/#contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
          <div>© {new Date().getFullYear()} BharatStandards AI. Built for Smart India Hackathon.</div>
          <div className="flex items-center gap-4">
            <span>Tenant Data Isolation Active</span>
            <span>•</span>
            <span>Grounded Evidence Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
