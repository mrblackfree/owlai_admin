import mongoose, { Document, Model } from 'mongoose';

interface ISalesInquiry {
  fullName: string;
  email: string;
  companyName: string;
  monthlyBudget: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  submittedAt: Date;
  updatedAt: Date;
}

const salesInquirySchema = new mongoose.Schema<ISalesInquiry>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  companyName: { type: String, required: true },
  monthlyBudget: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new',
  },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create indexes
salesInquirySchema.index({ email: 1 });
salesInquirySchema.index({ status: 1 });
salesInquirySchema.index({ submittedAt: -1 });

// Update the updatedAt timestamp on save
salesInquirySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export type SalesInquiryDocument = Document & ISalesInquiry;
export const SalesInquiry = (mongoose.models.SalesInquiry || mongoose.model('SalesInquiry', salesInquirySchema)) as unknown as Model<SalesInquiryDocument>; 