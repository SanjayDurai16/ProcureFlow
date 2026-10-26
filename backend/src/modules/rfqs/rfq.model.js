import mongoose from 'mongoose';
import { RFQ_STATUS } from './rfq.state-machine.js';

const rfqSchema = new mongoose.Schema(
  {
    rfq_number: {
      type: String,
      unique: true,
      index: true,
    },
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'RFQ title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'RFQ description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      required: [true, 'Measurement unit is required'],
      default: 'units',
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required for local vendor discovery'],
      trim: true,
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Quotation submission deadline is required'],
    },
    status: {
      type: String,
      enum: Object.values(RFQ_STATUS),
      default: RFQ_STATUS.DRAFT,
      index: true,
    },
    selected_quotation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    selected_vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    selected_total_amount: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate human-friendly RFQ number before saving if new
rfqSchema.pre('save', async function () {
  if (this.isNew && !this.rfq_number) {
    const count = await mongoose.model('RFQ').countDocuments();
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    this.rfq_number = `RFQ-${year}-${sequence}`;
  }
});

export const RFQ = mongoose.model('RFQ', rfqSchema);
