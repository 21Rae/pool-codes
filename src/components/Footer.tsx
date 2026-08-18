import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

interface FooterProps {
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  className?: string;
  onOpenTerms?: () => void;
  onNavigateToCodes?: () => void;
  onOpenHelp?: () => void;
  isDark?: boolean;
}

export default function Footer({ triggerToast, className = '', onOpenTerms, onNavigateToCodes, onOpenHelp, isDark = false }: FooterProps) {

  return (
    <footer className={`py-12 px-6 select-none font-sans mt-auto shrink-0 transition-colors ${
      isDark 
        ? 'bg-[#020705] border-t border-emerald-950/80 text-slate-400' 
        : 'bg-white border-t border-zinc-200 text-zinc-500'
    } ${className}`} id="global-site-footer">
      <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-left text-xs">
        
        <div className="md:col-span-5 space-y-3.5">
          <div 
            onClick={() => triggerToast('FASTPOOLCODES Marketplace & Editorial Desk', 'info')}
            className="bg-[#fa3e65] text-white font-black px-3 py-1 text-sm tracking-tighter italic skew-x-[-10deg] inline-block cursor-pointer select-none shadow-md"
          >
            FASTPOOLCODES
          </div>
          <p className={`leading-relaxed font-medium max-w-sm ${isDark ? 'text-slate-400' : 'text-zinc-500'}`}>
            Football pool codes and checklists for Aussie and UK weekly coupons, draw matrices, and match fixtures.
          </p>
          <div className="flex items-center gap-3 pt-1.5">
            <a 
              href="https://m.facebook.com/fastpoolcodes/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 hover:bg-blue-600 hover:text-white border border-emerald-900/30' : 'bg-zinc-100 hover:bg-blue-600 hover:text-white text-zinc-500'
              }`}
              title="Follow us on Facebook"
            >
              <Facebook className="w-4.5 h-4.5" />
            </a>
            <a 
              href="https://x.com/fastpoolcodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 hover:bg-black hover:text-white border border-emerald-900/30' : 'bg-zinc-100 hover:bg-black hover:text-white text-zinc-500'
              }`}
              title="Follow us on X"
            >
              <Twitter className="w-4.5 h-4.5" />
            </a>
            <a 
              href="https://www.instagram.com/fastpoolcodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 hover:bg-pink-600 hover:text-white border border-emerald-900/30' : 'bg-zinc-100 hover:bg-pink-600 hover:text-white text-zinc-500'
              }`}
              title="Follow us on Instagram"
            >
              <Instagram className="w-4.5 h-4.5" />
            </a>
            <a 
              href="http://www.youtube.com/@FastPoolCodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 hover:bg-red-600 hover:text-white border border-emerald-900/30' : 'bg-zinc-100 hover:bg-red-600 hover:text-white text-zinc-500'
              }`}
              title="Follow us on YouTube"
            >
              <Youtube className="w-4.5 h-4.5" />
            </a>
          </div>

          {/* Age Restriction Warning */}
          <div className={`flex items-center gap-2.5 mt-5 rounded-xl p-3 max-w-sm border ${
            isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <span className={`text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shrink-0 select-none border ${
              isDark ? 'bg-rose-950/60 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              18+
            </span>
            <div className={`text-[10px] leading-snug font-bold ${isDark ? 'text-slate-400' : 'text-zinc-500'}`}>
              <span className={`uppercase tracking-wider block font-extrabold text-[9px] mb-0.5 ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>Disclaimer</span>
              This service is for users aged <span className="text-rose-500 font-extrabold">18 years and above only</span>. Please gamble responsibly and under the laws of your local jurisdiction.
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className={`font-extrabold tracking-widest uppercase mb-3.5 text-[10.5px] ${isDark ? 'text-emerald-400' : 'text-zinc-800'}`}>
            RESOURCES
          </h4>
          <div className={`space-y-2 font-bold select-none ${isDark ? 'text-slate-400' : 'text-zinc-600'}`}>
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
          <h4 className={`font-extrabold tracking-widest uppercase mb-3.5 text-[10.5px] ${isDark ? 'text-emerald-400' : 'text-zinc-800'}`}>
            SUPPORT & ENQUIRIES
          </h4>
          <div className="space-y-2.5 font-bold">
            <a href="mailto:Fastpoolcodes@gmail.com" className={`hover:text-[#fa3e65] text-sm transition block ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>
              📧 Fastpoolcodes@gmail.com
            </a>
            <a href="https://wa.me/2348030587933" target="_blank" rel="noopener noreferrer" className={`hover:text-emerald-400 text-sm transition block ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>
              💬 WhatsApp: 0803 058 7933
            </a>
            <p className={`font-medium text-[11px] select-none leading-relaxed ${isDark ? 'text-slate-500' : 'text-zinc-400'}`}>
              Our direct forecasting helpdesk is available 24/7 to clear doubts about sequence keysets.
            </p>
          </div>
        </div>

      </div>

      <div className={`max-w-[1360px] mx-auto mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-center text-[10.5px] font-medium gap-4 ${
        isDark ? 'border-emerald-950 text-slate-500' : 'border-zinc-200 text-zinc-400'
      }`}>
        <span>© 2026 FastPoolCodes. All Rights Reserved.</span>
        <div className="flex gap-4">
          <span onClick={() => triggerToast('Opening Privacy Policy contract...', 'info')} className={`cursor-pointer transition ${isDark ? 'hover:text-slate-300' : 'hover:text-zinc-700'}`}>Privacy Policy</span>
          {onOpenTerms && (
            <>
              <span>•</span>
              <span onClick={onOpenTerms} className={`cursor-pointer transition ${isDark ? 'hover:text-slate-300' : 'hover:text-zinc-700'}`}>Terms of Use</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
