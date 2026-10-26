import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    po_number: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    rfq_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      unique: true,
      index: true,
    },
    quotation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
    },
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    item_details: {
      title: { type: String, required: true },
      category: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      unit_price: { type: Number, required: true },
      total_amount: { type: Number, required: true },
    },
    total_amount: {
      type: Number,
      required: true,
    },
    delivery_deadline: {
      type: Date,
      required: true,
    },
    terms: {
      type: String,
      default: 'Payment net 30 days upon inspection and delivery of items.',
    },
    status: {
      type: String,
      enum: ['ISSUED', 'ACKNOWLEDGED', 'FULFILLED'],
      default: 'ISSUED',
      index: true,
    },
    issued_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model('Order', orderSchema);
