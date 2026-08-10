import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, any>>;
  }
}

interface GoogleAdBannerProps {
  className?: string;
  adSlot?: string;
  adClient?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  className = '',
  adSlot = '2641243034',
  adClient = 'ca-pub-5745254500272059',
  adFormat = 'auto',
  fullWidthResponsive = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef<boolean>(false);
  const [isUnfilled, setIsUnfilled] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (!pushedRef.current && adRef.current) {
        pushedRef.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('Google AdSense push error:', err);
    }

    // Check if Google AdSense sets status to unfilled (common in dev/unapproved preview domains)
    const timer = setTimeout(() => {
      if (adRef.current) {
        const status = adRef.current.getAttribute('data-ad-status');
        const height = adRef.current.clientHeight;
        if (status === 'unfilled' || height === 0) {
          setIsUnfilled(true);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`my-4 flex flex-col items-center justify-center overflow-hidden min-h-[90px] w-full ${className}`}>
      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
        Advertisement
      </span>

      {/* Official Google AdSense Tag */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        data-adtest="on"
      />

      {/* Development / Preview Domain Notice if Google AdSense returns unfilled due to Domain Approval */}
      {isUnfilled && (
        <div className="w-full p-4 rounded-lg bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              Ad
            </div>
            <div>
              <p className="text-emerald-300 font-semibold text-xs">
                Google AdSense Banner Integrated ({adSlot})
              </p>
              <p className="text-slate-400 text-[11px]">
                AdSense Script Active &bull; Publisher ID: <code className="text-emerald-400">{adClient}</code>
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
            <span className="text-emerald-400 font-semibold">Note:</span> Live ads appear automatically once your domain is added to AdSense Console.
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAdBanner;

