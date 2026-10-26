import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Clock, CheckCircle2, Send, FileText, Check, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  _id: string;
  action: string;
  from_state: string | null;
  to_state: string | null;
  performed_by: {
    name: string;
    email: string;
    role: string;
    organization: string;
  };
  notes: string;
  createdAt: string;
}

interface TimelineProps {
  rfqId: string;
}

export const Timeline: React.FC<TimelineProps> = ({ rfqId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getRFQTimeline(rfqId);
        if (isMounted) {
          setEvents(res.data.timeline || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load timeline');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTimeline();
    return () => {
      isMounted = false;
    };
  }, [rfqId]);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'CREATE_DRAFT':
        return { label: 'RFQ Draft Created', icon: <FileText className="h-3.5 w-3.5 text-[#727873]" />, color: 'bg-[#F4F5F3]' };
      case 'PUBLISH':
        return { label: 'Published to Regional Suppliers', icon: <Send className="h-3.5 w-3.5 text-[#245C46]" />, color: 'bg-[#EDF4EF]' };
      case 'SUBMIT_QUOTE':
        return { label: 'Quotation Received', icon: <Clock className="h-3.5 w-3.5 text-[#426A91]" />, color: 'bg-[#F0F4F8]' };
      case 'UPDATE_QUOTE':
        return { label: 'Quotation Revised', icon: <Clock className="h-3.5 w-3.5 text-[#426A91]" />, color: 'bg-[#F0F4F8]' };
      case 'SELECT_VENDOR':
        return { label: 'Vendor Selected & Approved', icon: <Check className="h-3.5 w-3.5 text-[#245C46]" />, color: 'bg-[#EDF4EF]' };
      case 'GENERATE_PO':
        return { label: 'Purchase Order Issued', icon: <CheckCircle2 className="h-3.5 w-3.5 text-[#245C46]" />, color: 'bg-[#EDF4EF]' };
      case 'CANCEL':
        return { label: 'RFQ Cancelled', icon: <AlertCircle className="h-3.5 w-3.5 text-[#B84040]" />, color: 'bg-[#FDF3F3]' };
      default:
        return { label: action.replace(/_/g, ' '), icon: <Clock className="h-3.5 w-3.5 text-[#727873]" />, color: 'bg-[#F4F5F3]' };
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-[4px] bg-[#FAFAF9] border border-[#E5E7E4] text-xs text-[#727873] text-center">
        Loading activity milestones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-[4px] bg-[#FDF3F3] border border-[#F1BABA] text-xs text-[#B84040]">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4 rounded-[4px] bg-[#FAFAF9] border border-[#E5E7E4] text-xs text-[#727873] text-center">
        No milestone events recorded yet.
      </div>
    );
  }

  return (
    <div className="rounded-[4px] bg-white border border-[#E5E7E4] p-4 text-xs">
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-[#E5E7E4]">
        {events.map((evt) => {
          const cfg = getActionConfig(evt.action);
          return (
            <div key={evt._id} className="relative flex items-start justify-between gap-3">
              {/* Dot / Icon */}
              <div
                className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full border border-[#E5E7E4] ${cfg.color} flex items-center justify-center`}
              >
                {cfg.icon}
              </div>

              {/* Event Content */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="font-semibold text-[#202522]">{cfg.label}</div>
                <div className="text-[11px] text-[#727873] truncate">
                  By {evt.performed_by?.name || 'System'} ({evt.performed_by?.organization || evt.performed_by?.role})
                </div>
                {evt.notes && (
                  <div className="text-[11px] text-[#4F5551] mt-0.5 leading-relaxed">
                    {evt.notes}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="text-[10px] text-[#8E948F] font-mono shrink-0 whitespace-nowrap mt-0.5">
                {formatDate(evt.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
