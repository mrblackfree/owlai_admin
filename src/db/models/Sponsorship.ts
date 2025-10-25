import mongoose, { Schema, Document } from 'mongoose';

export interface ISponsorship extends Document {
  toolId: mongoose.Types.ObjectId;
  name: string;
  logo: string;
  description: string;
  rating: number;
  category: string;
  url: string;
  slug: string;
  views: number;
  impressions: number;
  tags: string[];
  premiumBadge: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorshipSchema: Schema = new Schema(
  {
    toolId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tool',
      required: true 
    },
    name: { type: String, required: true },
    logo: { type: String },
    description: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    category: { type: String, required: true },
    url: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    views: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    premiumBadge: { type: Boolean, default: false },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  { timestamps: true }
);

// Using mongoose.model directly rather than the models check for ESM compatibility
const Sponsorship = mongoose.model<ISponsorship>('Sponsorship', SponsorshipSchema);
export default Sponsorship; 