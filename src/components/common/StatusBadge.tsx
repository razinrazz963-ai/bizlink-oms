import React from 'react';
import { ApplicationStatus, PaymentStatus, PriorityLevel } from '../../types/index.js';

interface StatusBadgeProps {
  status: string;
  type?: 'application' | 'payment' | 'task' | 'priority' | 'document' | 'general';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'application' }) => {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'application') {
    switch (status as ApplicationStatus) {
      case 'NEW':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'DOCUMENTS PENDING':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'DOCUMENTS RECEIVED':
        badgeStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'SUBMITTED':
        badgeStyles = 'bg-cyan-50 text-cyan-800 border-cyan-200';
        break;
      case 'UNDER PROCESSING':
        badgeStyles = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'COMPLETED':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'CANCELLED':
        badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
  } else if (type === 'payment') {
    switch (status as PaymentStatus | string) {
      case 'Paid':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Partially Paid':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Pending':
      case 'Unpaid':
        badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'Refunded':
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  } else if (type === 'priority') {
    switch (status.toLowerCase() as PriorityLevel) {
      case 'urgent':
        badgeStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
        break;
      case 'high':
        badgeStyles = 'bg-amber-100 text-amber-800 border-amber-300';
        break;
      case 'medium':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'low':
        badgeStyles = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (type === 'document') {
    switch (status) {
      case 'valid':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'expiring_soon':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-300 font-medium';
        break;
      case 'expired':
        badgeStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
        break;
      case 'under_review':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
    }
  } else if (type === 'task') {
    switch (status) {
      case 'Completed':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'In Progress':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'To Do':
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles} whitespace-nowrap`}>
      {status}
    </span>
  );
};
