import mongoose, { Document, Model } from 'mongoose';

// Define interfaces for type safety
interface IAuthor {
  name: string;
  avatar: string;
}

export interface IBlogPost {
  title: string;
  title_ko?: string; // 한글 제목
  slug: string;
  excerpt: string;
  excerpt_ko?: string; // 한글 발췌문
  content: string;
  content_ko?: string; // 한글 본문
  date: string;
  author: IAuthor;
  category: string;
  category_ko?: string; // 한글 카테고리
  readTime: string;
  imageUrl: string;
  tags: string[];
  tags_ko?: string[]; // 한글 태그
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
  title_ko: { type: String }, // 한글 제목
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  excerpt_ko: { type: String }, // 한글 발췌문
  content: { type: String, required: true },
  content_ko: { type: String }, // 한글 본문
  date: { type: String, required: true },
  author: { type: authorSchema, required: true },
  category: { type: String, required: true },
  category_ko: { type: String }, // 한글 카테고리
  readTime: { type: String, required: true },
  imageUrl: { type: String, required: true },
  tags: [{ type: String }],
  tags_ko: [{ type: String }], // 한글 태그
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