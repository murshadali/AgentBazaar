import mongoose from 'mongoose';

const sellerAgentConfigSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true
    },
    openingAsk: {
      type: Number,
      required: [true, 'Please provide opening ask price'],
      min: [1, 'Opening ask must be greater than zero']
    },
    privateMinPrice: {
      type: Number,
      required: [true, 'Please provide private minimum acceptable floor price'],
      min: [1, 'Minimum floor price must be greater than zero'],
      select: false // STRICT PRIVACY: Excluded by default from queries
    },
    style: {
      type: String,
      enum: ['FIRM', 'BALANCED', 'FLEXIBLE'],
      default: 'BALANCED'
    },
    maxRounds: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('SellerAgentConfig', sellerAgentConfigSchema);
