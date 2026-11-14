import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
      index: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide rating from 1 to 5'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [600, 'Review comment cannot exceed 600 characters'],
      default: ''
    },
    flagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flagReason: {
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
reviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

reviewSchema.virtual('reviewee', {
  ref: 'User',
  localField: 'revieweeId',
  foreignField: '_id',
  justOne: true
});

reviewSchema.virtual('deal', {
  ref: 'Deal',
  localField: 'dealId',
  foreignField: '_id',
  justOne: true
});

// Compound unique index: Each participant can only review a given deal once
reviewSchema.index({ dealId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
