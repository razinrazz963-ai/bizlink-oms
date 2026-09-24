import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FileText, Folder, CreditCard, Receipt, X, ArrowRight } from 'lucide-react';
import { api } from '../../api/client.js';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: any[];
    applications: any[];
    documents: any[];
    invoices: any[];
    payments: any[];
    totalMatches: number;
  }>({
    customers: [],
    applications: [],
    documents: [],
    invoices: [],
    payments: [],
    totalMatches: 0,
  });

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ customers: [], applications: [], documents: [], invoices: [], payments: [], totalMatches: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], applications: [], documents: [], invoices: [], payments: [], totalMatches: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchGlobal(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-[#0B2541]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        <div
          className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across customers, applications, passport, Emirates ID, invoices..."
              className="w-full bg-transparent text-sm text-[#0B2541] placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="ml-3 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 rounded">
              ESC
            </span>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {loading && (
              <div className="py-8 text-center text-sm text-slate-400">Searching BizLink database...</div>
            )}

            {!loading && query && results.totalMatches === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-600">No records found matching "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Try searching by Customer ID, Passport, Emirates ID, or Application reference.</p>
              </div>
            )}

            {!loading && !query && (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">Type to search BizLink database records...</p>
                <div className="flex justify-center gap-2 mt-3 text-xs text-slate-400">
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-100">Customers</span>
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-100">Applications</span>
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-100">Documents</span>
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-100">Invoices</span>
                </div>
              </div>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#31B8C1]" /> Customers ({results.customers.length})
                </div>
                <div className="space-y-1 mt-1">
                  {results.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(`/customers/${c.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#0B2541] group-hover:text-[#31B8C1]">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-mono">{c.customerCode}</span>
                          <span>•</span>
                          <span>{c.phone}</span>
                          {c.nationality && (
                            <>
                              <span>•</span>
                              <span>{c.nationality}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#31B8C1] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Applications */}
            {results.applications.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#31B8C1]" /> Applications ({results.applications.length})
                </div>
                <div className="space-y-1 mt-1">
                  {results.applications.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSelect(`/applications/${a.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#0B2541] group-hover:text-[#31B8C1] flex items-center gap-2">
                          <span className="font-mono text-[#31B8C1]">{a.trackingNumber}</span>
                          <span>-</span>
                          <span>{a.serviceName}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Applicant: <span className="font-medium text-slate-700">{a.customerName}</span> | Status: {a.status}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#31B8C1] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {results.documents.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-[#31B8C1]" /> Documents ({results.documents.length})
                </div>
                <div className="space-y-1 mt-1">
                  {results.documents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelect(`/documents`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#0B2541] group-hover:text-[#31B8C1]">
                          {d.documentName} ({d.documentType})
                        </div>
                        <div className="text-xs text-slate-500">
                          Customer: {d.customerName} {d.expiryDate ? `| Expires: ${d.expiryDate}` : ''}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#31B8C1]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {results.invoices.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#31B8C1]" /> Invoices ({results.invoices.length})
                </div>
                <div className="space-y-1 mt-1">
                  {results.invoices.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => handleSelect(`/invoices/${i.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#0B2541] group-hover:text-[#31B8C1] flex items-center gap-2">
                          <span className="font-mono">{i.invoiceNumber}</span>
                          <span>-</span>
                          <span>AED {i.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Customer: {i.customerName} | Status: {i.status}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#31B8C1]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
