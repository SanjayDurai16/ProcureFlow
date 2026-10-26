import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw } from 'lucide-react';

interface AppHeaderProps {
  breadcrumbs: string[];
  actionLabel?: string;
  onActionClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  breadcrumbs,
  actionLabel,
  onActionClick,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-14 px-6 border-b border-[#E5E7E4] bg-white flex items-center justify-between shrink-0 sticky top-0 z-30 no-print">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-[#8E948F]">/</span>}
              <span className={isLast ? 'font-semibold text-[#202522]' : 'text-[#727873]'}>
                {crumb}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {/* Right Actions & Status Badges */}
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data"
            className="h-8 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9] text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {actionLabel && onActionClick && user?.role === 'BUYER' && (
          <button
            type="button"
            onClick={onActionClick}
            className="h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};
