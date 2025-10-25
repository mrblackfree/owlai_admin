import mongoose, { Document, Model } from 'mongoose';

interface INewsletterSubscription {
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: Date;
  unsubscribedAt?: Date;
  source: 'footer' | 'homepage' | 'other';
  ipAddress?: string;
  userAgent?: string;
}

const newsletterSubscriptionSchema = new mongoose.Schema<INewsletterSubscription>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active',
  },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  source: {
    type: String,
    enum: ['footer', 'homepage', 'other'],
    default: 'footer',
  },
  ipAddress: { type: String },
  userAgent: { type: String },
});

// Create indexes
newsletterSubscriptionSchema.index({ email: 1 }, { unique: true });
newsletterSubscriptionSchema.index({ status: 1 });
newsletterSubscriptionSchema.index({ subscribedAt: -1 });
newsletterSubscriptionSchema.index({ source: 1 });

export type NewsletterSubscriptionDocument = Document & INewsletterSubscription;
export const NewsletterSubscription = (mongoose.models.NewsletterSubscription || mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema)) as unknown as Model<NewsletterSubscriptionDocument>; 