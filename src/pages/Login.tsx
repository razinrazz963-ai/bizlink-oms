import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '../components/common/Modal.js';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // Frontend-only Temporary Demo Authentication
    if (cleanEmail === 'demo@bizlink.ae') {
      if (password === 'Demo@12345') {
        enterDemoMode();
        navigate('/dashboard');
        return;
      } else {
        setError('Invalid demo credentials.');
        setLoading(false);
        return;
      }
    }

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F8FA]">
      {/* Left Side: BizLink Brand Panel (Dark Navy #0B2541) */}
      <div className="md:w-1/2 bg-[#0B2541] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-[#102F52]">
        {/* Background Subtle Highlights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#31B8C1]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#102F52]/60 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10">
          {/* Logo & Brand Identity */}
          <div className="inline-flex items-center gap-3 bg-[#071B30] p-3 pr-5 rounded-2xl border border-[#102F52] shadow-md mb-8">
            <img
              src="/bizlink-logo-square.png"
              alt="BizLink Icon"
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <div className="flex items-baseline leading-none">
                <span className="font-extrabold text-2xl tracking-tight text-white">biz</span>
                <span className="font-extrabold text-2xl tracking-tight text-[#31B8C1]">link</span>
              </div>
              <span className="text-[11px] text-[#31B8C1] font-semibold tracking-wider uppercase mt-0.5 leading-none">
                Services
              </span>
            </div>
          </div>

          <div className="space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#31B8C1]/15 text-[#31B8C1] text-xs font-semibold tracking-wide uppercase border border-[#31B8C1]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#31B8C1]" />
              Internal Business Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              BizLink Operations <br />
              <span className="text-[#31B8C1]">Management System (OMS)</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed pt-2">
              Internal business management, customer relations, UAE government document clearing, visa processing, and invoicing portal for BizLink personnel.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-8 space-y-4 max-w-md hidden sm:block">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded bg-[#31B8C1]/20 text-[#31B8C1] mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Centralized Client & Application Pipeline</h4>
              <p className="text-[11px] text-slate-400">Track UAE visa processing, Amer, Tasheel, and Emirates ID files end-to-end.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 rounded bg-[#31B8C1]/20 text-[#31B8C1] mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Automated Expiry & Document Vault</h4>
              <p className="text-[11px] text-slate-400">7, 15, 30, and 60-day expiry radar for passports and residency visas.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 rounded bg-[#31B8C1]/20 text-[#31B8C1] mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">UAE VAT Tax Invoicing & Receipting</h4>
              <p className="text-[11px] text-slate-400">FTA-compliant official tax invoices with automated VAT calculation.</p>
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="relative z-10 pt-6 border-t border-[#102F52] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#31B8C1]" />
            <span>Authorized Personnel Only • Dubai, UAE</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">BizLink OMS</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-slate-200/80 p-8 sm:p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0B2541] tracking-tight">Staff Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your corporate credentials to access the operations console.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@bizlink.ae"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#31B8C1] focus:ring-[#31B8C1]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#31B8C1] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#31B8C1] focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Operations Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Demo Login Option */}
            <div className="pt-3 border-t border-slate-100 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('demo@bizlink.ae');
                  setPassword('Demo@12345');
                  setError('');
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#31B8C1]" />
                <span>Fill Demo Login Credentials</span>
              </button>
              <span className="text-[10px] text-slate-400 mt-1">
                Demo access: demo@bizlink.ae / Demo@12345
              </span>
            </div>
          </form>

          {/* Public Tracking Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Are you a client looking to track an application?{' '}
              <a href="/track" className="text-[#31B8C1] font-semibold hover:underline">
                Public Tracking Portal →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Account Recovery"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            For security reasons, employee account credentials must be reset by a System Administrator.
          </p>
          <p>
            Please contact your system administrator or email <span className="font-semibold text-[#0B2541]">operations@bizlink.ae</span> with your Employee ID for a secure password reset.
          </p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowForgotModal(false)}
              className="px-4 py-2 bg-[#0B2541] text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
