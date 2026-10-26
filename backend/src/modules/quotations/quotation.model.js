import mongoose from 'mongoose';

const slabSchema = new mongoose.Schema(
  {
    min_qty: {
      type: Number,
      required: true,
      min: 1,
    },
    max_qty: {
      type: Number,
      default: null,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    rfq_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      index: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    slabs: {
      type: [slabSchema],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one slab is required'],
    },
    evaluated_unit_price: {
      type: Number,
      required: true,
    },
    evaluated_total_price: {
      type: Number,
      required: true,
    },
    lead_time_days: {
      type: Number,
      required: [true, 'Lead time in days is required'],
      min: 1,
    },
    validity_date: {
      type: Date,
      required: [true, 'Quotation validity expiry date is required'],
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'ACCEPTED', 'REJECTED'],
      default: 'SUBMITTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a vendor from submitting multiple active quotes for the exact same RFQ
quotationSchema.index({ rfq_id: 1, vendor_id: 1 }, { unique: true });

export const Quotation = mongoose.model('Quotation', quotationSchema);
