import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Printer, FileText, CheckCircle2, Search } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function TermsOfServicePage({ onBack, triggerToast }: TermsOfServicePageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const termsSections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: 'By accessing or using our website, you agree to be bound by these terms of service, our privacy policy, and any other rules, policies, or guidelines posted on our website.'
    },
    {
      id: 'eligibility',
      title: '2. Eligibility',
      content: 'Our services are intended for users who are 18 years of age or older. By using our website, you represent and warrant that you are at least 18 years old.'
    },
    {
      id: 'services',
      title: '3. Use of Our Services',
      content: 'Our website provides a platform for users to find pool codes, results, fixtures and predictions. You may not use FastPoolCodes for any illegal or unauthorized purpose, and you must comply with all applicable laws and regulations.'
    },
    {
      id: 'content',
      title: '4. User Content',
      content: 'You are solely responsible for any content that you upload or submit to our website. By uploading or submitting content, you grant us a non-exclusive, transferable, sublicensable, royalty-free, worldwide license to use, copy, modify, distribute, publish, and process your content.'
    },
    {
      id: 'prohibited',
      title: '5. Prohibited Conduct',
      content: 'You may not use FastPoolCodes to harass, intimidate, threaten, impersonate, or deceive any person or entity. You may not use our website to upload or distribute any viruses, malware, or other harmful software. You may not use our website to engage in any activity that interferes with or disrupts our services.'
    },
    {
      id: 'property',
      title: '6. Intellectual Property',
      content: 'FastPoolCodes and its contents are protected by intellectual property laws, including copyright and trademark laws. You may not use our website or its contents for any commercial purpose without our prior written consent.'
    },
    {
      id: 'disclaimer',
      title: '7. Disclaimer of Warranties',
      content: 'We do not warrant that our website will be uninterrupted or error-free. We do not warrant that the results obtained from the use of our website will be accurate or reliable.'
    },
    {
      id: 'liability',
      title: '8. Limitation of Liability',
      content: 'We will not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website. Our maximum liability to you shall be the amount you paid us to use our website.'
    },
    {
      id: 'indemnification',
      title: '9. Indemnification',
      content: 'You agree to indemnify, defend, and hold us harmless from any claims, damages, or losses arising out of or in connection with your use of our website.'
    },
    {
      id: 'changes',
      title: '10. Changes to Terms of Service',
      content: 'We reserve the right to modify these terms of service at any time, with or without notice. Your continued use of our website following any changes to these terms of service constitutes your acceptance of those changes.'
    }
  ];

  const filteredSections = termsSections.filter(
    section => 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    const printDiv = document.createElement('div');
    printDiv.id = 'printable-terms-pdf';
    printDiv.style.position = 'fixed';
    printDiv.style.left = '0';
    printDiv.style.top = '0';
    printDiv.style.width = '100%';
    printDiv.style.backgroundColor = 'white';
    printDiv.style.color = 'black';
    printDiv.style.zIndex = '9999999';
    printDiv.style.padding = '40px';
    printDiv.style.fontFamily = 'sans-serif';

    printDiv.innerHTML = `
      <div style="border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 25px; text-align: left;">
        <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; letter-spacing: -0.5px;">⚽ FASTPOOLCODES // LEGAL SERVICES</h1>
        <h2 style="margin: 5px 0 0 0; text-transform: uppercase; font-size: 14px; color: #10b981;">OFFICIAL TERMS OF SERVICE AND COMPLIANCE CONTRACT</h2>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #475569;">Document Classification: Public Secure / Verified for All Users | Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="font-size: 12px; line-height: 1.6; color: #1e293b; margin-bottom: 30px;">
        <p style="font-weight: bold; margin-bottom: 15px;">Please read these terms carefully before registering your forecasting account on FastPoolCodes.</p>
        ${termsSections.map(s => `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">${s.title}</h3>
            <p style="margin: 0;">${s.content}</p>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 9px; color: #64748b; text-align: center;">
        © 2026 FastPoolCodes. All rights reserved. Secure legal terms valid worldwide.
      </div>
    `;

    document.body.appendChild(printDiv);

    const printStyle = document.createElement('style');
    printStyle.id = 'print-terms-override';
    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #printable-terms-pdf, #printable-terms-pdf * {
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        printDiv.remove();
        printStyle.remove();
        triggerToast('Terms of Service document print dialog opened successfully.', 'success');
      }, 500);
    }, 100);
  };

  return (
    <div id="terms-of-service-view" className="h-full overflow-y-auto flex-1 bg-[#060c0a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. Header Area */}
      <header className="sticky top-0 z-50 bg-[#040907]/90 backdrop-blur-md border-b border-emerald-950 px-4 py-4 md:py-5 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors border border-emerald-900/30 flex items-center justify-center cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black font-mono tracking-tight uppercase text-white leading-none">FastPoolCodes</h1>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5 font-mono">Terms of Service</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800/50 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept & Return</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col gap-6">
        
        {/* Intro Hero Banner */}
        <div className="bg-gradient-to-br from-emerald-950/20 via-emerald-950/10 to-transparent border border-emerald-900/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="space-y-3 max-w-xl">
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full font-mono">
              Legal Compliance Document
            </span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
              Terms of Use & Member Rules Agreement
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Welcome to FastPoolCodes! Before you begin using our services, we require that you carefully read and agree to the following terms of service:
            </p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 shrink-0 flex flex-col justify-center items-center gap-1 text-center min-w-[140px]">
            <FileText className="w-8 h-8 text-emerald-400 mb-1" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-black">Document Status</span>
            <span className="text-xs font-bold text-white uppercase">Active & Secure</span>
            <span className="text-[9px] text-slate-500 font-mono">Ver: 2026.07.08</span>
          </div>
        </div>

        {/* Search Bar for Quick Navigation */}
        <div className="relative shrink-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-emerald-600">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search terms, keyword, or section numbers (e.g. 'Subscription', 'Eligibility', 'Liability')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#030907] border border-emerald-900/50 rounded-xl py-3 pl-10 pr-4 text-xs text-emerald-100 placeholder:text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 text-[10px] text-emerald-555 hover:text-emerald-400 font-bold uppercase transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Terms Sections Scroll List */}
        <div className="space-y-4">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#030907]/60 border border-emerald-950 rounded-xl p-5 md:p-6 hover:border-emerald-900/50 transition duration-250 flex flex-col gap-3 text-left"
              >
                <h3 className="font-sans font-black text-sm text-white uppercase tracking-tight flex items-center gap-2 border-b border-emerald-950 pb-2 text-emerald-400">
                  <span>{section.title}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                  {section.content}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-emerald-950 rounded-2xl bg-[#030907]/20">
              <p className="text-xs text-slate-500 font-mono">No matching Terms of Service sections found for "{searchQuery}".</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-emerald-400 hover:underline font-bold"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

        {/* Secure Disclaimer Box */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex gap-3 text-left shrink-0">
          <span className="text-sm">⚠️</span>
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Crucial Legal Disclaimer</h4>
            <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
              Our codes and draw predictions are mathematically simulated outputs of historical data trends. We do not provide assurance of payout, and pool coupon forecasting contains inherent risk. Under no circumstances should users utilize information provided for unauthorized real-money gaming activities in prohibited regions.
            </p>
          </div>
        </div>

        {/* Contact Support block */}
        <div className="border-t border-emerald-950 pt-6 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <p className="text-[10px] text-slate-500 font-mono text-center sm:text-left">
            Have questions about our legal protocols? Contact: <a href="mailto:admin@Fastpoolcodes.com" className="text-emerald-400 hover:underline">admin@Fastpoolcodes.com</a>
          </p>
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-950/40 hover:bg-emerald-950/80 text-emerald-400 hover:text-emerald-300 text-xs font-mono font-black border border-emerald-900 rounded-xl transition cursor-pointer uppercase tracking-wider"
          >
            Back to Application
          </button>
        </div>

      </main>

      {/* Footer copyright segment */}
      <footer className="bg-[#030705] border-t border-emerald-950 py-5 px-4 text-center text-[10px] text-slate-600 font-mono mt-auto shrink-0">
        © 2026 FastPoolCodes Legal Compliance Division. All rights reserved. Registered trademark.
      </footer>

    </div>
  );
}
