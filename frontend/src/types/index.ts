export type UserRole = 'BUYER' | 'VENDOR';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  region: string;
}

export type RFQStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PO_ISSUED'
  | 'CANCELLED';

export interface PricingSlab {
  min_qty: number;
  max_qty: number | null;
  unit_price: number;
}

export interface RFQ {
  _id: string;
  rfq_number: string;
  buyer_id: User | string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  region: string;
  deadline: string;
  status: RFQStatus;
  selected_quotation_id?: string | Quotation;
  selected_vendor_id?: User | string;
  selected_total_amount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  _id: string;
  rfq_id: string | RFQ;
  vendor_id: User;
  slabs: PricingSlab[];
  evaluated_unit_price: number;
  evaluated_total_price: number;
  lead_time_days: number;
  validity_date: string;
  notes?: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface PurchaseOrder {
  _id: string;
  po_number: string;
  rfq_id: RFQ;
  quotation_id: Quotation;
  buyer_id: User;
  vendor_id: User;
  item_details: {
    title: string;
    category: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_amount: number;
  };
  total_amount: number;
  delivery_deadline: string;
  terms: string;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'FULFILLED';
  issued_at: string;
  createdAt: string;
}
