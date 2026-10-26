import React, { useState, useEffect, useMemo } from 'react';
import type { RFQ, Quotation, User } from '../types';
import { api } from '../services/api';
import { formatDate, formatINR, getDaysRemaining } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import {
  Search,
  FileSpreadsheet,
  Clock,
  MapPin,
} from 'lucide-react';

interface VendorDashboardProps {
  user: User;
  subView: 'overview' | 'regional_rfqs' | 'my_quotes';
  onNavigateToFeed: () => void;
  onNavigateToQuotes?: () => void;
  onNavigateToOrders: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  user,
  subView,
  onNavigateToFeed,
  onNavigateToOrders,
}) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [myQuotes, setMyQuotes] = useState<{ rfq: RFQ; quote: Quotation }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<RFQ | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('MY_REGION');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchVendorData = async () => {
    try {
      const res = await api.getRFQs();
      const openRfqs = res.data.rfqs;
      setRfqs(openRfqs);

      // Load vendor quotes across these RFQs
      const quotesList: { rfq: RFQ; quote: Quotation }[] = [];
      await Promise.all(
        openRfqs.map(async (rfq: RFQ) => {
          try {
            const qRes = await api.getQuotationsForRFQ(rfq._id);
            if (qRes.data.quotes && qRes.data.quotes.length > 0) {
              const myQ = qRes.data.quotes.find(
                (q: Quotation) =>
                  q.vendor_id.id === user.id ||
                  q.vendor_id._id === user.id ||
                  (typeof q.vendor_id === 'string' && q.vendor_id === user.id)
              );
              if (myQ) quotesList.push({ rfq, quote: myQ });
            }
          } catch {
            // Ignore error for RFQs where vendor cannot view
          }
        })
      );
      setMyQuotes(quotesList);
    } catch (err) {
      console.error('Failed to load RFQs for vendor', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  // Filtered RFQs feed
  const filteredRfqs = useMemo(() => {
    return rfqs.filter((rfq) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = rfq.rfq_number?.toLowerCase().includes(term);
        const matchesTitle = rfq.title?.toLowerCase().includes(term);
        if (!matchesNum && !matchesTitle) return false;
      }
      if (regionFilter === 'MY_REGION' && rfq.region.toLowerCase() !== user.region.toLowerCase()) {
        return false;
      }
      if (regionFilter !== 'ALL' && regionFilter !== 'MY_REGION' && rfq.region.toLowerCase() !== regionFilter.toLowerCase()) {
        return false;
      }
      if (categoryFilter !== 'ALL' && rfq.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [rfqs, searchTerm, regionFilter, categoryFilter, user.region]);

  const localMatchesCount = useMemo(
    () => rfqs.filter((r) => r.region.toLowerCase() === user.region.toLowerCase()).length,
    [rfqs, user.region]
  );

  const categories = useMemo(() => Array.from(new Set(rfqs.map((r) => r.category))), [rfqs]);

  // OVERVIEW SUBVIEW
  if (subView === 'overview') {
    const recentFeed = rfqs.slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7E4]">
          <div>
            <h1 className="text-base font-semibold text-[#202522]">Vendor Overview</h1>
            <p className="text-xs text-[#727873] mt-0.5">
              Regional procurement opportunities, active quotation status, and commercial fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#EDF4EF] border border-[#BCD4C4] text-xs text-[#245C46]">
            <MapPin className="h-3 w-3" />
            <span>Designated Hub: <strong>{user.region}</strong></span>
          </div>
        </div>

        {/* Metric summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Open Regional RFQs</span>
            <div className="font-mono text-xl font-bold text-[#202522] tabular-nums mt-1">
              {rfqs.length}
            </div>
            <span className="text-[10px] text-[#727873]">Available bidding opportunities</span>
          </div>

          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Local Hub Matches</span>
            <div className="font-mono text-xl font-bold text-[#245C46] tabular-nums mt-1">
              {localMatchesCount}
            </div>
            <span className="text-[10px] text-[#727873]">Proximity-optimized ({user.region})</span>
          </div>

          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Quotations Submitted</span>
            <div className="font-mono text-xl font-bold text-[#426A91] tabular-nums mt-1">
              {myQuotes.length}
            </div>
            <span className="text-[10px] text-[#727873]">Active proposals</span>
          </div>

          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Selected / Accepted</span>
            <div className="font-mono text-xl font-bold text-[#245C46] tabular-nums mt-1">
              {myQuotes.filter((q) => q.quote.status === 'ACCEPTED').length}
            </div>
            <span className="text-[10px] text-[#727873]">Contracts awarded</span>
          </div>
        </div>

        {/* Recent Feed Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-semibold text-[#202522]">Latest Procurement Opportunities</h2>
            <button
              type="button"
              onClick={onNavigateToFeed}
              className="text-[#245C46] hover:text-[#1B4937] font-medium text-xs flex items-center gap-1"
            >
              <span>View full feed ({rfqs.length})</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#727873]">Loading opportunities...</div>
          ) : recentFeed.length === 0 ? (
            <div className="p-8 rounded-[4px] border border-[#E5E7E4] bg-white text-center text-xs text-[#727873]">
              No open RFQs available in this region currently.
            </div>
          ) : (
            <div className="rounded-[6px] border border-[#E5E7E4] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left enterprise-table">
                  <thead>
                    <tr>
                      <th className="w-28">RFQ #</th>
                      <th>Requirement Title</th>
                      <th className="text-right">Quantity</th>
                      <th>Hub</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7E4]">
                    {recentFeed.map((rfq) => {
                      const isLocal = rfq.region.toLowerCase() === user.region.toLowerCase();
                      return (
                        <tr key={rfq._id}>
                          <td className="font-mono text-xs font-semibold text-[#727873]">
                            {rfq.rfq_number}
                          </td>
                          <td>
                            <div className="font-medium text-[#202522] truncate max-w-sm">
                              {rfq.title}
                            </div>
                            <span className="text-[11px] text-[#727873]">{rfq.category}</span>
                          </td>
                          <td className="text-right font-mono tabular-nums text-xs">
                            {rfq.quantity} {rfq.unit}
                          </td>
                          <td>
                            <span className="text-xs text-[#727873] flex items-center gap-1">
                              {rfq.region}
                              {isLocal && (
                                <span className="text-[10px] text-[#245C46] font-medium bg-[#EDF4EF] px-1 py-0.2 rounded-[2px]">
                                  Local
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="text-xs text-[#727873]">
                            {formatDate(rfq.deadline)}
                          </td>
                          <td>
                            <StatusBadge status={rfq.status} size="sm" />
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRfqForQuote(rfq)}
                              className="text-xs font-medium text-[#245C46] hover:text-[#1B4937]"
                            >
                              Quote
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedRfqForQuote && (
          <QuotationBuilderModal
            rfq={selectedRfqForQuote}
            onClose={() => setSelectedRfqForQuote(null)}
            onSubmitted={() => {
              setSelectedRfqForQuote(null);
              fetchVendorData();
              alert('Quotation submitted successfully!');
            }}
          />
        )}
      </div>
    );
  }

  // MY QUOTES SUBVIEW (subView === 'my_quotes')
  if (subView === 'my_quotes') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7E4]">
          <div>
            <h1 className="text-base font-semibold text-[#202522]">My Submitted Quotations</h1>
            <p className="text-xs text-[#727873] mt-0.5">
              Track vendor proposal evaluation, contract selection, and unit pricing terms.
            </p>
          </div>
          <span className="text-xs text-[#727873]">
            {myQuotes.length} {myQuotes.length === 1 ? 'quotation' : 'quotations'} submitted
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#727873]">Loading your submitted quotations...</div>
        ) : myQuotes.length === 0 ? (
          <div className="p-12 rounded-[6px] border border-[#E5E7E4] bg-white text-center">
            <FileSpreadsheet className="h-8 w-8 text-[#8E948F] mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-[#202522]">No quotations submitted yet</h3>
            <p className="text-[11px] text-[#727873] mt-1">
              Browse the Regional RFQ Feed to inspect buyer requirements and submit volume quotes.
            </p>
            <button
              type="button"
              onClick={onNavigateToFeed}
              className="mt-3 h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              Browse Regional Feed
            </button>
          </div>
        ) : (
          <div className="rounded-[6px] border border-[#E5E7E4] bg-white overflow-hidden text-xs">
            <table className="w-full text-left enterprise-table">
              <thead>
                <tr>
                  <th className="w-28">RFQ #</th>
                  <th>Requirement</th>
                  <th className="text-right">Evaluated Unit Price</th>
                  <th className="text-right">Total Evaluated Spend</th>
                  <th className="text-center">Lead Time</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7E4]">
                {myQuotes.map(({ rfq, quote }) => (
                  <tr key={quote._id}>
                    <td className="font-mono font-semibold text-[#727873]">
                      {rfq.rfq_number}
                    </td>
                    <td>
                      <div className="font-semibold text-[#202522] truncate max-w-sm">
                        {rfq.title}
                      </div>
                      <span className="text-[11px] text-[#727873]">
                        {rfq.quantity} {rfq.unit} • {rfq.region}
                      </span>
                    </td>
                    <td className="text-right font-mono tabular-nums text-xs">
                      {formatINR(quote.evaluated_unit_price)}
                    </td>
                    <td className="text-right font-mono tabular-nums font-semibold text-xs text-[#202522]">
                      {formatINR(quote.evaluated_total_price)}
                    </td>
                    <td className="text-center font-mono tabular-nums text-xs">
                      {quote.lead_time_days} days
                    </td>
                    <td className="text-[#727873]">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td>
                      <StatusBadge status={quote.status} size="sm" />
                    </td>
                    <td className="text-right">
                      {rfq.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => setSelectedRfqForQuote(rfq)}
                          className="text-xs font-medium text-[#245C46] hover:text-[#1B4937]"
                        >
                          Revise Quote
                        </button>
                      )}
                      {quote.status === 'ACCEPTED' && rfq.status === 'PO_ISSUED' && (
                        <button
                          type="button"
                          onClick={onNavigateToOrders}
                          className="text-xs font-medium text-[#426A91] hover:underline"
                        >
                          View PO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quotation Builder Modal */}
        {selectedRfqForQuote && (
          <QuotationBuilderModal
            rfq={selectedRfqForQuote}
            onClose={() => setSelectedRfqForQuote(null)}
            onSubmitted={() => {
              setSelectedRfqForQuote(null);
              fetchVendorData();
              alert('Quotation submitted successfully!');
            }}
          />
        )}
      </div>
    );
  }

  // REGIONAL RFQS FEED (subView === 'regional_rfqs')
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7E4]">
        <div>
          <h1 className="text-base font-semibold text-[#202522]">Regional RFQ Feed</h1>
          <p className="text-xs text-[#727873] mt-0.5">
            Verified purchasing requirements published by MSMEs in your local and neighboring industrial hubs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#EDF4EF] border border-[#BCD4C4] text-xs text-[#245C46]">
          <MapPin className="h-3 w-3" />
          <span>Home Hub: <strong>{user.region}</strong> ({localMatchesCount} local)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 text-[#8E948F] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or RFQ number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] placeholder:text-[#8E948F] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#727873]">Hub Filter:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            >
              <option value="MY_REGION">My Region Only ({user.region})</option>
              <option value="ALL">All Regional Hubs</option>
              <option value="Chennai">Chennai</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Bangalore">Bangalore</option>
            </select>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#727873]">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <span className="text-[11px] text-[#727873]">
          Showing {filteredRfqs.length} open opportunities
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#727873]">Loading regional opportunities...</div>
      ) : filteredRfqs.length === 0 ? (
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white p-12 text-center">
          <Clock className="h-8 w-8 text-[#8E948F] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-[#202522]">No active RFQs match your filters</h3>
          <p className="text-[11px] text-[#727873] mt-1">
            Try switching hub filter to "All Regional Hubs" to discover opportunities across neighboring industrial centers.
          </p>
        </div>
      ) : (
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left enterprise-table">
              <thead>
                <tr>
                  <th className="w-28">RFQ #</th>
                  <th>Requirement Title & Specifications</th>
                  <th className="text-right">Volume</th>
                  <th>Category</th>
                  <th>Target Hub</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7E4]">
                {filteredRfqs.map((rfq) => {
                  const isLocal = rfq.region.toLowerCase() === user.region.toLowerCase();
                  const remaining = getDaysRemaining(rfq.deadline);

                  return (
                    <tr key={rfq._id}>
                      <td className="font-mono text-xs font-semibold text-[#727873]">
                        {rfq.rfq_number}
                      </td>
                      <td>
                        <div className="font-semibold text-[#202522]">
                          {rfq.title}
                        </div>
                        <p className="text-[11px] text-[#727873] line-clamp-1 max-w-md mt-0.5" title={rfq.description}>
                          {rfq.description}
                        </p>
                      </td>
                      <td className="text-right font-mono tabular-nums text-xs font-medium">
                        {rfq.quantity} {rfq.unit}
                      </td>
                      <td className="text-xs text-[#727873]">{rfq.category}</td>
                      <td>
                        <span className="text-xs text-[#202522] flex items-center gap-1">
                          {rfq.region}
                          {isLocal && (
                            <span className="text-[10px] text-[#245C46] font-medium bg-[#EDF4EF] border border-[#BCD4C4] px-1 py-0.2 rounded-[2px]">
                              Local Match
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-xs">
                        <span className="text-[#202522]">{formatDate(rfq.deadline)}</span>
                        <span className="text-[10px] text-[#727873] block">
                          {remaining.isOverdue ? 'Overdue' : `${remaining.days}d left`}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={rfq.status} size="sm" />
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRfqForQuote(rfq)}
                          className="h-7 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-xs font-medium transition-colors"
                        >
                          Submit Quote
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quotation Builder Modal */}
      {selectedRfqForQuote && (
        <QuotationBuilderModal
          rfq={selectedRfqForQuote}
          onClose={() => setSelectedRfqForQuote(null)}
          onSubmitted={() => {
            setSelectedRfqForQuote(null);
            fetchVendorData();
            alert('Quotation submitted successfully! The buyer will evaluate your offer in their quotation matrix.');
          }}
        />
      )}
    </div>
  );
};
