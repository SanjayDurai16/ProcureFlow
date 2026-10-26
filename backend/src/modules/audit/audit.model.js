import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    entity_type: {
      type: String,
      enum: ['RFQ', 'QUOTATION', 'ORDER'],
      required: true,
      index: true,
    },
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    from_state: {
      type: String,
      default: null,
    },
    to_state: {
      type: String,
      default: null,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only: createdAt only
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
