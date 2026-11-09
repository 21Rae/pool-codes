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
      {/* 8XBET Official Sponsored Footer Banner (Hidden for now) */}
      {/*
      <div className="max-w-[1360px] mx-auto mb-8">
        <a
          href="https://8xbet.ng/p/LI4t"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full overflow-hidden rounded-xl border border-zinc-300/80 dark:border-emerald-950/80 hover:opacity-95 transition shadow-sm"
        >
          <picture>
            <source media="(max-width: 767px)" srcSet="https://i.imgur.com/JNCnRUi.gif" />
            <img
              src="https://i.imgur.com/B2ibgW9.gif"
              width="1600"
              height="150"
              alt="8XBET"
              className="w-full h-auto block"
              loading="lazy"
            />
          </picture>
        </a>
      </div>
      */}

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
          <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
            <a 
              href="https://whatsapp.com/channel/0029VanbsS4EawdxbTTkgc3D" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-200 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40`}
              title="Join our official WhatsApp Channel"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.73 7.3C8.54 7.3 8.24 7.37 7.98 7.65C7.73 7.93 7 8.61 7 10C7 11.39 8.01 12.73 8.15 12.92C8.29 13.11 10.14 15.96 12.97 17.18C13.64 17.47 14.17 17.65 14.58 17.78C15.26 18 15.87 17.97 16.36 17.9C16.91 17.82 18.04 17.21 18.28 16.55C18.51 15.89 18.51 15.32 18.44 15.2C18.37 15.09 18.19 15.02 17.91 14.88C17.64 14.74 16.28 14.07 16.03 13.98C15.77 13.88 15.59 13.84 15.4 14.12C15.22 14.39 14.69 15.02 14.53 15.2C14.37 15.39 14.21 15.41 13.93 15.27C13.66 15.14 12.78 14.85 11.73 13.91C10.91 13.18 10.36 12.28 10.2 12C10.04 11.73 10.18 11.58 10.32 11.44C10.45 11.32 10.6 11.12 10.74 10.96C10.88 10.8 10.93 10.68 11.02 10.5C11.12 10.32 11.07 10.15 11 10.02C10.93 9.88 10.38 8.52 10.15 7.97C9.93 7.43 9.7 7.51 9.53 7.5C9.37 7.49 9.19 7.49 9 7.49C8.82 7.49 8.73 7.3 8.73 7.3Z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
            <a 
              href="https://t.me/fastpoolcodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-200 bg-[#229ED9]/15 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/40`}
              title="Join our official Telegram Channel"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z"/>
              </svg>
              <span>Telegram</span>
            </a>
            <a 
              href="https://m.facebook.com/fastpoolcodes/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 hover:bg-blue-600 hover:text-white border border-emerald-900/30' : 'bg-zinc-100 hover:bg-blue-600 hover:text-white text-zinc-500'
              }`}
              title="Follow us on Facebook"
            >
              <Facebook className="w-4 h-4" />
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
              <Twitter className="w-4 h-4" />
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
              <Instagram className="w-4 h-4" />
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
              <Youtube className="w-4 h-4" />
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

        <div className="md:col-span-4 space-y-3.5">
          <h4 className={`font-extrabold tracking-widest uppercase text-[10.5px] ${isDark ? 'text-emerald-400' : 'text-zinc-800'}`}>
            SUPPORT & ENQUIRIES
          </h4>
          <div className="space-y-2 font-bold">
            <a href="mailto:fastpoolcodes@gmail.com" className={`hover:text-emerald-400 text-xs transition block ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>
              📧 fastpoolcodes@gmail.com
            </a>
            <div className="space-y-1">
              <a href="https://wa.me/2348030587933" target="_blank" rel="noopener noreferrer" className={`hover:text-emerald-400 text-xs transition block ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>
                💬 WhatsApp: +234 - 803 058 7933
              </a>
              <a href="https://wa.me/2349037595705" target="_blank" rel="noopener noreferrer" className={`hover:text-emerald-400 text-xs transition block ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>
                💬 WhatsApp: +234 - 903 759 5705
              </a>
            </div>
            <div className={`text-[11px] font-medium pt-1 ${isDark ? 'text-slate-400' : 'text-zinc-500'}`}>
              <span className="font-bold text-slate-300 block">Customer Support (24 Hrs):</span>
              <p>Call: +234 - 803 058 7933</p>
              <p>Call: +234 - 806 469 5138</p>
            </div>
          </div>

          {/* Official Channels Join Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="https://whatsapp.com/channel/0029VanbsS4EawdxbTTkgc3D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm hover:shadow transition duration-150 active:scale-95 text-center"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.73 7.3C8.54 7.3 8.24 7.37 7.98 7.65C7.73 7.93 7 8.61 7 10C7 11.39 8.01 12.73 8.15 12.92C8.29 13.11 10.14 15.96 12.97 17.18C13.64 17.47 14.17 17.65 14.58 17.78C15.26 18 15.87 17.97 16.36 17.9C16.91 17.82 18.04 17.21 18.28 16.55C18.51 15.89 18.51 15.32 18.44 15.2C18.37 15.09 18.19 15.02 17.91 14.88C17.64 14.74 16.28 14.07 16.03 13.98C15.77 13.88 15.59 13.84 15.4 14.12C15.22 14.39 14.69 15.02 14.53 15.2C14.37 15.39 14.21 15.41 13.93 15.27C13.66 15.14 12.78 14.85 11.73 13.91C10.91 13.18 10.36 12.28 10.2 12C10.04 11.73 10.18 11.58 10.32 11.44C10.45 11.32 10.6 11.12 10.74 10.96C10.88 10.8 10.93 10.68 11.02 10.5C11.12 10.32 11.07 10.15 11 10.02C10.93 9.88 10.38 8.52 10.15 7.97C9.93 7.43 9.7 7.51 9.53 7.5C9.37 7.49 9.19 7.49 9 7.49C8.82 7.49 8.73 7.3 8.73 7.3Z"/>
              </svg>
              <span>Join WhatsApp Channel</span>
            </a>
            <a
              href="https://t.me/fastpoolcodes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black bg-[#229ED9] hover:bg-[#1d8bc0] text-white shadow-sm hover:shadow transition duration-150 active:scale-95 text-center"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z"/>
              </svg>
              <span>Join Telegram</span>
            </a>
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
