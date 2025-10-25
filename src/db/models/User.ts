import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  profileImageUrl: { type: String, default: '' },
  publicMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Fields to track tool interactions
  upvotedTools: [{ type: String }],
  savedTools: [{ type: String }],
  submittedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
userSchema.index({ clerkId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model('User', userSchema); 