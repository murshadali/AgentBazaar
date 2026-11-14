import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    agreedPrice: {
      type: Number,
      required: true,
      min: 1
    },
    buyerApproval: {
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
      },
      approvedAt: {
        type: Date,
        default: null
      },
      rejectedAt: {
        type: Date,
        default: null
      },
      rejectionReason: {
        type: String,
        default: ''
      }
    },
    sellerApproval: {
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
      },
      approvedAt: {
        type: Date,
        default: null
      },
      rejectedAt: {
        type: Date,
        default: null
      },
      rejectionReason: {
        type: String,
        default: ''
      }
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING_APPROVAL',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true // 48-hour approval window
    },
    confirmedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancellationReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals for populates
dealSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

dealSchema.virtual('buyer', {
  ref: 'User',
  localField: 'buyerId',
  foreignField: '_id',
  justOne: true
});

dealSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true
});

dealSchema.virtual('negotiation', {
  ref: 'Negotiation',
  localField: 'negotiationId',
  foreignField: '_id',
  justOne: true
});

dealSchema.virtual('handover', {
  ref: 'Handover',
  localField: '_id',
  foreignField: 'dealId',
  justOne: true
});

// Backward compatibility virtual flags
dealSchema.virtual('buyerApproved').get(function () {
  return this.buyerApproval?.status === 'APPROVED';
});

dealSchema.virtual('sellerApproved').get(function () {
  return this.sellerApproval?.status === 'APPROVED';
});

export default mongoose.model('Deal', dealSchema);
