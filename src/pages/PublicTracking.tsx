import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api/client.js';

export const PublicTracking: React.FC = () => {
  const { trackingNumber: paramTracking } = useParams<{ trackingNumber?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(paramTracking || 'BL-2026-10001');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramTracking) {
      setInputCode(paramTracking);
      fetchTracking(paramTracking);
    }
  }, [paramTracking]);

  const fetchTracking = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await api.trackApplication(code.trim());
      setData(res);
    } catch (err: any) {
      setError(err.message || 'No application file found matching this tracking code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      fetchTracking(inputCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex flex-col justify-between">
      {/* Public Branded Header */}
      <header className="bg-[#0B2541] border-b border-[#102F52] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#071B30] p-2 rounded-xl border border-[#102F52] flex items-center gap-2">
              <img
                src="/bizlink-logo-square.png"
                alt="BizLink Icon"
                className="h-7 w-7 object-contain"
              />
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none">
                  <span className="font-extrabold text-base tracking-tight text-white">biz</span>
                  <span className="font-extrabold text-base tracking-tight text-[#31B8C1]">link</span>
                </div>
                <span className="text-[9px] text-[#31B8C1] font-semibold tracking-wider uppercase mt-0.5 leading-none">
                  Services
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-xs tracking-tight">Application Status Gateway</div>
              <div className="text-[10px] text-[#31B8C1] font-mono">Government Document Clearing • Dubai, UAE</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#102F52] hover:bg-[#102F52] transition-colors"
            >
              Employee Portal Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-16">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#31B8C1]/10 text-[#0B2541] text-xs font-semibold uppercase tracking-wider mb-3 border border-[#31B8C1]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#31B8C1]" />
            Official Client Verification Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2541] tracking-tight">
            Track Your Application Status
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Enter your BizLink tracking code (e.g., <span className="font-mono font-semibold text-[#0B2541]">BL-2026-10001</span>) to view real-time UAE government clearance stages.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter Tracking Number..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1] shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              {loading ? 'Checking...' : 'Track File'}
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3 mb-8">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tracking Error:</span> {error}
            </div>
          </div>
        )}

        {/* Tracking Result Card */}
        {data && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Details Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Application Reference
                </span>
                <h2 className="text-xl font-bold font-mono text-[#31B8C1] mt-0.5">
                  {data.trackingNumber}
                </h2>
                <div className="text-sm font-semibold text-[#0B2541] mt-1">{data.serviceName}</div>
                <div className="text-xs text-slate-500 mt-0.5">Applicant: {data.applicant}</div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Official Stage
                </span>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#31B8C1]/15 text-[#0B2541] border border-[#31B8C1]/30">
                  {data.status}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Last Updated: {new Date(data.updatedAt).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {/* Visual Step Timeline */}
            <div className="py-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541] mb-6">
                Verification & Government Clearance Progress
              </h3>

              <div className="relative">
                {/* Horizontal line for desktop */}
                <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                  {data.timeline.map((step: any, idx: number) => {
                    const isCompleted = step.state === 'completed';
                    const isCurrent = step.state === 'current';

                    return (
                      <div key={step.key} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-3 md:gap-2">
                        {/* Step Circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#31B8C1] text-white ring-4 ring-[#31B8C1]/20 font-bold'
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-[#0B2541]'
                                : isCompleted
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Help & Support Footer */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#31B8C1]" />
                <span>Need urgent assistance with this file? Contact BizLink Operations Desk.</span>
              </div>
              <div className="flex items-center gap-4 font-medium text-[#0B2541]">
                <a href="tel:+97143556789" className="hover:text-[#31B8C1] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#31B8C1]" />
                  <span>+971 4 355 6789</span>
                </a>
                <a href="mailto:operations@bizlink.ae" className="hover:text-[#31B8C1] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#31B8C1]" />
                  <span>operations@bizlink.ae</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} BizLink Services. Dubai, United Arab Emirates. All rights reserved.</p>
        <p className="text-[10px] text-slate-400 mt-1">Official Document Clearing & Business Setup Operations Portal</p>
      </footer>
    </div>
  );
};
