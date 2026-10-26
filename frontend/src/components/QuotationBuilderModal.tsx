import React, { useState, useEffect } from 'react';
import type { RFQ, PricingSlab } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

interface QuotationBuilderModalProps {
  rfq: RFQ;
  onClose: () => void;
  onSubmitted: () => void;
}

export const QuotationBuilderModal: React.FC<QuotationBuilderModalProps> = ({
  rfq,
  onClose,
  onSubmitted,
}) => {
  const [slabs, setSlabs] = useState<PricingSlab[]>([
    { min_qty: 1, max_qty: 499, unit_price: 85 },
    { min_qty: 500, max_qty: null, unit_price: 70 },
  ]);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);
  const [validityDate, setValidityDate] = useState<string>(() =>
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [preview, setPreview] = useState<{
    unitPrice: number;
    totalPrice: number;
    matchedSlabIndex: number;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Validate slabs and calculate matching tier
  useEffect(() => {
    setValidationError(null);

    if (slabs.length === 0) {
      setValidationError('At least one quantity slab is required.');
      setPreview(null);
      return;
    }

    const sorted = [...slabs].sort((a, b) => a.min_qty - b.min_qty);

    // Check for gaps / overlaps / economics
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      if (current.min_qty <= 0) {
        setValidationError(`Tier ${i + 1}: Minimum quantity must be at least 1.`);
        setPreview(null);
        return;
      }

      if (current.unit_price <= 0) {
        setValidationError(`Tier ${i + 1}: Unit price must be greater than zero.`);
        setPreview(null);
        return;
      }

      if (current.max_qty !== null && current.max_qty < current.min_qty) {
        setValidationError(`Tier ${i + 1}: Maximum quantity cannot be lower than minimum.`);
        setPreview(null);
        return;
      }

      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        if (current.max_qty === null) {
          setValidationError(`Only the final tier can have an open upper bound (unlimited).`);
          setPreview(null);
          return;
        }

        if (current.max_qty >= next.min_qty) {
          setValidationError(
            `Quantity tiers overlap: [${current.min_qty}–${current.max_qty}] overlaps with [${next.min_qty}–${next.max_qty ?? '∞'}].`
          );
          setPreview(null);
          return;
        }

        if (next.unit_price > current.unit_price) {
          setValidationError(
            `Inconsistent volume economics: Tier starting at ${next.min_qty} has unit price ₹${next.unit_price}, which exceeds lower volume tier price ₹${current.unit_price}.`
          );
          setPreview(null);
          return;
        }
      }
    }

    // Match requested quantity
    const matchIdx = sorted.findIndex(
      (s) =>
        rfq.quantity >= s.min_qty &&
        (s.max_qty === null || s.max_qty === undefined || rfq.quantity <= s.max_qty)
    );

    if (matchIdx === -1) {
      setValidationError(
        `The requested quantity (${rfq.quantity} ${rfq.unit}) is outside your configured pricing slabs.`
      );
      setPreview(null);
      return;
    }

    const matchedSlab = sorted[matchIdx];
    const unitPrice = matchedSlab.unit_price;
    const totalPrice = Math.round(rfq.quantity * unitPrice * 100) / 100;

    setPreview({
      unitPrice,
      totalPrice,
      matchedSlabIndex: matchIdx,
    });
  }, [slabs, rfq.quantity, rfq.unit]);

  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const newMin = (last?.max_qty || last?.min_qty || 0) + 1;
    const updated = slabs.map((s, idx) => {
      if (idx === slabs.length - 1 && s.max_qty === null) {
        return { ...s, max_qty: newMin - 1 };
      }
      return s;
    });
    setSlabs([...updated, { min_qty: newMin, max_qty: null, unit_price: Math.max(1, (last?.unit_price || 100) - 5) }]);
  };

  const removeSlab = (index: number) => {
    if (slabs.length <= 1) return;
    const filtered = slabs.filter((_, i) => i !== index);
    filtered[filtered.length - 1].max_qty = null;
    setSlabs(filtered);
  };

  const updateSlab = (index: number, field: keyof PricingSlab, value: any) => {
    const updated = [...slabs];
    updated[index] = { ...updated[index], [field]: value };
    setSlabs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || !preview) return;

    setSubmitting(true);
    try {
      await api.submitQuotation(rfq._id, {
        slabs: slabs.map((s) => ({
          min_qty: Number(s.min_qty),
          max_qty: s.max_qty !== null && s.max_qty !== undefined && s.max_qty !== ('' as any) ? Number(s.max_qty) : null,
          unit_price: Number(s.unit_price),
        })),
        lead_time_days: Number(leadTimeDays),
        validity_date: new Date(validityDate).toISOString(),
        notes,
      });
      onSubmitted();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to submit quotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202522]/40 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[6px] bg-white border border-[#E5E7E4] shadow-md p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7E4]">
          <div>
            <h2 className="text-base font-semibold text-[#202522]">
              Submit Vendor Quotation
            </h2>
            <p className="text-xs text-[#727873] mt-0.5">
              Requirement: <span className="font-semibold text-[#202522]">{rfq.title}</span> ({rfq.quantity} {rfq.unit})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {validationError && (
          <div className="mt-4 p-3 rounded-[4px] bg-[#FDF3F3] border border-[#F1BABA] text-xs text-[#B84040] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Slabs Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#202522] uppercase tracking-wider">
                Volume Pricing Slabs (INR / {rfq.unit})
              </label>
              <button
                type="button"
                onClick={addSlab}
                className="h-7 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] hover:bg-[#FAFAF9] text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Tier
              </button>
            </div>

            <div className="rounded-[4px] border border-[#E5E7E4] overflow-hidden bg-white">
              <table className="w-full text-left enterprise-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">Tier</th>
                    <th>Min Qty</th>
                    <th>Max Qty</th>
                    <th>Unit Price (₹)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7E4]">
                  {slabs.map((slab, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="text-center font-mono text-[11px] text-[#727873]">
                        #{idx + 1}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          required
                          value={slab.min_qty}
                          onChange={(e) => updateSlab(idx, 'min_qty', parseInt(e.target.value) || 1)}
                          className="w-24 h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs font-mono tabular-nums text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Unlimited (∞)"
                          value={slab.max_qty === null ? '' : slab.max_qty}
                          onChange={(e) =>
                            updateSlab(
                              idx,
                              'max_qty',
                              e.target.value === '' ? null : parseInt(e.target.value)
                            )
                          }
                          className="w-28 h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs font-mono tabular-nums text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="text-[#727873]">₹</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={slab.unit_price}
                            onChange={(e) =>
                              updateSlab(idx, 'unit_price', parseFloat(e.target.value) || 0)
                            }
                            className="w-24 h-8 px-2 rounded-[4px] border border-[#E5E7E4] bg-white text-xs font-mono tabular-nums font-semibold text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                          />
                        </div>
                      </td>
                      <td className="text-center">
                        {slabs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlab(idx)}
                            className="p-1 text-[#8E948F] hover:text-[#B84040]"
                            title="Remove tier"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Evaluation Preview */}
          <div className="p-3.5 rounded-[4px] bg-[#EDF4EF] border border-[#BCD4C4] text-xs">
            <span className="text-[10px] font-semibold text-[#245C46] uppercase tracking-wider block mb-1">
              Dynamic Pricing Evaluation ({rfq.quantity} {rfq.unit})
            </span>
            {preview ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[#727873] text-[11px]">Resolved Unit Price:</span>
                  <div className="font-mono tabular-nums font-bold text-sm text-[#202522]">
                    {formatINR(preview.unitPrice)} / {rfq.unit}
                  </div>
                  <span className="text-[10px] text-[#245C46]">
                    Matching Tier #{preview.matchedSlabIndex + 1}
                  </span>
                </div>
                <div>
                  <span className="text-[#727873] text-[11px]">Total Evaluated Spend:</span>
                  <div className="font-mono tabular-nums font-bold text-base text-[#245C46]">
                    {formatINR(preview.totalPrice)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#A66B16]">
                Adjust slabs above so the range covers the buyer's requested volume of {rfq.quantity} {rfq.unit}.
              </p>
            )}
          </div>

          {/* Lead time & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202522] mb-1">
                Fulfillment Lead Time (Working Days) <span className="text-[#B84040]">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] font-mono tabular-nums focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202522] mb-1">
                Quotation Validity Expiry <span className="text-[#B84040]">*</span>
              </label>
              <input
                type="date"
                required
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202522] mb-1">
              Commercial Terms & Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. In-stock ready for immediate delivery, ISO/DIN test certificates provided, transit insurance included..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            />
          </div>

          <div className="pt-3 border-t border-[#E5E7E4] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-[4px] border border-[#E5E7E4] text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !preview || !!validationError}
              className="h-8 px-4 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
