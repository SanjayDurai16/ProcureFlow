import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  warningNote,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202522]/40 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[6px] bg-white border border-[#E5E7E4] shadow-md p-5 text-[#202522]">
        <h3 className="text-sm font-semibold text-[#202522]">{title}</h3>
        <p className="text-xs text-[#727873] mt-2 leading-relaxed">{message}</p>

        {warningNote && (
          <div className="mt-3 p-2.5 rounded-[4px] bg-[#FEF9EE] border border-[#ECD5A5] text-[12px] text-[#A66B16] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{warningNote}</span>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#E5E7E4] flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="h-8 px-3 rounded-[4px] border border-[#E5E7E4] text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9] font-medium transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`h-8 px-4 rounded-[4px] font-medium text-white transition-colors flex items-center gap-1.5 ${
              variant === 'danger'
                ? 'bg-[#B84040] hover:bg-[#9B3232]'
                : 'bg-[#245C46] hover:bg-[#1B4937]'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
