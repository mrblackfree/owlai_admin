import mongoose, { Document, Model } from 'mongoose';

interface IAdvertisingPlan {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // Duration in days
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  stripePriceId?: string;
  paypalPlanId?: string;
  placement: 'basic' | 'featured' | 'premium' | 'sponsored';
  maxListings: number;
  analytics: boolean;
  socialPromotion: boolean;
  newsletterFeature: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const advertisingPlanSchema = new mongoose.Schema<IAdvertisingPlan>({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  currency: { 
    type: String, 
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP'] 
  },
  duration: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  features: [{ 
    type: String, 
    required: true 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isPopular: { 
    type: Boolean, 
    default: false 
  },
  stripePriceId: { 
    type: String 
  },
  paypalPlanId: { 
    type: String 
  },
  placement: {
    type: String,
    enum: ['basic', 'featured', 'premium', 'sponsored'],
    default: 'basic'
  },
  maxListings: {
    type: Number,
    default: 1,
    min: 1
  },
  analytics: {
    type: Boolean,
    default: false
  },
  socialPromotion: {
    type: Boolean,
    default: false
  },
  newsletterFeature: {
    type: Boolean,
    default: false
  },
  prioritySupport: {
    type: Boolean,
    default: false
  },
  customIntegrations: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
advertisingPlanSchema.index({ slug: 1 }, { unique: true });
advertisingPlanSchema.index({ isActive: 1 });
advertisingPlanSchema.index({ price: 1 });
advertisingPlanSchema.index({ placement: 1 });

export type AdvertisingPlanDocument = Document & IAdvertisingPlan;
export const AdvertisingPlan = (mongoose.models.AdvertisingPlan || mongoose.model('AdvertisingPlan', advertisingPlanSchema)) as unknown as Model<AdvertisingPlanDocument>; 