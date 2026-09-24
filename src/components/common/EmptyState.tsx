import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-dashed border-slate-200 rounded-xl my-4">
      <div className="w-14 h-14 rounded-2xl bg-[#0B2541]/5 flex items-center justify-center text-[#0B2541] mb-4 shadow-sm">
        <Icon className="w-7 h-7 stroke-[1.5] text-[#31B8C1]" />
      </div>
      <h3 className="text-lg font-semibold text-[#0B2541] mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#31B8C1] hover:bg-[#279CA4] text-white text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#31B8C1] focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};
