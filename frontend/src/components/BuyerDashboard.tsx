import React, { useState, useEffect, useMemo } from 'react';
import type { RFQ, Quotation, User } from '../types';
import { api } from '../services/api';
import { formatDate, getDaysRemaining } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { WorkflowProgress } from './WorkflowProgress';
import { QuotationComparisonMatrix } from './QuotationComparisonMatrix';
import { Timeline } from './Timeline';
import { CreateRFQModal } from './CreateRFQModal';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Plus,
  Search,
  Send,
  FileCheck2,
  ArrowLeft,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface BuyerDashboardProps {
  user: User;
  subView: 'overview' | 'rfqs' | 'quotations';
  onNavigateToOrders: (orderId?: string) => void;
  onNavigateToRFQs: () => void;
  onNavigateToQuotations?: () => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  user,
  subView,
  onNavigateToOrders,
  onNavigateToRFQs,
}) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');

  // Modals & Actions
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmPublishId, setConfirmPublishId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);

  const fetchRFQs = async () => {
    try {
      const res = await api.getRFQs();
      setRfqs(res.data.rfqs);
    } catch (err) {
      console.error('Failed to load RFQs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  // When selected RFQ changes, load details and quotations
  useEffect(() => {
    if (!selectedRfqId) {
      setSelectedRfq(null);
      setQuotes([]);
      setComparison(null);
      return;
    }

    const loadDetail = async () => {
      setLoadingQuotes(true);
      try {
        const [rfqRes, quotesRes] = await Promise.all([
          api.getRFQById(selectedRfqId),
          api.getQuotationsForRFQ(selectedRfqId),
        ]);
        setSelectedRfq(rfqRes.data.rfq);
        setQuotes(quotesRes.data.quotes);
        setComparison(quotesRes.data.comparison);
      } catch (err) {
        console.error('Failed to load RFQ details', err);
      } finally {
        setLoadingQuotes(false);
      }
    };

    loadDetail();
  }, [selectedRfqId]);

  // Operational metrics
  const stats = useMemo(() => {
    const open = rfqs.filter((r) => r.status === 'OPEN').length;
    const approved = rfqs.filter((r) => r.status === 'APPROVED').length;
    const poIssued = rfqs.filter((r) => r.status === 'PO_ISSUED').length;
    const underReview = rfqs.filter((r) => r.status === 'UNDER_REVIEW').length;
    return { open, approved, poIssued, underReview, total: rfqs.length };
  }, [rfqs]);

  // Filtered RFQs list
  const filteredRFQs = useMemo(() => {
    return rfqs.filter((rfq) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = rfq.rfq_number?.toLowerCase().includes(term);
        const matchesTitle = rfq.title?.toLowerCase().includes(term);
        if (!matchesNum && !matchesTitle) return false;
      }
      if (statusFilter !== 'ALL' && rfq.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && rfq.category !== categoryFilter) return false;
      if (regionFilter !== 'ALL' && rfq.region !== regionFilter) return false;
      return true;
    });
  }, [rfqs, searchTerm, statusFilter, categoryFilter, regionFilter]);

  // Categories & Regions for filter dropdowns
  const categories = useMemo(() => Array.from(new Set(rfqs.map((r) => r.category))), [rfqs]);
  const regions = useMemo(() => Array.from(new Set(rfqs.map((r) => r.region))), [rfqs]);

  const handlePublish = async () => {
    if (!confirmPublishId) return;
    setIsPublishing(true);
    try {
      await api.publishRFQ(confirmPublishId);
      await fetchRFQs();
      if (selectedRfqId === confirmPublishId) {
        const updated = await api.getRFQById(confirmPublishId);
        setSelectedRfq(updated.data.rfq);
      }
      setConfirmPublishId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to publish RFQ');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSelectVendor = async (quotationId: string) => {
    if (!selectedRfq) return;
    try {
      const res = await api.selectVendor(selectedRfq._id, quotationId);
      await fetchRFQs();
      const [rfqRes, quotesRes] = await Promise.all([
        api.getRFQById(selectedRfq._id),
        api.getQuotationsForRFQ(selectedRfq._id),
      ]);
      setSelectedRfq(rfqRes.data.rfq);
      setQuotes(quotesRes.data.quotes);
      setComparison(quotesRes.data.comparison);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to select vendor');
    }
  };

  const handleGeneratePO = async () => {
    if (!selectedRfq) return;
    setIsGeneratingPO(true);
    try {
      const res = await api.generatePO(selectedRfq._id);
      await fetchRFQs();
      onNavigateToOrders(res.data.order._id);
    } catch (err: any) {
      alert(err.message || 'Failed to generate Purchase Order');
    } finally {
      setIsGeneratingPO(false);
    }
  };

  // DETAIL VIEW
  if (selectedRfqId && selectedRfq) {
    const isApproved = selectedRfq.status === 'APPROVED';

    return (
      <div className="space-y-5">
        {/* Back link & Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedRfqId(null)}
            className="inline-flex items-center gap-1.5 text-xs text-[#727873] hover:text-[#202522] font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to RFQs list</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            {selectedRfq.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => setConfirmPublishId(selectedRfq._id)}
                className="h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Publish RFQ</span>
              </button>
            )}

            {isApproved && (
              <button
                type="button"
                disabled={isGeneratingPO}
                onClick={handleGeneratePO}
                className="h-8 px-3.5 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>{isGeneratingPO ? 'Generating...' : 'Generate Purchase Order'}</span>
              </button>
            )}

            {selectedRfq.status === 'PO_ISSUED' && (
              <button
                type="button"
                onClick={() => onNavigateToOrders()}
                className="h-8 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] hover:bg-[#FAFAF9] font-medium flex items-center gap-1.5"
              >
                <span>View Issued PO</span>
                <ExternalLink className="h-3 w-3 text-[#727873]" />
              </button>
            )}
          </div>
        </div>

        {/* RFQ Header Block */}
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold text-[#727873]">
                  {selectedRfq.rfq_number}
                </span>
                <StatusBadge status={selectedRfq.status} size="sm" />
              </div>
              <h1 className="text-lg font-semibold text-[#202522]">
                {selectedRfq.title}
              </h1>
            </div>

            <div className="text-left sm:text-right text-xs text-[#727873]">
              <div>Deadline: <strong className="text-[#202522] font-semibold">{formatDate(selectedRfq.deadline)}</strong></div>
              <div className="text-[11px] mt-0.5">
                {getDaysRemaining(selectedRfq.deadline).isOverdue
                  ? 'Expired'
                  : `${getDaysRemaining(selectedRfq.deadline).days} days remaining`}
              </div>
            </div>
          </div>

          {/* Workflow Stepper */}
          <WorkflowProgress
            status={selectedRfq.status}
          />

          {/* Specifications Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[4px] bg-[#FAFAF9] border border-[#E5E7E4] text-xs">
            <div>
              <span className="text-[10px] text-[#727873] uppercase tracking-wider block">Quantity</span>
              <span className="font-semibold text-[#202522] font-mono tabular-nums">
                {selectedRfq.quantity} {selectedRfq.unit}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#727873] uppercase tracking-wider block">Category</span>
              <span className="font-medium text-[#202522]">{selectedRfq.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#727873] uppercase tracking-wider block">Target Hub</span>
              <span className="font-medium text-[#202522]">{selectedRfq.region}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#727873] uppercase tracking-wider block">Purchaser</span>
              <span className="font-medium text-[#202522]">{user.organization}</span>
            </div>
          </div>

          {/* Technical Specs Text */}
          <div className="text-xs">
            <span className="text-[10px] uppercase font-semibold text-[#727873] tracking-wider block mb-1">
              Technical Specifications & Requirements
            </span>
            <p className="text-[#202522] leading-relaxed whitespace-pre-line bg-white p-3 rounded-[4px] border border-[#E5E7E4]">
              {selectedRfq.description}
            </p>
          </div>
        </div>

        {/* Quotation Comparison Matrix Section */}
        <div className="space-y-3">
          {loadingQuotes ? (
            <div className="p-8 text-center text-xs text-[#727873]">Loading quotation matrix...</div>
          ) : (
            <QuotationComparisonMatrix
              rfq={selectedRfq}
              quotes={quotes}
              comparison={comparison}
              isBuyer={true}
              onSelectVendor={handleSelectVendor}
            />
          )}
        </div>

        {/* Activity Milestones Timeline */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold uppercase text-[#727873] tracking-wider">
            Chronological Activity Milestones
          </h3>
          <Timeline rfqId={selectedRfq._id} />
        </div>

        {/* Confirm Publish Dialog */}
        <ConfirmDialog
          isOpen={!!confirmPublishId}
          title="Publish RFQ to Regional Suppliers"
          message="Publishing will transition this requirement to the OPEN state, making it discoverable to suppliers in your target hub."
          confirmLabel="Publish RFQ"
          isLoading={isPublishing}
          onConfirm={handlePublish}
          onCancel={() => setConfirmPublishId(null)}
        />
      </div>
    );
  }

  // OVERVIEW VIEW (subView === 'overview')
  if (subView === 'overview') {
    const recentRfqs = rfqs.slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7E4]">
          <div>
            <h1 className="text-base font-semibold text-[#202522]">Overview</h1>
            <p className="text-xs text-[#727873] mt-0.5">
              MSME purchasing operations summary and active procurement lifecycle.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create RFQ</span>
          </button>
        </div>

        {/* Operational Summary Strip (Linear-style compact bordered panels) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Open for Bidding</span>
            <div className="font-mono text-xl font-bold text-[#202522] tabular-nums mt-1">
              {stats.open}
            </div>
            <span className="text-[10px] text-[#727873]">Active regional RFQs</span>
          </div>

          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Under Evaluation</span>
            <div className="font-mono text-xl font-bold text-[#202522] tabular-nums mt-1">
              {stats.underReview}
            </div>
            <span className="text-[10px] text-[#727873]">Quotes ready for review</span>
          </div>

          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Approved RFQs</span>
            <div className="font-mono text-xl font-bold text-[#245C46] tabular-nums mt-1">
              {stats.approved}
            </div>
            <span className="text-[10px] text-[#727873]">Ready for PO generation</span>
          </div>

          <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3">
            <span className="text-[11px] font-medium text-[#727873] block">Purchase Orders Issued</span>
            <div className="font-mono text-xl font-bold text-[#245C46] tabular-nums mt-1">
              {stats.poIssued}
            </div>
            <span className="text-[10px] text-[#727873]">Executed purchase orders</span>
          </div>
        </div>

        {/* Recent RFQs Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-semibold text-[#202522]">Recent Procurement Requirements</h2>
            <button
              type="button"
              onClick={onNavigateToRFQs}
              className="text-[#245C46] hover:text-[#1B4937] font-medium text-xs flex items-center gap-1"
            >
              <span>View all {rfqs.length} RFQs</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#727873]">Loading RFQs...</div>
          ) : recentRfqs.length === 0 ? (
            <div className="p-8 rounded-[4px] border border-[#E5E7E4] bg-white text-center text-xs text-[#727873]">
              No RFQs found. Click "Create RFQ" to prepare your first bulk purchasing requirement.
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
                      <th>Region</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7E4]">
                    {recentRfqs.map((rfq) => (
                      <tr key={rfq._id}>
                        <td className="font-mono text-xs font-semibold text-[#727873]">
                          {rfq.rfq_number}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedRfqId(rfq._id)}
                            className="text-left font-medium text-[#202522] hover:text-[#245C46] truncate max-w-sm block"
                          >
                            {rfq.title}
                          </button>
                        </td>
                        <td className="text-right font-mono tabular-nums text-xs">
                          {rfq.quantity} {rfq.unit}
                        </td>
                        <td className="text-xs text-[#727873]">{rfq.region}</td>
                        <td className="text-xs text-[#727873]">{formatDate(rfq.deadline)}</td>
                        <td>
                          <StatusBadge status={rfq.status} size="sm" />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRfqId(rfq._id)}
                            className="text-xs font-medium text-[#245C46] hover:text-[#1B4937]"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateRFQModal
            userRegion={user.region}
            onClose={() => setShowCreateModal(false)}
            onCreated={(newId) => {
              setShowCreateModal(false);
              fetchRFQs();
              if (newId) setSelectedRfqId(newId);
            }}
          />
        )}
      </div>
    );
  }

  // MY RFQs VIEW (subView === 'rfqs' or 'quotations')
  return (
    <div className="space-y-4">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7E4]">
        <div>
          <h1 className="text-base font-semibold text-[#202522]">
            {subView === 'quotations' ? 'Quotations & Bids' : 'My Procurement RFQs'}
          </h1>
          <p className="text-xs text-[#727873] mt-0.5">
            {subView === 'quotations'
              ? 'Evaluate regional vendor quotations and inspect tiered volume pricing slabs.'
              : 'Complete repository of draft, active, and completed purchasing requirements.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create RFQ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-60">
            <Search className="h-3.5 w-3.5 text-[#8E948F] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or RFQ number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] placeholder:text-[#8E948F] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#727873]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open for Bidding</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="PO_ISSUED">PO Issued</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
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

          {/* Region Filter */}
          {regions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#727873]">Hub:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              >
                <option value="ALL">All Hubs</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <span className="text-[11px] text-[#727873]">
          Showing {filteredRFQs.length} of {rfqs.length} requirements
        </span>
      </div>

      {/* Main RFQ Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#727873]">Loading procurement RFQs...</div>
      ) : filteredRFQs.length === 0 ? (
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white p-12 text-center">
          <Clock className="h-8 w-8 text-[#8E948F] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-[#202522]">No matching requirements</h3>
          <p className="text-[11px] text-[#727873] mt-1">
            Try adjusting your search query or filter options.
          </p>
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
                  <th>Category</th>
                  <th>Region</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7E4]">
                {filteredRFQs.map((rfq) => (
                  <tr key={rfq._id}>
                    <td className="font-mono text-xs font-semibold text-[#727873]">
                      {rfq.rfq_number}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedRfqId(rfq._id)}
                        className="text-left font-medium text-[#202522] hover:text-[#245C46] truncate max-w-xs block"
                      >
                        {rfq.title}
                      </button>
                    </td>
                    <td className="text-right font-mono tabular-nums text-xs">
                      {rfq.quantity} {rfq.unit}
                    </td>
                    <td className="text-xs text-[#727873]">{rfq.category}</td>
                    <td className="text-xs text-[#727873]">{rfq.region}</td>
                    <td className="text-xs text-[#727873]">{formatDate(rfq.deadline)}</td>
                    <td>
                      <StatusBadge status={rfq.status} size="sm" />
                    </td>
                    <td className="text-right space-x-2">
                      {rfq.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => setConfirmPublishId(rfq._id)}
                          className="text-xs font-medium text-[#245C46] hover:text-[#1B4937]"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedRfqId(rfq._id)}
                        className="text-xs font-medium text-[#245C46] hover:text-[#1B4937]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRFQModal
          userRegion={user.region}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newId) => {
            setShowCreateModal(false);
            fetchRFQs();
            if (newId) setSelectedRfqId(newId);
          }}
        />
      )}

      {/* Confirm Publish Dialog */}
      <ConfirmDialog
        isOpen={!!confirmPublishId}
        title="Publish RFQ to Regional Suppliers"
        message="Publishing will transition this requirement to the OPEN state, making it discoverable to suppliers in your target hub."
        confirmLabel="Publish RFQ"
        isLoading={isPublishing}
        onConfirm={handlePublish}
        onCancel={() => setConfirmPublishId(null)}
      />
    </div>
  );
};
