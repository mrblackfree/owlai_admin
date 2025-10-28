import { createHandler } from "./handler.js";
import { Request, Response } from 'express';
import { NewsPost } from '../db/models-mysql/index.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { Op } from 'sequelize';
import { getLanguage, getMessage } from '../i18n/messages.js';

const handler = createHandler();

// Get all news posts
handler.get('/', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/news - Fetching news posts (MySQL)');
        await connectMySQL();

        const status = req.query.status as string || 'published';
        const limit = parseInt(req.query.limit as string) || 20;

        const posts = await NewsPost.findAll({
            where: { status: status as any },
            order: [['createdAt', 'DESC']],
            limit,
        });

        return res.json(posts);
    } catch (error) {
        console.error('Error fetching news posts:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get news post by slug
handler.get('/:slug', async (req: Request, res: Response) => {
    try {
        const post = await NewsPost.findOne({
            where: { slug: req.params.slug }
        });

        if (!post) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('POST_NOT_FOUND', lang, 'error') });
        }

        // Increment view count
        await post.increment('views');

        return res.json(post);
    } catch (error) {
        console.error('Error fetching news post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Create news post
handler.post('/', async (req: Request, res: Response) => {
    try {
        await connectMySQL();

        const newPost = await NewsPost.create(req.body);

        const lang = getLanguage(req);
        return res.status(201).json({
            message: getMessage('POST_CREATED', lang, 'success'),
            post: newPost
        });
    } catch (error) {
        console.error('Error creating news post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('POST_CREATE_FAILED', lang, 'error') });
    }
});

// Update news post
handler.patch('/:id', async (req: Request, res: Response) => {
    try {
        const post = await NewsPost.findByPk(req.params.id);

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
        console.error('Error updating news post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('POST_UPDATE_FAILED', lang, 'error') });
    }
});

// Delete news post
handler.delete('/:id', async (req: Request, res: Response) => {
    try {
        const post = await NewsPost.findByPk(req.params.id);

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
        console.error('Error deleting news post:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('POST_DELETE_FAILED', lang, 'error') });
    }
});

export { handler as newsHandler };

