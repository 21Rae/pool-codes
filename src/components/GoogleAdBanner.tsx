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
      />
    </div>
  );
};

export default GoogleAdBanner;

