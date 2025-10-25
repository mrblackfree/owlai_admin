import mongoose, { Document, Model } from 'mongoose';

// Define interfaces for type safety
interface IAuthor {
  name: string;
  avatar: string;
}

interface INewsPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: IAuthor;
  category: string;
  imageUrl: string;
  tags: string[];
  status: 'draft' | 'published';
  source: string;
  sourceUrl: string;
  views: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for the author subdocument
const authorSchema = new mongoose.Schema<IAuthor>({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
});

// Define the main news post schema
const newsPostSchema = new mongoose.Schema<INewsPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, required: true },
  author: { type: authorSchema, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  source: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Create indexes
newsPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

// Export the model using type assertion to make TypeScript happy
export type NewsPostDocument = Document & INewsPost;
export const NewsPost = (mongoose.models.NewsPost || mongoose.model('NewsPost', newsPostSchema)) as unknown as Model<NewsPostDocument>; 