import React, { useEffect, useRef } from 'react';

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
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  className = '',
  adSlot = '2641243034',
  adClient = 'ca-pub-5745254500272059',
  adFormat = 'horizontal',
  fullWidthResponsive = false,
  compact = false,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      if (!pushedRef.current && adRef.current) {
        pushedRef.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('Google AdSense push error:', err);
    }
  }, []);

  return (
    <div className={`my-2 flex flex-col items-center justify-center overflow-hidden w-full ${compact ? 'max-h-[70px] py-1' : 'min-h-[50px] max-h-[90px] py-1.5'} ${className}`}>
      <div className="w-full flex items-center justify-between px-2 mb-0.5">
        <span className="text-[8px] uppercase tracking-widest text-slate-500 font-mono font-semibold">
          Advertisement
        </span>
        <span className="text-[8px] text-slate-600 font-mono">Sponsored</span>
      </div>

      {/* Official Google AdSense Tag */}
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
    </div>
  );
};

export default GoogleAdBanner;

