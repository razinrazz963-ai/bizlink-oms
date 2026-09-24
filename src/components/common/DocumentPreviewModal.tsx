import React from 'react';
import { Modal } from './Modal.js';
import { StatusBadge } from './StatusBadge.js';
import { Download, Trash2, Calendar, FileText, User, Hash, CheckCircle, AlertTriangle } from 'lucide-react';
import { DocumentRecord } from '../../types/index.js';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  onDelete?: (id: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onDelete,
}) => {
  if (!document) return null;

  const handleDownload = () => {
    // Trigger download simulation
    const link = window.document.createElement('a');
    link.href = document.fileUrl || '#';
    link.download = document.documentName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.documentName}
      subtitle={`Type: ${document.documentType} • Uploaded by ${document.uploadedByName}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Document Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <StatusBadge status={document.status} type="document" />
            <span className="text-xs text-slate-500 font-mono">
              Size: {document.fileSize || '1.2 MB'}
            </span>
          </div>

          {document.expiryDate && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#31B8C1]" />
              <span>Expiry Date: <strong className="text-[#0B2541]">{document.expiryDate}</strong></span>
              {document.daysRemaining !== undefined && (
                <span className={`ml-1 text-[11px] px-1.5 py-0.5 rounded ${
                  document.daysRemaining < 0
                    ? 'bg-rose-100 text-rose-700 font-bold'
                    : document.daysRemaining <= 30
                    ? 'bg-amber-100 text-amber-700 font-semibold'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {document.daysRemaining < 0
                    ? `Expired ${Math.abs(document.daysRemaining)}d ago`
                    : `${document.daysRemaining} days remaining`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visual Document Viewer Area */}
        <div className="relative min-h-[260px] bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#0B2541] mb-3">
            <FileText className="w-8 h-8 text-[#31B8C1]" />
          </div>
          <h4 className="text-sm font-semibold text-[#0B2541]">{document.documentName}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Official scan on file for UAE government application processing.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs text-slate-600 border border-slate-200 shadow-2xs font-mono">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Verified Authentic
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs text-slate-600 border border-slate-200 shadow-2xs font-mono">
              PDF/A-1b Archival
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <User className="w-3.5 h-3.5 text-[#31B8C1]" />
              <span>Customer</span>
            </div>
            <div className="font-semibold text-[#0B2541]">{document.customerName}</div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Hash className="w-3.5 h-3.5 text-[#31B8C1]" />
              <span>Linked Application</span>
            </div>
            <div className="font-semibold text-[#0B2541]">
              {document.applicationTrackingNumber || 'General Customer Document'}
            </div>
          </div>
        </div>

        {document.notes && (
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
            <strong>Notes:</strong> {document.notes}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${document.documentName}"?`)) {
                  onDelete(document.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Document
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Document
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
