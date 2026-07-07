import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Mail, 
  Shield, 
  Search, 
  FileText, 
  CheckCircle, 
  Calendar, 
  BookOpen, 
  Info,
  Scale
} from 'lucide-react';
import { motion } from 'motion/react';

interface TermsOfServicePageProps {
  onBack: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface TermSection {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Conduct' | 'Legal' | 'Privacy';
}

export default function TermsOfServicePage({ onBack, triggerToast }: TermsOfServicePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'General' | 'Conduct' | 'Legal'>('All');

  const termsSections: TermSection[] = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      category: 'General',
      content: 'By accessing or using our website, you agree to be bound by these terms of service, our privacy policy, and any other rules, policies, or guidelines posted on our website. If you do not agree to these terms, please do not use our services.'
    },
    {
      id: 'eligibility',
      title: '2. Eligibility',
      category: 'General',
      content: 'Our services are intended for users who are 18 years of age or older. By using our website, you represent and warrant that you are at least 18 years old. If you are under 18, you are strictly prohibited from using our services.'
    },
    {
      id: 'use-of-services',
      title: '3. Use of Our Services',
      category: 'General',
      content: 'Our website provides a platform for users to find pool codes, results, fixtures and predictions. You may not use FastPoolCodes for any illegal or unauthorized purpose, and you must comply with all applicable laws and regulations in your jurisdiction.'
    },
    {
      id: 'user-content',
      title: '4. User Content',
      category: 'Conduct',
      content: 'You are solely responsible for any content that you upload or submit to our website. By uploading or submitting content, you grant us a non-exclusive, transferable, sublicensable, royalty-free, worldwide license to use, copy, modify, distribute, publish, and process your content.'
    },
    {
      id: 'prohibited-conduct',
      title: '5. Prohibited Conduct',
      category: 'Conduct',
      content: 'You may not use FastPoolCodes to harass, intimidate, threaten, impersonate, or deceive any person or entity. You may not use our website to upload or distribute any viruses, malware, or other harmful software. You may not use our website to engage in any activity that interferes with or disrupts our services.'
    },
    {
      id: 'intellectual-property',
      title: '6. Intellectual Property',
      category: 'Legal',
      content: 'FastPoolCodes and its contents are protected by intellectual property laws, including copyright and trademark laws. You may not use our website or its contents for any commercial purpose without our prior written consent.'
    },
    {
      id: 'disclaimer-warranties',
      title: '7. Disclaimer of Warranties',
      category: 'Legal',
      content: 'We do not warrant that our website will be uninterrupted or error-free. We do not warrant that the results obtained from the use of our website will be accurate or reliable. All content is provided "as is" and "as available".'
    },
    {
      id: 'limitation-liability',
      title: '8. Limitation of Liability',
      category: 'Legal',
      content: 'We will not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website. Our maximum liability to you shall be the amount you paid us to use our website.'
    },
    {
      id: 'indemnification',
      title: '9. Indemnification',
      category: 'Legal',
      content: 'You agree to indemnify, defend, and hold us harmless from any claims, damages, or losses arising out of or in connection with your use of our website or breach of these terms.'
    },
    {
      id: 'changes',
      title: '10. Changes to Terms of Service',
      category: 'General',
      content: 'We reserve the right to modify these terms of service at any time, with or without notice. Your continued use of our website following any changes to these terms of service constitutes your acceptance of those changes.'
    }
  ];

  const filteredSections = termsSections.filter(section => {
    const matchesCategory = selectedCategory === 'All' || section.category === selectedCategory;
    const matchesSearch = section.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          section.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
    triggerToast('Preparing terms for printing...', 'info');
  };

  const handleDownloadText = () => {
    const textContent = `FASTPOOLCODES TERMS OF SERVICE\nLast Updated: July 2026\n\n` + 
      termsSections.map(s => `${s.title}\n${s.content}\n`).join('\n') +
      `\nContact: admin@Fastpoolcodes.com`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FastPoolCodes_Terms_Of_Service.txt';
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Terms of Service downloaded as .txt file.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header section with branding */}
      <header className="border-b border-slate-850 bg-slate-950/80 backdrop-blur sticky top-0 z-10 px-4 py-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition flex items-center justify-center cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-mono font-black text-emerald-400 tracking-widest uppercase">
                  FastPoolCodes
                </h1>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                  Legal Compliance Office
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold font-mono text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download (.TXT)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-8 flex flex-col gap-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900/10 to-transparent border border-emerald-900/20 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-mono font-black uppercase text-slate-200 tracking-wider">
              Terms of Service Agreement
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
              Please read these terms carefully before utilizing our match fixtures, results center, fast pool codes, and premium predictions. By using our website, you agree to be bound by these legal policies.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-950 border border-slate-850 p-4 rounded-xl">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'General', 'Conduct', 'Legal'] as const).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold uppercase transition cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search terms or clauses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white font-mono uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="grid grid-cols-1 gap-6">
          {filteredSections.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950">
              <Info className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-mono text-slate-400">
                No articles matching your filters: "{searchQuery || selectedCategory}"
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-3 text-emerald-400 font-mono text-xs hover:underline uppercase"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredSections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-950/80 border border-slate-850 p-6 rounded-xl hover:border-slate-800 transition flex gap-4 items-start"
              >
                <div className="p-2 bg-slate-900 rounded-lg text-emerald-500 shrink-0 font-mono text-xs font-black select-none">
                  #{idx + 1}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sans font-extrabold text-sm text-slate-200">
                      {section.title}
                    </h3>
                    <span className="text-[9px] font-mono font-extrabold uppercase bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-800/60">
                      {section.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed font-sans">
                    {section.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Support Section Footer card */}
        <div className="bg-[#0b1329] border border-emerald-950 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-sm font-mono font-black uppercase text-white tracking-wider flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Questions or Concerns?</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Our compliance managers are ready to assist you. Drop an email to receive quick feedback regarding user accounts, subscriptions, or refund guidelines.
            </p>
          </div>

          <a
            href="mailto:admin@Fastpoolcodes.com"
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black font-mono text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition flex items-center gap-2"
          >
            <span>admin@Fastpoolcodes.com</span>
          </a>
        </div>

      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 FastPoolCodes Compliance Office. All legal protections apply.</p>
      </footer>
    </div>
  );
}
