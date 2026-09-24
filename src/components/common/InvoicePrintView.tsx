import React from 'react';
import { Printer, Download, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { Invoice, CompanySettings, Customer } from '../../types/index.js';

interface InvoicePrintViewProps {
  invoice: Invoice;
  company: CompanySettings;
  customer?: Customer;
  onBack?: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  company,
  customer,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar - hidden during print */}
      <div className="no-print flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </button>
          )}
          <span className="text-sm font-semibold text-[#0B2541]">
            Official Tax Invoice: <span className="font-mono text-[#31B8C1]">{invoice.invoiceNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2541] hover:bg-[#102F52] text-white text-xs font-medium rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Tax Invoice
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-medium rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="invoice-card bg-white rounded-2xl border border-slate-200 shadow-card p-8 sm:p-12 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none">
        {/* Header: Exact BizLink Logo + Tax Invoice Label */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-8 gap-6">
          <div>
            <div className="bg-[#0B2541] p-3 rounded-xl inline-block shadow-sm">
              <img
                src="/bizlink-logo-horizontal.png"
                alt="BizLink Services Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="text-xs text-slate-500 mt-3 space-y-0.5">
              <p className="font-semibold text-[#0B2541]">{company.companyName}</p>
              <p>{company.address}</p>
              <p>{company.city}, {company.country}</p>
              <p>Phone: {company.phone} | Email: {company.email}</p>
              <p className="font-mono text-slate-700 font-medium">TRN (VAT): {company.trn}</p>
            </div>
          </div>

          <div className="sm:text-right">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0B2541]">
              TAX INVOICE
            </h1>
            <p className="text-xs font-mono text-[#31B8C1] font-semibold mt-1">
              {invoice.invoiceNumber}
            </p>

            <div className="mt-4 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Issue Date: </span>
                <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
              </div>
              <div>
                <span className="text-slate-400">Due Date: </span>
                <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
              </div>
              {invoice.applicationTrackingNumber && (
                <div>
                  <span className="text-slate-400">Tracking Ref: </span>
                  <span className="font-mono font-semibold text-[#31B8C1]">
                    {invoice.applicationTrackingNumber}
                  </span>
                </div>
              )}
              <div className="pt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.status === 'Partially Paid'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  Status: {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To & Client Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h3 className="font-semibold uppercase tracking-wider text-[#0B2541] mb-2">
              Bill To (Client / Organization)
            </h3>
            <div className="space-y-1 text-slate-700">
              <p className="font-bold text-sm text-[#0B2541]">{invoice.customerName}</p>
              {customer?.companyName && <p className="font-medium text-slate-600">{customer.companyName}</p>}
              <p>{invoice.customerAddress || customer?.address || 'Dubai, United Arab Emirates'}</p>
              <p>Phone: {invoice.customerPhone || customer?.phone || 'N/A'}</p>
              <p>Email: {invoice.customerEmail || customer?.email || 'N/A'}</p>
              {customer?.emiratesId && (
                <p className="font-mono text-slate-500">Emirates ID: {customer.emiratesId}</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h3 className="font-semibold uppercase tracking-wider text-[#0B2541] mb-2">
              Payment & Authority Details
            </h3>
            <div className="space-y-1 text-slate-700">
              <p><span className="text-slate-500">Jurisdiction:</span> United Arab Emirates</p>
              <p><span className="text-slate-500">Currency:</span> AED (United Arab Emirates Dirham)</p>
              <p><span className="text-slate-500">Payment Terms:</span> {invoice.paymentTerms || 'Due on receipt'}</p>
              <p className="pt-2 flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                FTA Compliant UAE E-Tax Document
              </p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-[#0B2541] text-[#0B2541] font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Description of Professional Service</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price (AED)</th>
                <th className="py-3 px-3 text-right">Total (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-[#0B2541]">{item.description}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                    {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-[#0B2541]">
                    {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Box */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6">
          <div className="max-w-xs text-xs text-slate-500 space-y-2">
            <h4 className="font-semibold text-slate-700 uppercase tracking-wider">Terms & Notes</h4>
            <p className="leading-relaxed">
              {invoice.notes || company.invoiceFooterNote}
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              Prepared by: <span className="font-medium text-slate-600">{invoice.createdByName}</span>
            </div>
          </div>

          <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">AED {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>UAE VAT ({invoice.vatRate}%):</span>
              <span className="font-mono">AED {invoice.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-[#0B2541]">
              <span>Total Amount:</span>
              <span className="font-mono text-[#0B2541]">AED {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Amount Paid:</span>
              <span className="font-mono">AED {(invoice.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-bold text-sm text-rose-700">
              <span>Balance Due:</span>
              <span className="font-mono">AED {invoice.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Signatures & Corporate Seal Placeholder */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500">
          <div>
            <div className="h-12 border-b border-slate-300 border-dashed mb-2" />
            <p className="font-medium text-slate-700">Client Signature & Acknowledgement</p>
          </div>
          <div className="text-right">
            <div className="h-12 border-b border-slate-300 border-dashed mb-2 flex items-end justify-end">
              <span className="text-[11px] font-mono text-[#31B8C1]">BizLink Services Authorized Signatory</span>
            </div>
            <p className="font-medium text-slate-700">Authorized Officer / Finance Controller</p>
          </div>
        </div>
      </div>
    </div>
  );
};
