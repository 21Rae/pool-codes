import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Megaphone } from 'lucide-react';

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
  compact?: boolean;
  onNavigateToContact?: () => void;
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  className = '',
  adSlot = '2641243034',
  adClient = 'ca-pub-5745254500272059',
  adFormat = 'horizontal',
  fullWidthResponsive = false,
  compact = false,
  onNavigateToContact,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef<boolean>(false);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);

  const handleNavigateToContact = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onNavigateToContact) {
      onNavigateToContact();
    } else {
      window.location.hash = '#contact';
      window.dispatchEvent(new CustomEvent('fastpool_navigate_contact'));
    }
  };

  useEffect(() => {
    try {
      if (!pushedRef.current && adRef.current) {
        pushedRef.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('Google AdSense push error:', err);
    }

    // Check if AdSense filled the ad unit after a short interval
    const timer = setTimeout(() => {
      if (adRef.current) {
        const hasIframe = adRef.current.querySelector('iframe') !== null;
        const hasAdData = adRef.current.getAttribute('data-ad-status') === 'filled';
        if (hasIframe || hasAdData) {
          setAdLoaded(true);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`my-2 flex flex-col items-center justify-center overflow-hidden w-full transition-all duration-200 ${compact ? 'py-1' : 'py-1.5'} ${className}`}>
      {/* Top Banner Control Header with Direct Click to Contact Us */}
      <div className="w-full flex items-center justify-between px-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] uppercase tracking-widest text-slate-400 font-mono font-semibold">
            Advertisement
          </span>
          <span className="text-[8px] text-slate-500 font-mono">• Sponsored</span>
        </div>
        <button
          onClick={handleNavigateToContact}
          className="text-[9px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer transition"
          title="Click to place an advert or reach our team"
        >
          <span>Advertise With Us / Contact Us</span>
          <ArrowUpRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Official Google AdSense Tag */}
      <div className="w-full relative min-h-[50px] flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            maxHeight: compact ? '60px' : '90px',
            height: compact ? '60px' : 'auto'
          }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        />

        {/* Fallback Interactive Banner when Google ads are verifying or unfilled */}
        {!adLoaded && (
          <div
            onClick={handleNavigateToContact}
            className="w-full bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-850 border border-amber-500/30 hover:border-amber-400/60 rounded-lg p-2.5 flex items-center justify-between gap-3 cursor-pointer group shadow-sm transition-all"
            title="Click to contact FastPoolCodes support & advertising desk"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-amber-300 font-mono tracking-wider">
                    Place Your Advert Here
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 text-[8px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                    50K+ Weekly Pools Punters
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 truncate">
                  Reach football pool analysts, betting syndicates & fans across Nigeria, Ghana & UK.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-md text-[10px] font-black font-mono uppercase tracking-wider group-hover:shadow-md transition">
              <span>Contact Us</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAdBanner;

