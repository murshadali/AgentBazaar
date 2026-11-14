import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: 'Aligarh'
    },
    photo: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: 'P2P Marketplace member'
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEACTIVATED'],
      default: 'ACTIVE'
    },
    defaultStyle: {
      type: String,
      enum: ['FIRM', 'BALANCED', 'FLEXIBLE'],
      default: 'BALANCED'
    },
    defaultRounds: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    reputation: {
      averageRating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5
      },
      totalReviews: {
        type: Number,
        default: 0
      },
      completedDeals: {
        type: Number,
        default: 0
      }
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for avatar / photo compatibility
userSchema.virtual('avatar').get(function () {
  return this.photo || '';
});

// Virtual for location / city compatibility
userSchema.virtual('location').get(function () {
  return this.city || '';
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
