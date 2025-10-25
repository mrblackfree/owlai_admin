import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  toolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tool', 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },  // Clerk ID
  userName: { 
    type: String, 
    required: true 
  },
  userAvatar: { 
    type: String, 
    default: '' 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminResponse: { 
    type: String, 
    default: '' 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
reviewSchema.index({ toolId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema); 