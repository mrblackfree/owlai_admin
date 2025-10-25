import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },  // Clerk ID
  customerId: { 
    type: String, 
    required: true 
  },  // Stripe customer ID
  subscriptionId: { 
    type: String, 
    required: true 
  }, // Stripe subscription ID
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: true
  },
  priceId: { 
    type: String, 
    required: true 
  }, // Stripe price ID
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'usd' 
  },
  interval: { 
    type: String, 
    enum: ['month', 'year'], 
    default: 'month' 
  },
  billingCycleAnchor: { 
    type: Date 
  },
  currentPeriodStart: { 
    type: Date, 
    required: true 
  },
  currentPeriodEnd: { 
    type: Date, 
    required: true 
  },
  cancelAtPeriodEnd: { 
    type: Boolean, 
    default: false 
  },
  canceledAt: { 
    type: Date 
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ subscriptionId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema); 