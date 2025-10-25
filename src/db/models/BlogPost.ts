import mongoose, { Document, Model } from 'mongoose';

// Define interfaces for type safety
interface IAuthor {
  name: string;
  avatar: string;
}

export interface IBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: IAuthor;
  category: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
  status: 'draft' | 'published';
  likes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for the author subdocument
const authorSchema = new mongoose.Schema<IAuthor>({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
});

// Define the main blog post schema
const blogPostSchema = new mongoose.Schema<IBlogPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, required: true },
  author: { type: authorSchema, required: true },
  category: { type: String, required: true },
  readTime: { type: String, required: true },
  imageUrl: { type: String, required: true },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Create indexes
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

// Export the model using type assertion to make TypeScript happy
export type BlogPostDocument = Document & IBlogPost;
export const BlogPost = (mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema)) as unknown as Model<BlogPostDocument>; 