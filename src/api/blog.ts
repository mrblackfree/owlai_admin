import { createHandler } from "./handler.js";
import { z } from "zod";
import { BlogPost } from '../db/models/BlogPost.js';
import { connectDB } from '../db/connection.js';
import mongoose from 'mongoose';
import { Request } from 'express';

declare module 'express' {
    interface Request {
        auth?: { userId: string };
    }
}

const blogPostSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
    content: z.string().min(50, "Content must be at least 50 characters"),
    category: z.string().min(1, "Please select a category"),
    readTime: z.string().min(1, "Read time is required"),
    imageUrl: z.string().url("Please enter a valid image URL"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
    status: z.enum(["draft", "published"]).default("draft"),
    slug: z.string().optional(),
    date: z.string().optional(),
});

// Create the handler instance
const handler = createHandler();

// Generate slug from title
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
};

// Get all blog posts
handler.get('/', async (_req, res) => {
    try {
        console.log('GET /api/blog - Attempting to fetch blog posts');

        // Log MongoDB connection state and database
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        console.log('MongoDB database:', mongoose.connection.db?.databaseName);

        await connectDB();
        console.log('Connected to MongoDB successfully');

        if (!mongoose.connection.db) {
            throw new Error('Database connection not established');
        }

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in database:', collections.map(c => c.name));

        const posts = await BlogPost.find().sort({ createdAt: -1 });
        console.log('GET /api/blog - Found', posts.length, 'posts');

        if (posts.length > 0) {
            console.log('Sample post:', JSON.stringify(posts[0], null, 2));
        } else {
            // Check if the collection exists but is empty
            const blogPostsCollection = mongoose.connection.db.collection('blogposts');
            const count = await blogPostsCollection.countDocuments();
            console.log('Direct collection count:', count);
        }

        return res.json(posts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return res.status(500).json({ error: 'Failed to fetch blog posts', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get single blog post by slug
handler.get('/:slug', async (req, res) => {
    try {
        console.log('GET /api/blog/:slug - Fetching blog post with slug:', req.params.slug);
        await connectDB();

        const post = await BlogPost.findOne({ slug: req.params.slug });
        console.log('Found post:', post ? 'yes' : 'no');

        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        // Only return published posts unless user is authenticated
        if (post.status !== 'published' && !req.auth?.userId) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        return res.json(post);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return res.status(500).json({ error: 'Failed to fetch blog post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Create new blog post
handler.post('/', async (req, res) => {
    try {
        console.log('POST /api/blog - Creating blog post');
        await connectDB();

        // Parse and validate the request body
        const validatedData = blogPostSchema.parse(req.body);
        console.log('Validated data:', validatedData);

        // Generate slug from title if not provided
        let slug = validatedData.slug;
        if (!slug && validatedData.title) {
            slug = generateSlug(validatedData.title);
            const existingPost = await BlogPost.findOne({ slug });
            
            // If slug exists, append a random number
            if (existingPost) {
                const randomSuffix = Math.floor(Math.random() * 1000);
                slug = `${slug}-${randomSuffix}`;
            }
        }

        // Get user information from auth object if available
        const userId = req.auth?.userId;
        
        // Create the post with author information
        const post = await BlogPost.create({
            ...validatedData,
            slug,
            date: validatedData.date || new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
                name: 'AI Hunt Admin', // Default author name
                avatar: 'https://ui-avatars.com/api/?name=Admin&background=random', // Default avatar
                userId: userId || 'system'
            }
        });

        console.log('Created blog post:', post);
        return res.status(201).json(post);
    } catch (error) {
        console.error('Error creating blog post:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: error.errors 
            });
        }
        return res.status(500).json({ 
            error: 'Failed to create blog post', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Update blog post
handler.patch('/:id', async (req, res) => {
    try {
        console.log('Updating blog post:', { id: req.params.id, body: req.body });
        await connectDB();
        const { id } = req.params;

        // Parse and validate the request body
        const validatedData = blogPostSchema.partial().parse(req.body);
        console.log('Validated update data:', validatedData);

        // Log the current state of the post before update
        const currentPost = await BlogPost.findById(id);
        console.log('Current post state:', currentPost);

        // If title is being updated, update slug as well
        if (validatedData.title) {
            const newSlug = generateSlug(validatedData.title);
            const existingPost = await BlogPost.findOne({
                slug: newSlug,
                _id: { $ne: id }
            });

            if (existingPost) {
                const randomSuffix = Math.floor(Math.random() * 1000);
                validatedData.slug = `${newSlug}-${randomSuffix}`;
            } else {
                validatedData.slug = newSlug;
            }
        }

        const updatedPost = await BlogPost.findByIdAndUpdate(
            id,
            { ...validatedData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            console.error('Blog post not found for update:', id);
            return res.status(404).json({ error: 'Blog post not found' });
        }

        console.log('Successfully updated blog post:', updatedPost);
        return res.json(updatedPost);
    } catch (error) {
        console.error('Error updating blog post:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update blog post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Delete blog post
handler.delete('/:id', async (req, res) => {
    try {
        console.log('Deleting blog post:', req.params.id);
        await connectDB();

        const post = await BlogPost.findByIdAndDelete(req.params.id);

        if (!post) {
            console.error('Blog post not found for deletion:', req.params.id);
            return res.status(404).json({ error: 'Blog post not found' });
        }

        console.log('Successfully deleted blog post:', post._id);
        return res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        return res.status(500).json({ error: 'Failed to delete blog post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Export the handler
export const blogHandler = handler;