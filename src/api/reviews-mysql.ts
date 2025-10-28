import { createHandler } from "./handler.js";
import { Request, Response } from 'express';
import { Review } from '../db/models-mysql/index.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { getLanguage, getMessage } from '../i18n/messages.js';

const handler = createHandler();

// Get reviews for a tool
handler.get('/tool/:toolId', async (req: Request, res: Response) => {
    try {
        await connectMySQL();
        const reviews = await Review.findAll({
            where: { toolId: req.params.toolId, status: 'approved' },
            order: [['createdAt', 'DESC']],
        });
        return res.json(reviews);
    } catch (error) {
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get all reviews (admin)
handler.get('/', async (req: Request, res: Response) => {
    try {
        await connectMySQL();
        const status = req.query.status as string;
        const where = status ? { status: status as any } : {};
        
        const reviews = await Review.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });
        return res.json(reviews);
    } catch (error) {
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Create review
handler.post('/', async (req: Request, res: Response) => {
    try {
        await connectMySQL();
        const review = await Review.create(req.body);
        const lang = getLanguage(req);
        return res.status(201).json({
            message: getMessage('REVIEW_CREATED', lang, 'success'),
            review
        });
    } catch (error) {
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('REVIEW_CREATE_FAILED', lang, 'error') });
    }
});

// Update review status (admin)
handler.patch('/:id', async (req: Request, res: Response) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('REVIEW_NOT_FOUND', lang, 'error') });
        }
        await review.update(req.body);
        return res.json(review);
    } catch (error) {
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Delete review
handler.delete('/:id', async (req: Request, res: Response) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('REVIEW_NOT_FOUND', lang, 'error') });
        }
        await review.destroy();
        return res.json({ message: 'Review deleted' });
    } catch (error) {
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

export default handler;

