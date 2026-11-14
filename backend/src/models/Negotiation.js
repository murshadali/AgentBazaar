import mongoose from 'mongoose';

const negotiationSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ['INITIATED', 'IN_PROGRESS', 'AGREED', 'FAILED', 'CANCELLED', 'PAUSED'],
      default: 'INITIATED',
      index: true
    },
    currentRound: {
      type: Number,
      default: 1
    },
    maxRounds: {
      type: Number,
      default: 5
    },
    // Snapshots of configurations at time of initiation
    buyerConfigCopy: {
      targetPrice: { type: Number, required: true },
      budgetCeiling: { type: Number, required: true }, // PRIVATE TO BUYER
      style: {
        type: String,
        enum: ['FIRM', 'BALANCED', 'FLEXIBLE'],
        default: 'BALANCED'
      },
      maxRounds: { type: Number, default: 5 }
    },
    sellerConfigCopy: {
      openingAsk: { type: Number, required: true },
      privateMinPrice: { type: Number, required: true }, // PRIVATE TO SELLER
      style: {
        type: String,
        enum: ['FIRM', 'BALANCED', 'FLEXIBLE'],
        default: 'BALANCED'
      },
      maxRounds: { type: Number, default: 5 }
    },
    agreedPrice: {
      type: Number,
      default: null
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    endReason: {
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
negotiationSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

negotiationSchema.virtual('buyer', {
  ref: 'User',
  localField: 'buyerId',
  foreignField: '_id',
  justOne: true
});

negotiationSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true
});

negotiationSchema.virtual('deal', {
  ref: 'Deal',
  localField: 'dealId',
  foreignField: '_id',
  justOne: true
});

negotiationSchema.virtual('offers', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'negotiationId'
});

export default mongoose.model('Negotiation', negotiationSchema);
