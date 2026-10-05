import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  ShieldCheck,
  Lock,
  Filter,
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  Calendar,
  Globe,
  Tag,
  X,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  HardDrive,
  FolderTree
} from 'lucide-react';
import { BookmakerPdfUpload, User, DatabaseState } from '../types';

interface AdminPdfUploadSectionProps {
  currentUser: User;
  db: DatabaseState;
  onUpdateUploadedPdfs?: (pdfs: BookmakerPdfUpload[]) => void;
  triggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const SUPPORTED_BOOKMAKERS = [
  { key: 'bet9ja', name: 'Bet9ja', country: 'Nigeria', flag: '🇳🇬', color: 'emerald', prefix: 'B9' },
  { key: 'betking', name: 'BetKing', country: 'Nigeria', flag: '🇳🇬', color: 'amber', prefix: 'BK' },
  { key: 'sportybet', name: 'SportyBet', country: 'Nigeria', flag: '🇳🇬', color: 'rose', prefix: 'SB' },
  { key: 'sportybet-ghana', name: 'SportyBet Ghana', country: 'Ghana', flag: '🇬🇭', color: 'red', prefix: 'SBGH' },
  { key: 'msport', name: 'MSport', country: 'Nigeria', flag: '🇳🇬', color: 'yellow', prefix: 'MS' },
  { key: 'betway', name: 'Betway Ghana', country: 'Ghana', flag: '🇬🇭', color: 'blue', prefix: 'BW' },
  { key: 'premierbet', name: 'PremierBet Ghana', country: 'Ghana', flag: '🇬🇭', color: 'green', prefix: 'PB' },
  { key: 'soccabet', name: 'Soccabet Ghana', country: 'Ghana', flag: '🇬🇭', color: 'orange', prefix: 'SC' },
  { key: 'pool_codes_comparison', name: 'Pool Codes Comparison (Master Sheet)', country: 'International', flag: '🌐', color: 'purple', prefix: 'PCC' }
];

const DEFAULT_INITIAL_PDFS: BookmakerPdfUpload[] = [
  {
    id: 'pdf-init-b9-w50',
    bookmaker_key: 'bet9ja',
    bookmaker_name: 'Bet9ja',
    country: 'Nigeria',
    week_number: 50,
    season_year: 2026,
    file_name: 'Bet9ja_Week50_Official_Pool_Coupon.pdf',
    file_size: 245760,
    file_size_formatted: '240 KB',
    file_data_url: '',
    access_level: 'premium',
    uploaded_by: 'admin',
    uploaded_at: '2026-06-05T09:30:00Z',
    is_active: true,
    notes: 'Official UK Aussie Week 50 Decrypted Coupon. High-probability draws verified.',
    page_count: 1,
    tags: ['Official', 'Week 50', 'Nigeria']
  },
  {
    id: 'pdf-init-bk-w50',
    bookmaker_key: 'betking',
    bookmaker_name: 'BetKing',
    country: 'Nigeria',
    week_number: 50,
    season_year: 2026,
    file_name: 'BetKing_Week50_Verified_Key_Codes.pdf',
    file_size: 286720,
    file_size_formatted: '280 KB',
    file_data_url: '',
    access_level: 'premium',
    uploaded_by: 'admin',
    uploaded_at: '2026-06-05T10:15:00Z',
    is_active: true,
    notes: 'Verified BetKing codesheet with single-page strict A4 formatting.',
    page_count: 1,
    tags: ['Official', 'BetKing', 'A4 Single Page']
  },
  {
    id: 'pdf-init-sbgh-w50',
    bookmaker_key: 'sportybet-ghana',
    bookmaker_name: 'SportyBet Ghana',
    country: 'Ghana',
    week_number: 50,
    season_year: 2026,
    file_name: 'SportyBet_Ghana_Week50_Official_Pool.pdf',
    file_size: 215040,
    file_size_formatted: '210 KB',
    file_data_url: '',
    access_level: 'premium',
    uploaded_by: 'admin',
    uploaded_at: '2026-06-05T11:00:00Z',
    is_active: true,
    notes: 'Ghana regional SportyBet sheet with Cedis market odds & draw forecasts.',
    page_count: 1,
    tags: ['Ghana', 'SportyBet', 'GHS Market']
  },
  {
    id: 'pdf-init-comp-w50',
    bookmaker_key: 'pool_codes_comparison',
    bookmaker_name: 'Pool Codes Comparison (Master Sheet)',
    country: 'International',
    week_number: 50,
    season_year: 2026,
    file_name: 'FastPoolCodes_Week50_Master_Comparison_Sheet.pdf',
    file_size: 358400,
    file_size_formatted: '350 KB',
    file_data_url: '',
    access_level: 'free',
    uploaded_by: 'admin',
    uploaded_at: '2026-06-05T08:00:00Z',
    is_active: true,
    notes: 'Multi-bookmaker odds cross-reference matrix (Bet9ja, BetKing, SportyBet).',
    page_count: 1,
    tags: ['Master Matrix', 'Free Access', 'Multi-Bookmaker']
  }
];

export default function AdminPdfUploadSection({
  currentUser,
  db,
  onUpdateUploadedPdfs,
  triggerToast
}: AdminPdfUploadSectionProps) {
  // Local storage cache or DB state
  const [uploadedPdfs, setUploadedPdfs] = useState<BookmakerPdfUpload[]>(() => {
    try {
      const cached = localStorage.getItem('fastpool_uploaded_bookmaker_pdfs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return db.uploaded_bookmaker_pdfs && db.uploaded_bookmaker_pdfs.length > 0
      ? db.uploaded_bookmaker_pdfs
      : DEFAULT_INITIAL_PDFS;
  });

  // Selected upload configuration state
  const [selectedBookmakerKey, setSelectedBookmakerKey] = useState<string>('bet9ja');
  const [weekNumber, setWeekNumber] = useState<number>(() => {
    const wk = db?.pool_results?.[0]?.week_number || (db?.bet9ja?.[0] as any)?.week_no || (db?.bet9ja?.[0] as any)?.week_number;
    return Number(wk) || 15;
  });
  const [seasonYear, setSeasonYear] = useState<number>(2026);
  const [accessLevel, setAccessLevel] = useState<'premium' | 'free'>('premium');
  const [notes, setNotes] = useState<string>('');
  const [setActiveImmediately, setSetActiveImmediately] = useState<boolean>(true);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters & table state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBookmaker, setFilterBookmaker] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  // Preview Modal state
  const [previewPdf, setPreviewPdf] = useState<BookmakerPdfUpload | null>(null);

  // Supabase Storage Buckets state
  const [availableBuckets, setAvailableBuckets] = useState<any[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState<boolean>(true);

  const fetchBuckets = () => {
    setLoadingBuckets(true);
    fetch('/api/storage/buckets')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.buckets)) {
          setAvailableBuckets(data.buckets);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBuckets(false));
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  // Sync state changes to storage & parent safely without interrupting render
  const persistPdfs = (updated: BookmakerPdfUpload[], notifyParent: boolean = true) => {
    setUploadedPdfs(updated);
    try {
      localStorage.setItem('fastpool_uploaded_bookmaker_pdfs', JSON.stringify(updated));
    } catch (_) {}
    if (notifyParent && onUpdateUploadedPdfs) {
      setTimeout(() => {
        onUpdateUploadedPdfs(updated);
      }, 0);
    }
  };

  // Sync with server endpoint on mount (authoritative Supabase 'pdf' bucket list)
  useEffect(() => {
    fetch(`/api/admin-pdfs?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setUploadedPdfs(data.data);
          try {
            localStorage.setItem('fastpool_uploaded_bookmaker_pdfs', JSON.stringify(data.data));
          } catch (_) {}
          if (onUpdateUploadedPdfs) {
            setTimeout(() => onUpdateUploadedPdfs(data.data), 0);
          }
        }
      })
      .catch(() => {});
  }, []);

  const selectedBookmaker = SUPPORTED_BOOKMAKERS.find(b => b.key === selectedBookmakerKey) || SUPPORTED_BOOKMAKERS[0];

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      triggerToast('Invalid file format. Please upload a valid .pdf document.', 'error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      triggerToast('File size exceeds the 20MB limit.', 'error');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      setFileDataUrl(res);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !fileDataUrl) {
      triggerToast('Please select or drop a PDF file to upload.', 'error');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      const formattedSize = selectedFile
        ? selectedFile.size > 1024 * 1024
          ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(selectedFile.size / 1024)} KB`
        : '250 KB';

      const newPdf: BookmakerPdfUpload = {
        id: `pdf-${selectedBookmaker.key}-w${weekNumber}-${Date.now()}`,
        bookmaker_key: selectedBookmaker.key,
        bookmaker_name: selectedBookmaker.name,
        country: selectedBookmaker.country as any,
        week_number: Number(weekNumber) || 50,
        season_year: Number(seasonYear) || 2026,
        file_name: selectedFile?.name || `${selectedBookmaker.name}_Week${weekNumber}_Coupon.pdf`,
        file_size: selectedFile?.size || 256000,
        file_size_formatted: formattedSize,
        file_data_url: fileDataUrl,
        access_level: accessLevel,
        uploaded_by: currentUser.username || 'admin',
        uploaded_at: new Date().toISOString(),
        is_active: setActiveImmediately,
        notes: notes || `Official Week ${weekNumber} ${selectedBookmaker.name} coupon sheet.`,
        page_count: 1,
        tags: [selectedBookmaker.name, `Week ${weekNumber}`, selectedBookmaker.country]
      };

      // If active, mark other PDFs for same bookmaker & week as inactive
      const updatedList = uploadedPdfs.map(p => {
        if (setActiveImmediately && p.bookmaker_key === newPdf.bookmaker_key && p.week_number === newPdf.week_number) {
          return { ...p, is_active: false };
        }
        return p;
      });

      const finalList = [newPdf, ...updatedList];
      persistPdfs(finalList);

      // Async backend sync to upload into Supabase 'pdf' bucket
      fetch('/api/admin-pdfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPdf)
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.data) {
            const serverUpdated = data.data;
            setUploadedPdfs(prev => {
              const updated = prev.map(p => p.id === newPdf.id ? { ...p, ...serverUpdated } : p);
              try {
                localStorage.setItem('fastpool_uploaded_bookmaker_pdfs', JSON.stringify(updated));
              } catch (_) {}
              return updated;
            });
            if (onUpdateUploadedPdfs) {
              const parentList = finalList.map(p => p.id === newPdf.id ? { ...p, ...serverUpdated } : p);
              setTimeout(() => {
                onUpdateUploadedPdfs(parentList);
              }, 0);
            }
          }
        })
        .catch(() => {});

      setIsUploading(false);
      setSelectedFile(null);
      setFileDataUrl('');
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      triggerToast(
        `PDF for ${selectedBookmaker.name} (Week ${weekNumber}) successfully uploaded & published (Base tables untouched)!`,
        'success'
      );
    }, 400);
  };

  const handleToggleActive = (id: string) => {
    const target = uploadedPdfs.find(p => p.id === id);
    if (!target) return;

    const nextState = !target.is_active;
    const updated = uploadedPdfs.map(p => {
      if (p.id === id) {
        return { ...p, is_active: nextState };
      }
      // If turning ON, disable others for the same bookmaker & week
      if (nextState && p.bookmaker_key === target.bookmaker_key && p.week_number === target.week_number) {
        return { ...p, is_active: false };
      }
      return p;
    });

    persistPdfs(updated);
    triggerToast(
      `${target.bookmaker_name} Week ${target.week_number} coupon is now ${nextState ? 'ACTIVE & LIVE' : 'DRAFT/INACTIVE'}`,
      'info'
    );
  };

  const handleDelete = (id: string) => {
    const target = uploadedPdfs.find(p => p.id === id);
    if (!target) return;

    const updated = uploadedPdfs.filter(p => p.id !== id);
    persistPdfs(updated);

    // Call server to remove the uploaded PDF record only, without touching Supabase base tables
    fetch(`/api/admin-pdfs/${id}`, {
      method: 'DELETE'
    }).catch(() => {});

    triggerToast(`Deleted custom PDF '${target.file_name}'. Base Supabase fixture tables remain untouched.`, 'info');
  };

  const handleDownload = async (pdf: BookmakerPdfUpload) => {
    if (pdf.storage_path || pdf.storage_url) {
      try {
        triggerToast(`Fetching ${pdf.file_name} from Supabase Storage...`, 'info');
        const proxyUrl = `/api/admin-pdfs/download/${encodeURIComponent(pdf.bookmaker_key)}?path=${encodeURIComponent(pdf.storage_path || '')}&t=${Date.now()}`;
        const proxyRes = await fetch(proxyUrl, { cache: 'no-store' });
        if (proxyRes.ok) {
          const blob = await proxyRes.blob();
          const objUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objUrl;
          a.download = pdf.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
          triggerToast(`Downloaded ${pdf.file_name} from Supabase Storage`, 'success');
          return;
        }
      } catch (_) {}
    }
    if (pdf.storage_url) {
      try {
        const res = await fetch(`${pdf.storage_url}${pdf.storage_url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objUrl;
          a.download = pdf.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
          triggerToast(`Downloaded ${pdf.file_name} from Supabase Storage`, 'success');
          return;
        }
      } catch (_) {}
    }
    if (pdf.file_data_url) {
      const a = document.createElement('a');
      a.href = pdf.file_data_url;
      a.download = pdf.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      triggerToast(`Downloading ${pdf.file_name}...`, 'success');
    } else {
      triggerToast(`Simulating download for ${pdf.file_name}`, 'info');
    }
  };

  // Filtered PDFs list
  const filteredPdfs = uploadedPdfs.filter(p => {
    if (filterBookmaker !== 'all' && p.bookmaker_key !== filterBookmaker) return false;
    if (filterCountry !== 'all' && p.country.toLowerCase() !== filterCountry.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.file_name.toLowerCase().includes(q);
      const matchBookie = p.bookmaker_name.toLowerCase().includes(q);
      const matchWeek = String(p.week_number).includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchBookie && !matchWeek && !matchNotes) return false;
    }
    return true;
  });

  // Admin Guard: If non-admin, render strict restriction screen
  if (currentUser.role !== 'admin') {
    return (
      <div className="flex-1 p-6 md:p-10 flex items-center justify-center bg-[#070B14] min-h-[500px]">
        <div className="max-w-md w-full bg-slate-950 border border-rose-900/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black text-rose-400 tracking-widest uppercase block">
              Security Protocol 403
            </span>
            <h3 className="text-lg font-black text-white uppercase mt-1">
              Admin Access Restricted
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The <strong>Bookmaker PDF Upload & Management Console</strong> is strictly reserved for authenticated administrators. Your current persona is logged in as <code className="text-emerald-400 font-mono">@{currentUser.username || 'user'}</code> (Role: {currentUser.role}).
          </p>
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs font-mono space-y-1 text-slate-400">
            <div><strong>REQUIRED ROLE:</strong> <span className="text-rose-400 font-bold">admin</span></div>
            <div><strong>YOUR ROLE:</strong> <span className="text-amber-400 font-bold">{currentUser.role}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 md:p-8 bg-[#070B14] text-slate-100 overflow-y-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <UploadCloud className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] font-black rounded tracking-widest uppercase">
                  ADMINISTRATOR SUITE
                </span>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px] font-bold rounded">
                  ALL BOOKMAKERS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mt-1">
                Bookmaker PDF Upload Console
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload, manage, decrypt, and publish official coupon PDF documents for Nigerian & Ghanaian bookmakers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>LOGGED AS ADMIN: <strong className="text-emerald-400">@{currentUser.username}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Storage Bucket Architecture & Status Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5 sm:mt-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Supabase Storage Database
                </span>
                {loadingBuckets ? (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded animate-pulse">
                    Checking buckets...
                  </span>
                ) : availableBuckets.length > 0 ? (
                  availableBuckets.map(b => (
                    <span
                      key={b.id || b.name}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold rounded-lg shadow-sm"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      bucket: <strong>{b.name}</strong>
                      {b.public && <span className="text-[9px] uppercase px-1 bg-emerald-500/20 text-emerald-300 rounded font-black">Public</span>}
                    </span>
                  ))
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] rounded">
                    No buckets found or connection check pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-200">1 Bucket Architecture:</span>
                <span>You do <strong>not</strong> need a bucket per bookmaker. A single bucket (<code className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded border border-purple-800/40">pdf</code>) handles all bookmakers via folder subpaths:</span>
                <code className="text-[11px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  /pdf/[bookmaker]/week-[num]/[file].pdf
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={fetchBuckets}
              disabled={loadingBuckets}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh Supabase Storage Buckets list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBuckets ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Buckets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Upload Form (Left/Top) & Supported Bookmakers quick selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Bookmaker Selector & Form Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  1. Target Bookmaker
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {SUPPORTED_BOOKMAKERS.length} Supported Bookies
              </span>
            </div>

            {/* Bookmaker Pills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPORTED_BOOKMAKERS.map((bm) => {
                const isSelected = selectedBookmakerKey === bm.key;
                return (
                  <button
                    key={bm.key}
                    type="button"
                    onClick={() => setSelectedBookmakerKey(bm.key)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{bm.flag}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{bm.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 block">{bm.country}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Bookmaker Overview Tag */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedBookmaker.flag}</span>
                <div>
                  <span className="text-white font-bold block">{selectedBookmaker.name}</span>
                  <span className="text-[10px] text-emerald-400">Prefix: {selectedBookmaker.prefix} • {selectedBookmaker.country}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                READY FOR UPLOAD
              </span>
            </div>
          </div>

          {/* Upload Metadata Settings Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                2. Pool Week & Access Rules
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                  Pool Week Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                  Season / Year
                </label>
                <input
                  type="number"
                  min="2024"
                  max="2030"
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                Access Level Tier
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccessLevel('premium')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    accessLevel === 'premium'
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>VIP PREMIUM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccessLevel('free')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    accessLevel === 'free'
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>FREE PASS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                Admin Decryption / Coupon Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Official UK Aussie Week 50 Decrypted Coupon. Verified 12, 14, 21 draws sequence."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white font-mono outline-none transition resize-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="setActiveCheck"
                checked={setActiveImmediately}
                onChange={(e) => setSetActiveImmediately(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              />
              <label htmlFor="setActiveCheck" className="text-xs text-slate-300 font-mono cursor-pointer">
                Publish as <strong>ACTIVE Official Coupon</strong> immediately
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): File Drag-and-Drop Uploader & Live Queue */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form onSubmit={handleUploadSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  3. Select or Drop PDF File
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                .PDF ONLY (MAX 20MB)
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer select-none ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/20 scale-[0.99]'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                    <FileCheck className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-sm mx-auto">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs font-mono text-emerald-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Valid PDF Document
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] font-mono text-emerald-300 font-bold">
                    Click to choose a different PDF
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition">
                    <FileText className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Drag and drop your Bookmaker PDF here
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      or click to browse your computer files
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span>Supports A4 Single-Page & Multipage PDF Coupon Sheets</span>
                  </div>
                </>
              )}
            </div>

            {/* Upload Action Button */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="text-xs font-mono text-slate-400">
                Target: <strong className="text-white">{selectedBookmaker.name}</strong> • Week: <strong className="text-emerald-400">{weekNumber}</strong>
              </div>

              <div className="flex items-center gap-2">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileDataUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className={`px-6 py-3 rounded-xl font-black text-xs font-mono uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2 ${
                    !selectedFile || isUploading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40 active:scale-95'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FileUpIcon className="w-4 h-4" />
                      <span>Publish {selectedBookmaker.name} PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Total PDF Coupons</span>
              <span className="text-xl font-black text-white font-mono">{uploadedPdfs.length}</span>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block">Active / Live</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {uploadedPdfs.filter(p => p.is_active).length}
              </span>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-mono text-amber-400 uppercase block">Nigeria Bookies</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {uploadedPdfs.filter(p => p.country === 'Nigeria').length}
              </span>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-mono text-rose-400 uppercase block">Ghana Bookies</span>
              <span className="text-xl font-black text-rose-400 font-mono">
                {uploadedPdfs.filter(p => p.country === 'Ghana').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents Repository Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Uploaded Bookmaker PDF Repository
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database of uploaded coupon files, week releases, and subscriber access permissions.
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PDF files or notes..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono outline-none transition"
              />
            </div>

            <select
              value={filterBookmaker}
              onChange={(e) => setFilterBookmaker(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none cursor-pointer"
            >
              <option value="all">All Bookmakers</option>
              {SUPPORTED_BOOKMAKERS.map(b => (
                <option key={b.key} value={b.key}>{b.name}</option>
              ))}
            </select>

            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none cursor-pointer"
            >
              <option value="all">All Regions</option>
              <option value="Nigeria">Nigeria 🇳🇬</option>
              <option value="Ghana">Ghana 🇬🇭</option>
              <option value="International">International 🌐</option>
            </select>
          </div>
        </div>

        {/* PDF Repository Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Bookmaker</th>
                <th className="p-3.5">Week / Year</th>
                <th className="p-3.5">Document File</th>
                <th className="p-3.5">Tier</th>
                <th className="p-3.5">Uploaded By</th>
                <th className="p-3.5">Upload Date</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {filteredPdfs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                    No PDF documents match your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPdfs.map((pdf) => {
                  const bmInfo = SUPPORTED_BOOKMAKERS.find(b => b.key === pdf.bookmaker_key);
                  return (
                    <tr key={pdf.id} className="hover:bg-slate-900/50 transition">
                      {/* Bookmaker info */}
                      <td className="p-3.5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{bmInfo?.flag || '📄'}</span>
                          <div>
                            <span className="block">{pdf.bookmaker_name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">{pdf.country}</span>
                          </div>
                        </div>
                      </td>

                      {/* Week Number */}
                      <td className="p-3.5 font-mono">
                        <span className="bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10.5px] border border-slate-700">
                          Week {pdf.week_number}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">'{pdf.season_year}</span>
                      </td>

                      {/* File Name & Size */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate max-w-[200px]" title={pdf.file_name}>
                              {pdf.file_name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400">{pdf.file_size_formatted}</span>
                              {pdf.storage_url && (
                                <span className="px-1.5 py-0.2 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[8.5px] font-mono rounded font-bold" title={pdf.storage_url}>
                                  Supabase: {pdf.bucket_name || 'pdf'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="p-3.5">
                        {pdf.access_level === 'premium' ? (
                          <span className="bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase">
                            VIP PREMIUM
                          </span>
                        ) : (
                          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase">
                            FREE PASS
                          </span>
                        )}
                      </td>

                      {/* Uploaded By */}
                      <td className="p-3.5 font-mono text-slate-300">
                        @{pdf.uploaded_by}
                      </td>

                      {/* Upload Date */}
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        {new Date(pdf.uploaded_at).toLocaleDateString()}
                      </td>

                      {/* Live/Active Status */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(pdf.id)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider transition cursor-pointer border ${
                            pdf.is_active
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                          }`}
                          title="Click to toggle Active/Draft status"
                        >
                          {pdf.is_active ? '● LIVE ACTIVE' : '○ DRAFT'}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPdf(pdf)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                            title="Preview PDF Metadata & Content"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(pdf)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 rounded-lg border border-slate-700 transition cursor-pointer"
                            title="Download PDF File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(pdf.id)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-800 transition cursor-pointer"
                            title="Delete PDF Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-left">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-black text-emerald-400 uppercase">Document Inspection</h4>
                  <h3 className="text-sm font-bold text-white truncate max-w-md">{previewPdf.file_name}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewPdf(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Bookmaker</span>
                  <span className="text-white font-bold">{previewPdf.bookmaker_name}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Week / Season</span>
                  <span className="text-emerald-400 font-bold">Week {previewPdf.week_number} ({previewPdf.season_year})</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Region</span>
                  <span className="text-white font-bold">{previewPdf.country}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">File Size</span>
                  <span className="text-white font-bold">{previewPdf.file_size_formatted}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Uploaded By</span>
                  <span className="text-amber-400 font-bold">@{previewPdf.uploaded_by}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Access Tier</span>
                  <span className="text-emerald-400 font-bold uppercase">{previewPdf.access_level}</span>
                </div>
              </div>

              {previewPdf.notes && (
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Decryption & Release Notes
                  </span>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {previewPdf.notes}
                  </p>
                </div>
              )}

              {previewPdf.file_data_url && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-emerald-300">
                      Live Base64 PDF Binary attached in memory
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(previewPdf)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setPreviewPdf(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback icon helper
function FileUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 12v6" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}
