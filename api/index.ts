import { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toolsHandler } from '../src/api/tools.js';
import { blogHandler } from '../src/api/blog.js';
import { newsHandler } from '../src/api/news.js';
import { salesInquiriesHandler } from '../src/api/salesInquiries.js';
import { newsletterHandler } from '../src/api/newsletter.js';
import { sitemapHandler } from '../src/api/sitemap.js';
import { usersHandler } from '../src/api/users.js';
import reviewsRouter from '../src/api/reviews.js';
import configRouter from '../src/api/config.js';
import { paymentsHandler } from '../src/api/payments.js';
import { paymentSettingsHandler } from '../src/api/paymentSettings.js';
import sponsorshipsRouter from '../src/api/sponsorships.js';
import { advertisingPlansHandler } from '../src/api/advertisingPlans.js';

const app = express();

// Configure CORS
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'X-Clerk-Auth-Token', 'X-Requested-With', 'Accept', 'Origin'],
}));

app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/tools', toolsHandler);
app.use('/api/blog', blogHandler);
app.use('/api/news', newsHandler);
app.use('/api/sales-inquiries', salesInquiriesHandler);
app.use('/api/newsletter', newsletterHandler);
app.use('/api/sitemap', sitemapHandler);
app.use('/api/users', usersHandler);
app.use('/api/reviews', reviewsRouter);
app.use('/api/config', configRouter);
app.use('/api/payments', paymentsHandler);
app.use('/api/payment-settings', paymentSettingsHandler);
app.use('/api/sponsorships', sponsorshipsRouter);
app.use('/api/advertising-plans', advertisingPlansHandler);

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'AI Tool Finder API', 
        version: '1.0.0',
        status: 'running'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

export default app;

