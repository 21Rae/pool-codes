import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  PhoneCall, 
  Copy, 
  Check, 
  LifeBuoy, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  MessageSquareHeart,
  Info
} from 'lucide-react';
import Footer from './Footer';

interface HelpCenterPageProps {
  onBack: () => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onNavigateToCodes?: () => void;
  renderFooter?: () => React.ReactNode;
}

export default function HelpCenterPage({ onBack, triggerToast, onNavigateToCodes, renderFooter }: HelpCenterPageProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const emailAddress = "support@fastpoolcodes.com";
  const whatsappNumber = "+234 800 766 5435";
  const whatsappLink = "https://wa.me/2348007665435?text=Hello%20FastPoolCodes%20Support,%20I%20have%20a%20complaint%20or%20inquiry:";

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
    triggerToast(`Copied ${text} to clipboard!`, 'success');
  };

  return (
    <div className="h-screen overflow-y-auto w-full bg-[#030706] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#06110d]/90 backdrop-blur-md border-b border-emerald-950/80 px-4 md:px-8 py-4 shrink-0 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 px-3.5 py-2 rounded-lg transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="h-6 w-px bg-emerald-900/50 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Help Center & Complaints Desk
              </h1>
              <p className="text-[10px] text-zinc-400 font-semibold">
                Direct Contact Channels & Customer Support
              </p>
            </div>
          </div>
        </div>

        {onNavigateToCodes && (
          <button
            onClick={onNavigateToCodes}
            className="hidden md:flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 rounded-lg transition cursor-pointer"
          >
            <span>View Pool Codes</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10 space-y-8 text-left">
        
        {/* Banner Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1f18] via-[#081813] to-[#040c09] border border-emerald-900/70 p-6 md:p-10 shadow-2xl space-y-4"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FastPoolCodes Support Assurance</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight">
            How to File a Complaint or Inquiry
          </h2>

          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium max-w-2xl">
            If you have any complaints, payment disputes, questions regarding pool codes, or technical difficulties, please send your message directly to our dedicated support channels below via <span className="text-emerald-400 font-bold">Email</span> or <span className="text-emerald-400 font-bold">WhatsApp</span>. Our team monitors both channels 24/7.
          </p>
        </motion.div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* EMAIL CHANNEL CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#08120e] border border-emerald-900/60 rounded-2xl p-6 md:p-8 space-y-6 hover:border-emerald-700/80 transition shadow-xl relative overflow-hidden group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition duration-200">
                <Mail className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase block mb-1">
                  Email Support Channel
                </span>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Send Complaints via Email
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Recommended for payment receipt attachments, detailed subscription disputes, and official account inquiries.
                </p>
              </div>

              <div className="bg-[#030907] border border-emerald-950 rounded-xl p-3.5 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-emerald-300 truncate selection:bg-emerald-500 selection:text-black">
                  {emailAddress}
                </span>
                <button
                  onClick={() => handleCopy(emailAddress, 'email')}
                  className="text-zinc-400 hover:text-emerald-400 transition p-1.5 rounded-lg hover:bg-emerald-950 shrink-0 cursor-pointer"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`mailto:${emailAddress}?subject=Complaint%20/ %20Support%20Inquiry%20-%20FastPoolCodes`}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open Mail App</span>
              </a>
            </div>
          </motion.div>

          {/* PHONE CALL & WHATSAPP CHANNEL CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#08120e] border border-emerald-900/60 rounded-2xl p-6 md:p-8 space-y-6 hover:border-emerald-700/80 transition shadow-xl relative overflow-hidden group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition duration-200">
                <PhoneCall className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase block mb-1">
                  Direct Phone Support Desk
                </span>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Call Customer Support
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Speak directly with our support desk for urgent complaints, live pool code cross-checks, and account assistance.
                </p>
              </div>

              <div className="bg-[#030907] border border-emerald-950 rounded-xl p-3.5 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-emerald-300 truncate">
                  {whatsappNumber}
                </span>
                <button
                  onClick={() => handleCopy(whatsappNumber, 'phone')}
                  className="text-zinc-400 hover:text-emerald-400 transition p-1.5 rounded-lg hover:bg-emerald-950 shrink-0 cursor-pointer"
                  title="Copy Phone Number"
                >
                  {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href="tel:+2348007665435"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Support Desk Now</span>
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 text-[11px] font-bold uppercase tracking-wider py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Or Chat on WhatsApp</span>
              </a>
            </div>
          </motion.div>

        </div>

        {/* Complaint Formatting Guide */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#050d0a] border border-emerald-900/50 rounded-2xl p-6 md:p-8 space-y-4"
        >
          <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wide">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Recommended Information to Include in Your Complaint</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
            To enable our compliance desk to resolve your complaint as quickly as possible, please include the following details in your Email or WhatsApp message:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300 font-medium">
            <li className="flex items-start gap-2 bg-[#030907] border border-emerald-950 p-3 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span><strong>Account Email / Name:</strong> Your registered account credentials.</span>
            </li>
            <li className="flex items-start gap-2 bg-[#030907] border border-emerald-950 p-3 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span><strong>Transaction Ref:</strong> Paystack or Bank reference ID (for payment issues).</span>
            </li>
            <li className="flex items-start gap-2 bg-[#030907] border border-emerald-950 p-3 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span><strong>Pool Code / Week #:</strong> Specific week and match number (for code issues).</span>
            </li>
            <li className="flex items-start gap-2 bg-[#030907] border border-emerald-950 p-3 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span><strong>Brief Description:</strong> Clear step-by-step summary of the issue.</span>
            </li>
          </ul>
        </motion.div>

        {/* Operating Hours & Guarantee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5 flex items-center gap-3">
            <Clock className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-white">24/7 Monitored Support Desk</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Urgent payment disputes & lockouts are addressed within 15–30 minutes.</p>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5 flex items-center gap-3">
            <PhoneCall className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-white">Direct Escalation Guarantee</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">All complaints are cross-audited by senior compliance managers.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Global Site Footer */}
      {renderFooter ? (
        renderFooter()
      ) : (
        <Footer 
          triggerToast={triggerToast} 
          onNavigateToCodes={onNavigateToCodes}
        />
      )}
    </div>
  );
}
