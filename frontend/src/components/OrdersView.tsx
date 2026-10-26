import React, { useState, useEffect } from 'react';
import type { PurchaseOrder, User } from '../types';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { PackageCheck, Printer, Search } from 'lucide-react';

interface OrdersViewProps {
  user: User;
  initialSelectedOrderId?: string | null;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ user, initialSelectedOrderId }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.getOrders();
      setOrders(res.data.orders);

      if (initialSelectedOrderId) {
        const match = res.data.orders.find((o: PurchaseOrder) => o._id === initialSelectedOrderId);
        if (match) setSelectedOrder(match);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [initialSelectedOrderId]);

  const filtered = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const poNum = o.po_number?.toLowerCase() || '';
    const title = o.item_details?.title?.toLowerCase() || '';
    const vendor = o.vendor_id?.organization?.toLowerCase() || '';
    const buyer = o.buyer_id?.organization?.toLowerCase() || '';
    return poNum.includes(term) || title.includes(term) || vendor.includes(term) || buyer.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7E4]">
        <div>
          <h1 className="text-base font-semibold text-[#202522]">
            Purchase Orders & Contract Execution
          </h1>
          <p className="text-xs text-[#727873] mt-0.5">
            Verified, legally binding purchase orders locked by the procurement workflow engine.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-[#8E948F] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PO number, item, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-[4px] border border-[#E5E7E4] bg-white text-xs text-[#202522] placeholder:text-[#8E948F] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#727873]">Loading purchase orders...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white p-12 text-center">
          <PackageCheck className="h-8 w-8 text-[#8E948F] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-[#202522]">No purchase orders found</h3>
          <p className="text-[11px] text-[#727873] mt-1 max-w-sm mx-auto">
            Once an RFQ successfully completes vendor selection and financial approval, an immutable Purchase Order document is generated here.
          </p>
        </div>
      ) : (
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left enterprise-table">
              <thead>
                <tr>
                  <th className="w-32">PO Reference</th>
                  <th>Requirement Description</th>
                  <th>Buyer Organization</th>
                  <th>Vendor Supplier</th>
                  <th className="text-right">Total Order Value</th>
                  <th>Delivery Deadline</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7E4]">
                {filtered.map((order) => (
                  <tr key={order._id}>
                    <td className="font-mono font-semibold text-[#202522]">
                      {order.po_number}
                    </td>
                    <td>
                      <div className="font-semibold text-[#202522] truncate max-w-xs">
                        {order.item_details.title}
                      </div>
                      <span className="text-[11px] text-[#727873]">
                        {order.item_details.quantity} {order.item_details.unit} @ {formatINR(order.item_details.unit_price)}
                      </span>
                    </td>
                    <td className="text-xs text-[#727873]">
                      {order.buyer_id.organization}
                    </td>
                    <td className="text-xs text-[#202522] font-medium">
                      {order.vendor_id.organization}
                    </td>
                    <td className="text-right font-mono tabular-nums font-bold text-xs text-[#245C46]">
                      {formatINR(order.total_amount)}
                    </td>
                    <td className="text-xs text-[#727873]">
                      {formatDate(order.delivery_deadline)}
                    </td>
                    <td>
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="h-7 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] hover:bg-[#FAFAF9] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="h-3 w-3 text-[#727873]" />
                        <span>Document</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable PO Modal */}
      {selectedOrder && (
        <PurchaseOrderModal
          order={selectedOrder}
          currentUser={user}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
};
