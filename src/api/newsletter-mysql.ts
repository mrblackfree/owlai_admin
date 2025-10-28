import { createHandler } from "./handler.js";
import { Request, Response } from 'express';
import { NewsletterSubscription } from '../db/models-mysql/index.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { getLanguage, getMessage } from '../i18n/messages.js';

const handler = createHandler();

// Subscribe to newsletter
handler.post('/', async (req: Request, res: Response) => {
    try {
        await connectMySQL();
        const { email, source = 'website' } = req.body;

        const [subscription, created] = await NewsletterSubscription.findOrCreate({
            where: { email },
            defaults: { email, source, status: 'active' }
        });

        if (!created && subscription.status === 'unsubscribed') {
            await subscription.update({ status: 'active' });
            return res.json({ success: true, message: '다시 구독하셨습니다!' });
        }

        if (!created) {
            return res.json({ success: false, message: '이미 구독 중입니다.' });
        }

        return res.json({ success: true, message: '뉴스레터 구독이 완료되었습니다!' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return res.status(500).json({ success: false, message: '구독 처리 중 오류가 발생했습니다.' });
    }
});

// Get all subscriptions (admin)
handler.get('/', async (req: Request, res: Response) => {
    try {
        await connectMySQL();
        const subscriptions = await NewsletterSubscription.findAll({
            order: [['createdAt', 'DESC']],
        });
        return res.json(subscriptions);
    } catch (error) {
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Unsubscribe
handler.post('/unsubscribe', async (req: Request, res: Response) => {
    try {
        await connectMySQL();
        const { email } = req.body;
        
        const subscription = await NewsletterSubscription.findOne({ where: { email } });
        if (subscription) {
            await subscription.update({ status: 'unsubscribed' });
        }
        
        return res.json({ success: true, message: '구독이 취소되었습니다.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: '오류가 발생했습니다.' });
    }
});

export { handler as newsletterHandler };

