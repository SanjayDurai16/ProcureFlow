import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  FileText,
  FileSpreadsheet,
  PackageCheck,
  LogOut,
  Building2,
  MapPin,
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'rfqs'
  | 'quotations'
  | 'regional_rfqs'
  | 'my_quotes'
  | 'orders';

interface AppSidebarProps {
  currentNav: NavItemKey;
  onNavigate: (item: NavItemKey) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentNav,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Role-specific navigation items (BUYER and VENDOR only)
  const getNavItems = (): { key: NavItemKey; label: string; icon: React.ReactNode }[] => {
    switch (user.role) {
      case 'BUYER':
        return [
          { key: 'overview', label: 'Overview', icon: <Layers className="h-4 w-4" /> },
          { key: 'rfqs', label: 'My RFQs', icon: <FileText className="h-4 w-4" /> },
          { key: 'quotations', label: 'Quotations', icon: <FileSpreadsheet className="h-4 w-4" /> },
          { key: 'orders', label: 'Purchase Orders', icon: <PackageCheck className="h-4 w-4" /> },
        ];
      case 'VENDOR':
        return [
          { key: 'overview', label: 'Overview', icon: <Layers className="h-4 w-4" /> },
          { key: 'regional_rfqs', label: 'Regional RFQs', icon: <FileText className="h-4 w-4" /> },
          { key: 'my_quotes', label: 'My Quotations', icon: <FileSpreadsheet className="h-4 w-4" /> },
          { key: 'orders', label: 'Purchase Orders', icon: <PackageCheck className="h-4 w-4" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-[228px] shrink-0 border-r border-[#E5E7E4] bg-white flex flex-col justify-between h-screen sticky top-0 text-[#202522] select-none no-print">
      <div>
        {/* ProcureFlow Wordmark Header */}
        <div className="h-14 px-4 border-b border-[#E5E7E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-[4px] bg-[#245C46] flex items-center justify-center text-white text-[11px] font-bold tracking-tight">
              PF
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#202522]">ProcureFlow</span>
              <span className="text-[10px] text-[#727873] uppercase font-mono tracking-wider">MSME</span>
            </div>
          </div>
        </div>

        {/* Organization & Hub Switcher Bar */}
        <div className="p-3 border-b border-[#E5E7E4] bg-[#FAFAF9]">
          <div className="text-[11px] font-medium text-[#727873] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>Active Organization</span>
          </div>
          <div className="text-xs font-semibold text-[#202522] truncate" title={user.organization}>
            {user.organization}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#727873]">
            <MapPin className="h-2.5 w-2.5 text-[#245C46]" />
            <span>Hub: {user.region}</span>
          </div>
        </div>

        {/* Workspace Navigation */}
        <nav className="p-2 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E948F]">
            {user.role === 'BUYER' ? 'Buyer Workspace' : 'Vendor Portal'}
          </div>

          {navItems.map((item) => {
            const isActive = currentNav === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[5px] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EDF4EF] text-[#245C46] font-semibold'
                    : 'text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#245C46]' : 'text-[#8E948F]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: User profile & sign out */}
      <div className="border-t border-[#E5E7E4] p-3 bg-[#FAFAF9]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-[#202522] truncate">{user.name}</div>
            <div className="text-[11px] text-[#727873] font-mono capitalize">{user.role.toLowerCase()}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-[4px] text-[#727873] hover:text-[#B84040] hover:bg-white border border-transparent hover:border-[#E5E7E4] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
