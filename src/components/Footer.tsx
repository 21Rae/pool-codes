import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

interface FooterProps {
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  className?: string;
  onOpenTerms?: () => void;
  onNavigateToCodes?: () => void;
  onOpenHelp?: () => void;
}

export default function Footer({ triggerToast, className = '', onOpenTerms, onNavigateToCodes, onOpenHelp }: FooterProps) {

  return (
    <footer className={`bg-white border-t border-zinc-200 text-zinc-500 py-12 px-6 select-none font-sans mt-auto shrink-0 ${className}`} id="global-site-footer">
      <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-left text-xs">
        
        <div className="md:col-span-5 space-y-3.5">
          <div 
            onClick={() => triggerToast('FASTPOOLCODES Marketplace & Editorial Desk', 'info')}
            className="bg-[#fa3e65] text-white font-black px-3 py-1 text-sm tracking-tighter italic skew-x-[-10deg] inline-block cursor-pointer select-none"
          >
            FASTPOOLCODES
          </div>
          <p className="leading-relaxed text-zinc-500 font-medium max-w-sm">
            Football pool codes and checklists for Aussie and UK weekly coupons, draw matrices, and match fixtures.
          </p>
          <div className="flex items-center gap-3 pt-1.5">
            <a 
              href="https://m.facebook.com/fastpoolcodes/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-blue-600 hover:text-white flex items-center justify-center text-zinc-500 transition-all duration-200"
              title="Follow us on Facebook"
            >
              <Facebook className="w-4.5 h-4.5" />
            </a>
            <a 
              href="https://x.com/fastpoolcodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-black hover:text-white flex items-center justify-center text-zinc-500 transition-all duration-200"
              title="Follow us on X"
            >
              <Twitter className="w-4.5 h-4.5" />
            </a>
            <a 
              href="https://www.instagram.com/fastpoolcodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-pink-600 hover:text-white flex items-center justify-center text-zinc-500 transition-all duration-200"
              title="Follow us on Instagram"
            >
              <Instagram className="w-4.5 h-4.5" />
            </a>
            <a 
              href="http://www.youtube.com/@FastPoolCodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-red-600 hover:text-white flex items-center justify-center text-zinc-500 transition-all duration-200"
              title="Follow us on YouTube"
            >
              <Youtube className="w-4.5 h-4.5" />
            </a>
          </div>

          {/* Age Restriction Warning */}
          <div className="flex items-center gap-2.5 mt-5 bg-zinc-50 border border-zinc-200 rounded-xl p-3 max-w-sm">
            <span className="bg-rose-50 text-rose-600 text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-rose-200 select-none">
              18+
            </span>
            <div className="text-[10px] leading-snug font-bold text-zinc-500">
              <span className="text-zinc-800 uppercase tracking-wider block font-extrabold text-[9px] mb-0.5">Disclaimer</span>
              This service is for users aged <span className="text-rose-600 font-extrabold">18 years and above only</span>. Please gamble responsibly and under the laws of your local jurisdiction.
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="font-extrabold text-zinc-800 tracking-widest uppercase mb-3.5 text-[10.5px]">
            RESOURCES
          </h4>
          <div className="space-y-2 text-zinc-600 font-bold select-none">
            <div 
              onClick={() => {
                if (onNavigateToCodes) {
                  onNavigateToCodes();
                } else {
                  triggerToast('Loading UK weekly coupon sheets...', 'info');
                }
              }} 
              className="hover:text-[#fa3e65] cursor-pointer transition"
            >
              UK Weekly Codes
            </div>
            <div 
              onClick={() => {
                if (onNavigateToCodes) {
                  onNavigateToCodes();
                } else {
                  triggerToast('Loading Aussie coupon sheets...', 'info');
                }
              }} 
              className="hover:text-[#fa3e65] cursor-pointer transition"
            >
              Aussie Perming Codes
            </div>
            <div 
              onClick={() => {
                if (onNavigateToCodes) {
                  onNavigateToCodes();
                } else {
                  triggerToast('Loading bet365 files...', 'info');
                }
              }} 
              className="hover:text-[#fa3e65] cursor-pointer transition"
            >
              Match Fixtures
            </div>
            <div 
              onClick={() => {
                if (onOpenHelp) {
                  onOpenHelp();
                } else if (onNavigateToCodes) {
                  onNavigateToCodes();
                } else {
                  triggerToast('Opening customer service knowledgebase...', 'info');
                }
              }} 
              className="hover:text-[#fa3e65] cursor-pointer transition"
            >
              Help Center
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <h4 className="font-extrabold text-zinc-800 tracking-widest uppercase mb-3.5 text-[10.5px]">
            SUPPORT & ENQUIRIES
          </h4>
          <div className="space-y-2.5 font-bold text-zinc-650">
            <a href="mailto:Fastpoolcodes@gmail.com" className="hover:text-[#fa3e65] text-zinc-800 text-sm transition block">
              📧 Fastpoolcodes@gmail.com
            </a>
            <a href="https://wa.me/2348030587933" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 text-zinc-800 text-sm transition block">
              💬 WhatsApp: 0803 058 7933
            </a>
            <p className="text-zinc-400 font-medium text-[11px] select-none leading-relaxed">
              Our direct forecasting helpdesk is available 24/7 to clear doubts about sequence keysets.
            </p>
          </div>
        </div>

      </div>

      <div className="max-w-[1360px] mx-auto mt-10 pt-6 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center text-[10.5px] font-medium text-zinc-400 gap-4">
        <span>© 2026 FastPoolCodes. All Rights Reserved.</span>
        <div className="flex gap-4">
          <span onClick={() => triggerToast('Opening Privacy Policy contract...', 'info')} className="hover:text-zinc-700 cursor-pointer transition">Privacy Policy</span>
          {onOpenTerms && (
            <>
              <span>•</span>
              <span onClick={onOpenTerms} className="hover:text-zinc-700 cursor-pointer transition">Terms of Use</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
