import { createHandler } from "./handler.js";
import { Request, Response } from 'express';
import { User } from '../db/models-mysql/index.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { getLanguage, getMessage } from '../i18n/messages.js';

const handler = createHandler();

// Get all users
handler.get('/', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/users - Fetching users (MySQL)');
        await connectMySQL();

        const users = await User.findAll({
            order: [['createdAt', 'DESC']],
        });

        return res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get user by Clerk ID
handler.get('/user/:clerkId', async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({
            where: { clerkId: req.params.clerkId }
        });

        if (!user) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('USER_NOT_FOUND', lang, 'error') });
        }

        return res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Create or update user
handler.post('/sync', async (req: Request, res: Response) => {
    try {
        const { clerkId, email, firstName, lastName } = req.body;

        const [user, created] = await User.findOrCreate({
            where: { clerkId },
            defaults: {
                clerkId,
                email,
                firstName,
                lastName,
                role: 'user',
                status: 'active',
            }
        });

        if (!created) {
            await user.update({ email, firstName, lastName });
        }

        return res.json({ user, created });
    } catch (error) {
        console.error('Error syncing user:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('USER_UPDATE_FAILED', lang, 'error') });
    }
});

// Update user role
handler.patch('/user/:clerkId/set-admin-role', async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({
            where: { clerkId: req.params.clerkId }
        });

        if (!user) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('USER_NOT_FOUND', lang, 'error') });
        }

        await user.update({ role: 'admin' });

        const lang = getLanguage(req);
        return res.json({
            message: getMessage('USER_UPDATED', lang, 'success'),
            user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('USER_UPDATE_FAILED', lang, 'error') });
    }
});

export { handler as usersHandler };

