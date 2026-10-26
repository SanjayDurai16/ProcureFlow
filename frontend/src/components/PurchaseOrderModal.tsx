import React, { useState } from 'react';
import type { PurchaseOrder, User } from '../types';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { X, Printer, Check, Truck, ShieldCheck } from 'lucide-react';

interface PurchaseOrderModalProps {
  order: PurchaseOrder;
  currentUser: User;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  order,
  currentUser,
  onClose,
  onOrderUpdated,
}) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: 'ACKNOWLEDGED' | 'FULFILLED') => {
    setUpdating(true);
    try {
      await api.updateOrderStatus(order._id, newStatus);
      onOrderUpdated();
    } catch (err) {
      console.error('Failed to update order status', err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isVendor = currentUser.role === 'VENDOR';
  const canAcknowledge = isVendor && order.status === 'ISSUED';
  const canFulfill = isVendor && order.status === 'ACKNOWLEDGED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202522]/40 backdrop-blur-[2px] print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl rounded-[6px] bg-white border border-[#E5E7E4] shadow-md p-8 max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        {/* Modal Controls - Hidden when printing */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7E4] mb-6 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#202522]">
              Purchase Order Document
            </h2>
            <StatusBadge status={order.status} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] hover:bg-[#FAFAF9] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-[#727873]" />
              <span>Print Document</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Business Document Layout */}
        <div className="text-[#202522] space-y-6">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-[#202522] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#202522]">ProcureFlow</span>
                <span className="text-[10px] text-[#727873] uppercase font-mono tracking-wider border border-[#E5E7E4] px-1 py-0.2 rounded-[2px]">
                  B2B
                </span>
              </div>
              <p className="text-[11px] text-[#727873] mt-0.5">Commercial Purchase Order</p>
              <p className="text-[11px] text-[#8E948F]">Regional MSME Procurement Network</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#727873] tracking-wider block">
                Purchase Order Reference
              </span>
              <h1 className="text-base font-mono font-bold text-[#202522]">
                {order.po_number}
              </h1>
              <p className="text-xs text-[#727873] mt-0.5">
                Date: {formatDate(order.issued_at || order.createdAt)}
              </p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="p-3.5 rounded-[4px] bg-[#FAFAF9] border border-[#E5E7E4]">
              <span className="text-[10px] uppercase font-bold text-[#727873] tracking-wider block mb-1">
                Purchaser (Buyer):
              </span>
              <div className="font-bold text-[#202522] text-sm">
                {order.buyer_id.organization}
              </div>
              <div className="text-[#727873] mt-1 space-y-0.5">
                <p>Attention: {order.buyer_id.name}</p>
                <p>Email: {order.buyer_id.email}</p>
                <p>Industrial Region: {order.buyer_id.region}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-[4px] bg-[#FAFAF9] border border-[#E5E7E4]">
              <span className="text-[10px] uppercase font-bold text-[#727873] tracking-wider block mb-1">
                Supplier (Vendor):
              </span>
              <div className="font-bold text-[#202522] text-sm">
                {order.vendor_id.organization}
              </div>
              <div className="text-[#727873] mt-1 space-y-0.5">
                <p>Attention: {order.vendor_id.name}</p>
                <p>Email: {order.vendor_id.email}</p>
                <p>Industrial Region: {order.vendor_id.region}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E5E7E4] rounded-[4px] overflow-hidden">
            <table className="w-full text-left enterprise-table">
              <thead>
                <tr>
                  <th className="w-1/2">Item Description & Specifications</th>
                  <th>Category</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7E4]">
                <tr>
                  <td className="font-medium text-[#202522]">
                    {order.item_details.title}
                  </td>
                  <td className="text-xs text-[#727873]">
                    {order.item_details.category}
                  </td>
                  <td className="text-center font-mono tabular-nums text-xs font-medium">
                    {order.item_details.quantity} {order.item_details.unit}
                  </td>
                  <td className="text-right font-mono tabular-nums text-xs">
                    {formatINR(order.item_details.unit_price)}
                  </td>
                  <td className="text-right font-mono tabular-nums font-semibold text-xs text-[#202522]">
                    {formatINR(order.item_details.total_amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-[#FAFAF9] border-t border-[#E5E7E4] font-semibold text-xs">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] text-[#727873]">
                    Net Total Contract Spend:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm font-bold text-[#245C46]">
                    {formatINR(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Delivery & Terms */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-[4px] border border-[#E5E7E4]">
              <span className="text-[10px] uppercase font-bold text-[#727873] tracking-wider block mb-1">
                Delivery Schedule
              </span>
              <p className="text-[#202522] font-medium">
                Expected Completion / Delivery: {formatDate(order.delivery_deadline)}
              </p>
            </div>

            <div className="p-3 rounded-[4px] border border-[#E5E7E4]">
              <span className="text-[10px] uppercase font-bold text-[#727873] tracking-wider block mb-1">
                Commercial Payment Terms
              </span>
              <p className="text-[#727873] leading-relaxed">
                {order.terms || 'Net 30 days upon inspection and material verification.'}
              </p>
            </div>
          </div>

          {/* Digital Signature & Verification Seal */}
          <div className="pt-4 border-t border-[#E5E7E4] flex items-center justify-between text-xs text-[#727873]">
            <div className="flex items-center gap-1.5 text-[#245C46] font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified and Locked by ProcureFlow Finite State Machine</span>
            </div>
            <div className="font-mono text-[10px] text-[#8E948F]">
              AUTHENTICATION-REF: {order._id}
            </div>
          </div>
        </div>

        {/* Vendor Actions - Hidden when printing */}
        {(canAcknowledge || canFulfill) && (
          <div className="mt-6 pt-4 border-t border-[#E5E7E4] flex items-center justify-end gap-2 no-print">
            {canAcknowledge && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate('ACKNOWLEDGED')}
                className="h-8 px-3 rounded-[4px] bg-[#426A91] hover:bg-[#345372] text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{updating ? 'Updating...' : 'Acknowledge Purchase Order'}</span>
              </button>
            )}

            {canFulfill && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate('FULFILLED')}
                className="h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>{updating ? 'Updating...' : 'Mark Order as Fulfilled / Dispatched'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
