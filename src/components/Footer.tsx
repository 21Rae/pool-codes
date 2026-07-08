import React from 'react';

interface FooterProps {
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  className?: string;
  onOpenTerms?: () => void;
}

export default function Footer({ triggerToast, className = '', onOpenTerms }: FooterProps) {

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
        </div>

        <div className="md:col-span-3">
          <h4 className="font-extrabold text-zinc-800 tracking-widest uppercase mb-3.5 text-[10.5px]">
            RESOURCES
          </h4>
          <div className="space-y-2 text-zinc-600 font-bold select-none">
            <div onClick={() => triggerToast('Loading UK weekly coupon sheets...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">UK Weekly Codes</div>
            <div onClick={() => triggerToast('Loading Aussie coupon sheets...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">Aussie Perming Codes</div>
            <div onClick={() => triggerToast('Loading bet365 files...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">Match Fixtures</div>
            <div onClick={() => triggerToast('Opening customer service knowledgebase...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">Help Center</div>
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
