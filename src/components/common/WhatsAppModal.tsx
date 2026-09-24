import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { Send, Copy, Check, MessageSquare, Phone } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  trackingNumber?: string;
  serviceName?: string;
  expiryDocName?: string;
  expiryDays?: number;
  balanceDue?: number;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  trackingNumber = 'BL-2026-00001',
  serviceName = 'Visa Processing',
  expiryDocName = 'Passport',
  expiryDays = 15,
  balanceDue = 1500,
}) => {
  const [template, setTemplate] = useState<
    'submitted' | 'docs_required' | 'completed' | 'payment_reminder' | 'expiry_reminder'
  >('submitted');
  const [copied, setCopied] = useState(false);

  // Clean phone number for WhatsApp link (UAE default +971 if missing)
  const cleanPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '';
  const finalPhone = cleanPhone.startsWith('971')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `971${cleanPhone.substring(1)}`
    : `971${cleanPhone}`;

  const templates = {
    submitted: `Dear ${customerName},\n\nYour application for *${serviceName}* has been officially submitted by BizLink Services.\n\n📌 Tracking No: *${trackingNumber}*\nTrack your live status anytime here: https://portal.bizlink.ae/track/${trackingNumber}\n\nOur operations team in Dubai is actively handling your file. For questions, call +971 4 355 6789.\n\nBizLink Services - Operations Management`,
    docs_required: `Dear ${customerName},\n\nBizLink Operations requires additional documentation to proceed with your *${serviceName}* application (*${trackingNumber}*).\n\nPlease send us the required document scan/PDF at your earliest convenience to avoid government processing delays.\n\nThank you,\nBizLink Services Operations`,
    completed: `Dear ${customerName},\n\n🎉 Great news! Your application *${trackingNumber}* for *${serviceName}* has been COMPLETED and officially approved by the relevant UAE authorities.\n\nYour documents are ready for collection or digital download.\n\nThank you for choosing BizLink Services!`,
    payment_reminder: `Dear ${customerName},\n\nThis is a friendly reminder from BizLink Services regarding an outstanding balance of *AED ${balanceDue.toLocaleString()}* for *${serviceName}* (*${trackingNumber}*).\n\nPlease contact our finance desk at operations@bizlink.ae to settle the pending balance.\n\nBizLink Services - Finance Department`,
    expiry_reminder: `Urgent Expiry Notice:\n\nDear ${customerName},\n\nAccording to BizLink records, your *${expiryDocName}* is set to expire in approximately *${expiryDays} days*.\n\nTo ensure uninterrupted legal residency/business validity in the UAE, please initiate your renewal with BizLink today.\n\nBizLink Services Dubai | +971 4 355 6789`,
  };

  const messageText = templates[template];

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const waUrl = finalPhone
      ? `https://wa.me/${finalPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Notification Dispatcher"
      subtitle="Select a pre-formatted operational template to message the client directly"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Recipient Details */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <div className="text-xs text-slate-500">Recipient</div>
            <div className="text-sm font-semibold text-[#0B2541]">{customerName}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <Phone className="w-3.5 h-3.5 text-[#31B8C1]" />
            <span>{customerPhone || 'No phone provided'}</span>
          </div>
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Notification Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'submitted', label: 'Application Submitted' },
              { id: 'docs_required', label: 'Documents Required' },
              { id: 'completed', label: 'Application Completed' },
              { id: 'payment_reminder', label: 'Payment Reminder' },
              { id: 'expiry_reminder', label: 'Document Expiry' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id as any)}
                className={`text-xs font-medium px-3 py-2 rounded-lg border text-left transition-all ${
                  template === t.id
                    ? 'border-[#31B8C1] bg-[#31B8C1]/10 text-[#0B2541] font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Message Preview (UAE Formatted)
          </label>
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Message Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
