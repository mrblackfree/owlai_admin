import { createHandler } from "./handler.js";
import { Request, Response } from 'express';
import { BlogPost } from '../db/models-mysql/index.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { Op } from 'sequelize';
import { getLanguage, getMessage } from '../i18n/messages.js';

const handler = createHandler();

// Get all blog posts
handler.get('/', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/blog - Fetching blog posts (MySQL)');
        await connectMySQL();

        const status = req.query.status as string || 'published';
        const limit = parseInt(req.query.limit as string) || 20;

        const posts = await BlogPost.findAll({
            where: { status: status as any },
            order: [['createdAt', 'DESC']],
            limit,
        });

        return res.json(posts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get blog post by slug
handler.get('/:slug', async (req: Request, res: Response) => {
    try {
        const post = await BlogPost.findOne({
            where: { slug: req.params.slug }
        });

        if (!post) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('POST_NOT_FOUND', lang, 'error') });
        }

        return res.json(post);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Create blog post
handler.post('/', async (req: Request, res: Response) => {
    try {
        await connectMySQL();

        const newPost = await BlogPost.create(req.body);

        const lang = getLanguage(req);
        return res.status(201).json({
            message: getMessage('POST_CREATED', lang, 'success'),
            post: newPost
        });
    } catch (error) {
        console.error('Error creating blog post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('POST_CREATE_FAILED', lang, 'error') });
    }
});

// Update blog post
handler.patch('/:id', async (req: Request, res: Response) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);

        if (!post) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('POST_NOT_FOUND', lang, 'error') });
        }

        await post.update(req.body);

        const lang = getLanguage(req);
        return res.json({
            message: getMessage('POST_UPDATED', lang, 'success'),
            post
        });
    } catch (error) {
        console.error('Error updating blog post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('POST_UPDATE_FAILED', lang, 'error') });
    }
});

// Delete blog post
handler.delete('/:id', async (req: Request, res: Response) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);

        if (!post) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('POST_NOT_FOUND', lang, 'error') });
        }

        await post.destroy();

        const lang = getLanguage(req);
        return res.json({
            message: getMessage('POST_DELETED', lang, 'success')
        });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('POST_DELETE_FAILED', lang, 'error') });
    }
});

export { handler as blogHandler };

