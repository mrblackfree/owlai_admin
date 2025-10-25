import { createHandler } from "./handler.js";
import { z } from "zod";
import { NewsPost } from '../db/models/NewsPost.js';
import { connectDB } from '../db/connection.js';
import mongoose from 'mongoose';

const newsPostSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
    content: z.string().min(50, "Content must be at least 50 characters"),
    category: z.string().min(1, "Please select a category"),
    imageUrl: z.string().url("Please enter a valid image URL"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
    status: z.enum(["draft", "published"]).default("draft"),
    source: z.string().min(1, "Source is required"),
    sourceUrl: z.string().url("Please enter a valid source URL"),
    author: z.object({
        name: z.string().min(2, "Author name must be at least 2 characters"),
        avatar: z.string().url("Please enter a valid avatar URL"),
    }),
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

// Get all news posts
handler.get('/', async (req, res) => {
    try {
        console.log('GET /api/news - Attempting to fetch news posts');
        await connectDB();

        const posts = await NewsPost.find().sort({ createdAt: -1 });
        console.log('GET /api/news - Found', posts.length, 'posts');

        return res.json(posts);
    } catch (error) {
        console.error('Error fetching news posts:', error);
        return res.status(500).json({ error: 'Failed to fetch news posts', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get single news post by slug
handler.get('/:slug', async (req, res) => {
    try {
        console.log('GET /api/news/:slug - Fetching news post with slug:', req.params.slug);
        await connectDB();

        const post = await NewsPost.findOne({ slug: req.params.slug });
        console.log('Found post:', post ? 'yes' : 'no');

        if (!post) {
            return res.status(404).json({ error: 'News post not found' });
        }

        // Only return published posts unless user is authenticated
        if (post.status !== 'published' && !req.auth?.userId) {
            return res.status(404).json({ error: 'News post not found' });
        }

        // Increment views
        await NewsPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

        return res.json(post);
    } catch (error) {
        console.error('Error fetching news post:', error);
        return res.status(500).json({ error: 'Failed to fetch news post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Create news post
handler.post('/', async (req, res) => {
    try {
        console.log('POST /api/news - Creating news post');
        await connectDB();

        // Parse and validate the request body
        const validatedData = newsPostSchema.parse(req.body);
        console.log('Validated data:', validatedData);

        // Generate slug from title
        const slug = generateSlug(validatedData.title);
        const existingPost = await NewsPost.findOne({ slug });

        // If slug exists, append a random number
        const finalSlug = existingPost
            ? `${slug}-${Math.floor(Math.random() * 1000)}`
            : slug;

        const post = await NewsPost.create({
            ...validatedData,
            slug: finalSlug,
            date: new Date().toISOString(),
            views: 0,
            shares: 0,
        });

        console.log('Created news post:', post);
        return res.status(201).json(post);
    } catch (error) {
        console.error('Error creating news post:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to create news post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Update news post
handler.patch('/:id', async (req, res) => {
    try {
        console.log('Updating news post:', { id: req.params.id, body: req.body });
        await connectDB();
        const { id } = req.params;

        // Parse and validate the request body
        const validatedData = newsPostSchema.partial().parse(req.body);
        console.log('Validated update data:', validatedData);
        console.log('Author data in update:', validatedData.author);

        // If title is being updated, update slug as well
        if (validatedData.title) {
            const newSlug = generateSlug(validatedData.title);
            const existingPost = await NewsPost.findOne({
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

        // Ensure we update all author fields together
        if (validatedData.author) {
            // Make sure both name and avatar are set
            console.log('Found author data in update:', validatedData.author);
            
            // If author data is incomplete, fetch the current post
            if (!validatedData.author.name || !validatedData.author.avatar) {
                const currentPost = await NewsPost.findById(id);
                if (currentPost) {
                    validatedData.author = {
                        name: validatedData.author.name || currentPost.author.name,
                        avatar: validatedData.author.avatar || currentPost.author.avatar
                    };
                    console.log('Merged author data:', validatedData.author);
                }
            }
        }

        const updatedPost = await NewsPost.findByIdAndUpdate(
            id,
            { ...validatedData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            console.error('News post not found for update:', id);
            return res.status(404).json({ error: 'News post not found' });
        }

        console.log('Successfully updated news post:', updatedPost);
        return res.json(updatedPost);
    } catch (error) {
        console.error('Error updating news post:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update news post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Delete news post
handler.delete('/:id', async (req, res) => {
    try {
        console.log('Deleting news post:', req.params.id);
        await connectDB();

        const post = await NewsPost.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'News post not found' });
        }

        console.log('Successfully deleted news post:', post._id);
        return res.json({ message: 'News post deleted successfully' });
    } catch (error) {
        console.error('Error deleting news post:', error);
        return res.status(500).json({ error: 'Failed to delete news post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Increment shares count
handler.post('/:id/share', async (req, res) => {
    try {
        console.log('Incrementing shares for news post:', req.params.id);
        await connectDB();

        const post = await NewsPost.findByIdAndUpdate(
            req.params.id,
            { $inc: { shares: 1 } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ error: 'News post not found' });
        }

        return res.json(post);
    } catch (error) {
        console.error('Error incrementing shares:', error);
        return res.status(500).json({ error: 'Failed to increment shares', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Update stats manually (for testing purposes)
handler.patch('/:id/stats', async (req, res) => {
    try {
        console.log('Manually updating stats for news post:', req.params.id, req.body);
        await connectDB();
        
        const { views, shares } = req.body;
        const updateData: any = {};
        
        if (views !== undefined) {
            updateData.views = views;
        }
        
        if (shares !== undefined) {
            updateData.shares = shares;
        }
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No stats provided to update' });
        }

        const post = await NewsPost.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ error: 'News post not found' });
        }

        console.log('Successfully updated post stats:', post._id, updateData);
        return res.json(post);
    } catch (error) {
        console.error('Error updating post stats:', error);
        return res.status(500).json({ error: 'Failed to update post stats', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Export the handler
export const newsHandler = handler; 