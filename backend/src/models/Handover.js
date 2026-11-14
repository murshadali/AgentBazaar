import mongoose from 'mongoose';

const handoverSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
      unique: true,
      index: true
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    timeWindow: {
      type: String,
      trim: true,
      default: ''
    },
    contactNumber: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    suggestedByBuyerTimeWindow: {
      type: String,
      trim: true,
      default: ''
    },
    paymentNotice: {
      type: String,
      default: 'Payment is arranged directly between the buyer and seller outside AgentBazaar. The platform does not process payments.'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Handover', handoverSchema);
