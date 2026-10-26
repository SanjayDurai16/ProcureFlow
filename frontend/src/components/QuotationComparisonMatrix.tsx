import React, { useState } from 'react';
import type { Quotation, RFQ } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { Check, Clock } from 'lucide-react';

interface QuotationComparisonMatrixProps {
  rfq: RFQ;
  quotes: Quotation[];
  comparison: {
    lowestPrice: number;
    lowestPriceQuoteId: string;
    fastestLeadTime: number;
    fastestDeliveryQuoteId: string;
  } | null;
  onSelectVendor?: (quotationId: string) => Promise<void>;
  isBuyer: boolean;
}

export const QuotationComparisonMatrix: React.FC<QuotationComparisonMatrixProps> = ({
  rfq,
  quotes,
  comparison,
  onSelectVendor,
  isBuyer,
}) => {
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [pendingSelectionQuote, setPendingSelectionQuote] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSelect = isBuyer && (rfq.status === 'OPEN' || rfq.status === 'UNDER_REVIEW');

  const handleConfirmSelect = async () => {
    if (!pendingSelectionQuote || !onSelectVendor) return;
    setIsSubmitting(true);
    try {
      await onSelectVendor(pendingSelectionQuote._id);
      setPendingSelectionQuote(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="rounded-[6px] border border-[#E5E7E4] bg-white p-8 text-center">
        <Clock className="h-6 w-6 text-[#8E948F] mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-[#202522]">No quotations submitted yet</h4>
        <p className="text-[11px] text-[#727873] mt-1 max-w-sm mx-auto">
          Regional vendors can review this RFQ in their feed and submit volume pricing slabs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs pb-1">
        <div>
          <h3 className="font-semibold text-[#202522]">
            Quotation Evaluation Matrix
          </h3>
          <p className="text-[11px] text-[#727873]">
            Pricing resolved dynamically for requirement: <strong className="text-[#202522] font-semibold">{rfq.quantity} {rfq.unit}</strong>
          </p>
        </div>
        <span className="text-[11px] text-[#727873]">
          {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} received
        </span>
      </div>

      {/* Comparison Table */}
      <div className="rounded-[6px] border border-[#E5E7E4] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left enterprise-table">
            <thead>
              <tr>
                <th className="w-1/4">Vendor & Organization</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total Evaluated Spend</th>
                <th className="text-center">Lead Time</th>
                <th>Validity</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7E4]">
              {quotes.map((quote) => {
                const isSelected =
                  rfq.selected_quotation_id &&
                  (typeof rfq.selected_quotation_id === 'string'
                    ? rfq.selected_quotation_id === quote._id
                    : rfq.selected_quotation_id._id === quote._id);

                const isLowestPrice = comparison ? quote.evaluated_total_price === comparison.lowestPrice : false;
                const isFastest = comparison ? quote.lead_time_days === comparison.fastestLeadTime : false;
                const isExpanded = expandedQuoteId === quote._id;

                return (
                  <React.Fragment key={quote._id}>
                    <tr className={isSelected ? 'bg-[#EDF4EF]/50' : ''}>
                      {/* Vendor Info */}
                      <td>
                        <div className="font-semibold text-[#202522]">
                          {quote.vendor_id.organization}
                        </div>
                        <div className="text-[11px] text-[#727873] flex items-center gap-1.5 mt-0.5">
                          <span>{quote.vendor_id.name}</span>
                          <span>•</span>
                          <span>{quote.vendor_id.region}</span>
                        </div>
                        {quote.notes && (
                          <div className="text-[11px] text-[#727873] italic mt-1 max-w-xs truncate" title={quote.notes}>
                            "{quote.notes}"
                          </div>
                        )}
                      </td>

                      {/* Evaluated Unit Price */}
                      <td className="text-right font-mono tabular-nums text-xs">
                        {formatINR(quote.evaluated_unit_price)}
                        <span className="text-[10px] text-[#727873] ml-1">/{rfq.unit}</span>
                      </td>

                      {/* Total Evaluated Spend */}
                      <td className="text-right">
                        <div className="font-mono tabular-nums text-xs font-semibold text-[#202522]">
                          {formatINR(quote.evaluated_total_price)}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {isLowestPrice && (
                            <span className="text-[10px] font-medium text-[#245C46] bg-[#EDF4EF] border border-[#BCD4C4] px-1.5 py-0.2 rounded-[3px]">
                              Lowest Price
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lead Time */}
                      <td className="text-center font-mono tabular-nums text-xs">
                        <span>{quote.lead_time_days} days</span>
                        {isFastest && (
                          <div className="text-[10px] text-[#426A91] font-medium mt-0.5">
                            Fastest
                          </div>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="text-xs text-[#727873]">
                        {formatDate(quote.validity_date)}
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={isSelected ? 'ACCEPTED' : quote.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setExpandedQuoteId(isExpanded ? null : quote._id)}
                          className="text-[11px] text-[#727873] hover:text-[#202522] underline underline-offset-2"
                        >
                          {isExpanded ? 'Hide Slabs' : 'View Slabs'}
                        </button>

                        {canSelect && !isSelected && (
                          <button
                            type="button"
                            onClick={() => setPendingSelectionQuote(quote)}
                            className="h-7 px-2.5 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-[11px] font-medium transition-colors"
                          >
                            Select Vendor
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Slabs Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#FAFAF9]">
                        <td colSpan={7} className="p-3 border-b border-[#E5E7E4]">
                          <div className="max-w-lg rounded-[4px] border border-[#E5E7E4] bg-white p-3 text-xs">
                            <span className="text-[10px] uppercase font-semibold text-[#727873] tracking-wider block mb-2">
                              Quotation Pricing Slabs ({quote.vendor_id.organization})
                            </span>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-[#E5E7E4] text-[10px] text-[#727873] uppercase">
                                  <th className="py-1">Quantity Tier</th>
                                  <th className="py-1 text-right">Unit Price</th>
                                  <th className="py-1 text-right">Effective Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E7E4]/50">
                                {quote.slabs.map((slab, sIdx) => {
                                  const isApplied =
                                    rfq.quantity >= slab.min_qty &&
                                    (slab.max_qty === null || rfq.quantity <= slab.max_qty);
                                  return (
                                    <tr key={sIdx} className={isApplied ? 'bg-[#EDF4EF] font-medium' : ''}>
                                      <td className="py-1 text-xs">
                                        {slab.min_qty} – {slab.max_qty ?? '∞'} {rfq.unit}
                                      </td>
                                      <td className="py-1 text-right font-mono tabular-nums text-xs">
                                        {formatINR(slab.unit_price)}
                                      </td>
                                      <td className="py-1 text-right text-[11px] text-[#727873]">
                                        {isApplied ? (
                                          <span className="text-[#245C46] font-semibold flex items-center justify-end gap-1">
                                            <Check className="h-3 w-3" /> Applied for {rfq.quantity} {rfq.unit}
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Selection */}
      <ConfirmDialog
        isOpen={!!pendingSelectionQuote}
        title="Confirm Vendor Selection"
        message={`Are you sure you want to select ${pendingSelectionQuote?.vendor_id.organization} for this requirement? Total spend: ${formatINR(
          pendingSelectionQuote?.evaluated_total_price
        )}. The RFQ will be approved and ready for Purchase Order generation.`}
        confirmLabel="Confirm Selection"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSelect}
        onCancel={() => setPendingSelectionQuote(null)}
      />
    </div>
  );
};
