import mongoose, { Document, Model } from 'mongoose';

interface IAdvertisingPurchase {
  userId: string;
  userEmail: string;
  planId: mongoose.Types.ObjectId;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal';
  paymentId: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'refunded';
  startDate: Date;
  endDate: Date;
  toolId?: string; // Tool being advertised
  toolName?: string;
  toolUrl?: string;
  placement: 'basic' | 'featured' | 'premium' | 'sponsored';
  features: string[];
  analytics: {
    impressions: number;
    clicks: number;
    ctr: number; // Click-through rate
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const advertisingPurchaseSchema = new mongoose.Schema<IAdvertisingPurchase>({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  planId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdvertisingPlan', 
    required: true 
  },
  planName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  currency: { 
    type: String, 
    default: 'USD' 
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: true
  },
  paymentId: { 
    type: String, 
    required: true, 
    index: true 
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  toolId: { 
    type: String 
  },
  toolName: { 
    type: String 
  },
  toolUrl: { 
    type: String 
  },
  placement: {
    type: String,
    enum: ['basic', 'featured', 'premium', 'sponsored'],
    required: true
  },
  features: [{ 
    type: String 
  }],
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }
  },
  notes: { 
    type: String 
  }
}, {
  timestamps: true
});

// Create indexes
advertisingPurchaseSchema.index({ userId: 1, status: 1 });
advertisingPurchaseSchema.index({ planId: 1 });
advertisingPurchaseSchema.index({ paymentId: 1 }, { unique: true });
advertisingPurchaseSchema.index({ status: 1 });
advertisingPurchaseSchema.index({ startDate: 1, endDate: 1 });
advertisingPurchaseSchema.index({ createdAt: -1 });

// Virtual for checking if purchase is currently active
advertisingPurchaseSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

export type AdvertisingPurchaseDocument = Document & IAdvertisingPurchase;
export const AdvertisingPurchase = (mongoose.models.AdvertisingPurchase || mongoose.model('AdvertisingPurchase', advertisingPurchaseSchema)) as unknown as Model<AdvertisingPurchaseDocument>; 