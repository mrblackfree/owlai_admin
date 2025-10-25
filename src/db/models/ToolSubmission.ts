import mongoose, { Document, Model } from 'mongoose';

interface IToolSubmission {
  toolName: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  category: string;
  pricingType: string;
  keyHighlights: string[];
  twitterUrl?: string;
  githubUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  updatedAt: Date;
}

const toolSubmissionSchema = new mongoose.Schema<IToolSubmission>({
  toolName: { type: String, required: true },
  description: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  logoUrl: { type: String, required: true },
  category: { type: String, required: true },
  pricingType: { type: String, required: true },
  keyHighlights: [{ type: String }],
  twitterUrl: { type: String },
  githubUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
}, {
  timestamps: {
    createdAt: 'submittedAt',
    updatedAt: 'updatedAt'
  }
});

export type ToolSubmissionDocument = Document & IToolSubmission;
export const ToolSubmission = (mongoose.models.ToolSubmission || mongoose.model('ToolSubmission', toolSubmissionSchema)) as unknown as Model<ToolSubmissionDocument>; 