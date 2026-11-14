import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Electronics',
        'Mobiles',
        'Computers',
        'Books',
        'Furniture',
        'Vehicles',
        'Fashion',
        'Home Appliances',
        'Other'
      ],
      default: 'Electronics'
    },
    condition: {
      type: String,
      required: [true, 'Please select condition'],
      enum: ['New', 'Like New', 'Good', 'Fair', 'Used'],
      default: 'Good'
    },
    price: {
      type: Number,
      required: [true, 'Please provide a listing price'],
      min: [1, 'Price must be greater than zero']
    },
    location: {
      type: String,
      required: [true, 'Please provide item location (city / neighborhood)'],
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESERVED', 'SOLD', 'REMOVED'],
      default: 'ACTIVE',
      index: true
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for backward compatibility with seller populate
productSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true
});

// Full-text search index
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1, price: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);
