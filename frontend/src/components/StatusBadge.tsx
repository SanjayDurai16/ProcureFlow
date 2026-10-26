import React from 'react';
import type { RFQStatus } from '../types';

interface StatusBadgeProps {
  status: RFQStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    DRAFT: {
      label: 'Draft',
      dot: 'bg-[#727873]',
      text: 'text-[#727873]',
      bg: 'bg-[#F4F5F3]',
      border: 'border-[#E5E7E4]',
    },
    OPEN: {
      label: 'Open for Bidding',
      dot: 'bg-[#245C46]',
      text: 'text-[#245C46]',
      bg: 'bg-[#EDF4EF]',
      border: 'border-[#BCD4C4]',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      dot: 'bg-[#A66B16]',
      text: 'text-[#A66B16]',
      bg: 'bg-[#FEF9EE]',
      border: 'border-[#ECD5A5]',
    },
    PENDING_APPROVAL: {
      label: 'Pending Approval',
      dot: 'bg-[#A66B16]',
      text: 'text-[#A66B16]',
      bg: 'bg-[#FEF9EE]',
      border: 'border-[#ECD5A5]',
    },
    APPROVED: {
      label: 'Approved',
      dot: 'bg-[#245C46]',
      text: 'text-[#245C46]',
      bg: 'bg-[#EDF4EF]',
      border: 'border-[#BCD4C4]',
    },
    REJECTED: {
      label: 'Rejected',
      dot: 'bg-[#B84040]',
      text: 'text-[#B84040]',
      bg: 'bg-[#FDF3F3]',
      border: 'border-[#F1BABA]',
    },
    PO_ISSUED: {
      label: 'PO Issued',
      dot: 'bg-[#245C46]',
      text: 'text-[#245C46]',
      bg: 'bg-[#EDF4EF]',
      border: 'border-[#BCD4C4]',
    },
    CANCELLED: {
      label: 'Cancelled',
      dot: 'bg-[#8E948F]',
      text: 'text-[#8E948F]',
      bg: 'bg-[#F4F5F3]',
      border: 'border-[#E5E7E4]',
    },
    // Quotations / Orders
    SUBMITTED: {
      label: 'Submitted',
      dot: 'bg-[#426A91]',
      text: 'text-[#426A91]',
      bg: 'bg-[#F0F5FA]',
      border: 'border-[#C2D5E8]',
    },
    ACCEPTED: {
      label: 'Accepted',
      dot: 'bg-[#245C46]',
      text: 'text-[#245C46]',
      bg: 'bg-[#EDF4EF]',
      border: 'border-[#BCD4C4]',
    },
    ISSUED: {
      label: 'PO Issued',
      dot: 'bg-[#245C46]',
      text: 'text-[#245C46]',
      bg: 'bg-[#EDF4EF]',
      border: 'border-[#BCD4C4]',
    },
    ACKNOWLEDGED: {
      label: 'Acknowledged',
      dot: 'bg-[#426A91]',
      text: 'text-[#426A91]',
      bg: 'bg-[#F0F5FA]',
      border: 'border-[#C2D5E8]',
    },
    FULFILLED: {
      label: 'Fulfilled',
      dot: 'bg-[#245C46]',
      text: 'text-[#245C46]',
      bg: 'bg-[#EDF4EF]',
      border: 'border-[#BCD4C4]',
    },
  };

  const item = config[status] || {
    label: status.replace(/_/g, ' '),
    dot: 'bg-[#727873]',
    text: 'text-[#727873]',
    bg: 'bg-[#F4F5F3]',
    border: 'border-[#E5E7E4]',
  };

  const sizeClass = size === 'sm' ? 'py-0.5 px-2 text-[11px]' : 'py-0.5 px-2.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[4px] border ${item.bg} ${item.text} ${item.border} ${sizeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      <span>{item.label}</span>
    </span>
  );
};
