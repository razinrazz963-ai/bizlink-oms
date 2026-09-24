import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Mail,
  Phone,
  Receipt,
  Shield,
  Save,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../api/client.js';
import { CompanySettings } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const Settings: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'BizLink Services',
    subtitle: 'Operations Management System',
    registrationNumber: '',
    trn: '',
    vatEnabled: false,
    vatRate: 5,
    address: '',
    city: 'Dubai',
    country: 'United Arab Emirates',
    phone: '',
    email: '',
    website: '',
    currency: 'AED',
    invoicePrefix: 'INV-2026-',
    receiptPrefix: 'REC-2026-',
    applicationPrefix: 'BL-2026-',
    customerPrefix: 'BLC-',
    employeePrefix: 'BL-EMP-',
    invoiceFooterNote: 'Thank you for choosing BizLink Services.',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only administrators can update corporate settings');
      return;
    }

    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Corporate & Portal Settings</h1>
          <p className="text-xs text-slate-500">
            Configurable UAE trade license details, TRN tax number, prefixes, and invoice terms
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity Preview Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-[#31B8C1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541]">
              Brand Identity & Logos
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#0B2541] rounded-2xl">
            <div className="bg-[#071B30] p-3 rounded-xl border border-[#102F52]">
              <img
                src="/bizlink-logo-horizontal.png"
                alt="BizLink Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="text-white text-xs space-y-1">
              <div className="font-bold text-sm text-[#31B8C1]">Official BizLink Logo Active</div>
              <p className="text-slate-300">
                Loaded from the provided brand screenshot assets (horizontal banner and square emblem).
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Asset path: public/bizlink-logo-horizontal.png
              </p>
            </div>
          </div>
        </div>

        {/* Company & Legal Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-[#31B8C1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541]">
              Legal & Business Information (UAE)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Portal Subtitle
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                UAE Tax Registration Number (TRN / VAT)
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.trn}
                onChange={(e) => setSettings({ ...settings, trn: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                DET License / Registration Reference
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.registrationNumber}
                onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Registered Dubai Office Address
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Corporate Phone
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Operations Email
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Website
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Prefix Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-[#31B8C1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541]">
              Invoicing & Reference Prefixes
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Application Prefix
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.applicationPrefix}
                onChange={(e) => setSettings({ ...settings, applicationPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Prefix
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.customerPrefix}
                onChange={(e) => setSettings({ ...settings, customerPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                  VAT Rate (%)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={settings.vatEnabled}
                    onChange={(e) => setSettings({ ...settings, vatEnabled: e.target.checked })}
                    className="rounded text-[#31B8C1] focus:ring-[#31B8C1]"
                  />
                  <span className="text-[11px] font-semibold text-slate-600">Enable VAT</span>
                </label>
              </div>
              <input
                type="number"
                disabled={!isAdmin || !settings.vatEnabled}
                value={settings.vatRate}
                onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Invoice Terms & Legal Footer Note
            </label>
            <textarea
              rows={2}
              disabled={!isAdmin}
              value={settings.invoiceFooterNote}
              onChange={(e) => setSettings({ ...settings, invoiceFooterNote: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:opacity-60"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Corporate Configuration</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
