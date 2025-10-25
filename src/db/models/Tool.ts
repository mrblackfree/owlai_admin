import mongoose from 'mongoose';

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  pricing: {
    type: {
      type: String,
      enum: ['free', 'freemium', 'paid', 'enterprise'],
      required: true
    },
    startingPrice: { type: Number }
  },
  features: [{ type: String }],
  logo: { type: String },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  isTrending: { type: Boolean, default: false },
  isNewTool: { type: Boolean, default: false },
  isUpcoming: { type: Boolean, default: false },
  isTopRated: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 }
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

// Add indexes for better query performance
toolSchema.index({ name: 'text', description: 'text' }); // Text search index
toolSchema.index({ category: 1 }); // Category search
toolSchema.index({ status: 1 }); // Status filter
toolSchema.index({ isTrending: 1 }); // Trending filter
toolSchema.index({ isNewTool: 1 }); // New filter
toolSchema.index({ isUpcoming: 1 }); // Upcoming filter
toolSchema.index({ isTopRated: 1 }); // Top rated filter
toolSchema.index({ createdAt: -1 }); // Sort by date
toolSchema.index({ rating: -1 }); // Sort by rating
toolSchema.index({ views: -1 }); // Sort by views

export const Tool = mongoose.model('Tool', toolSchema); 