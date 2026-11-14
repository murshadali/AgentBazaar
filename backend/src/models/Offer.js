import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
      required: true,
      index: true
    },
    round: {
      type: Number,
      required: true,
      min: 1
    },
    actor: {
      type: String,
      enum: ['BUYER_AGENT', 'SELLER_AGENT'],
      required: true
    },
    action: {
      type: String,
      enum: ['OFFER', 'ACCEPT', 'REJECT'],
      required: true
    },
    price: {
      type: Number,
      default: null
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    guardrailCorrected: {
      type: Boolean,
      default: false
    },
    guardrailNote: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate offer records per round per actor in the same negotiation
offerSchema.index({ negotiationId: 1, round: 1, actor: 1 }, { unique: true });

export default mongoose.model('Offer', offerSchema);
