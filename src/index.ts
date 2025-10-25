import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { toolsHandler } from './api/tools.js';
import { blogHandler } from './api/blog.js';
import { newsHandler } from './api/news.js';
import { salesInquiriesHandler } from './api/salesInquiries.js';
import { newsletterHandler } from './api/newsletter.js';
import { sitemapHandler } from './api/sitemap.js';
import { connectDB } from './db/connection.js';
import { usersHandler } from './api/users.js';
import reviewsRouter from './api/reviews.js';
import configRouter from './api/config.js';
import { paymentsHandler } from './api/payments.js';
import { paymentSettingsHandler } from './api/paymentSettings.js';
import sponsorshipsRouter from './api/sponsorships.js';
import { advertisingPlansHandler } from './api/advertisingPlans.js';

const app = express();
const port = process.env.PORT || 3005;

// Configure CORS with specific options
app.use(cors({
    origin: true, // Allow requests from any origin (will respond with the request origin)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'stripe-signature', 
        'X-Clerk-Auth-Token',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Enable pre-flight requests for all routes
app.options('*', cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'stripe-signature', 
        'X-Clerk-Auth-Token',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin'
    ]
}));

// Serve static files from the public directory
app.use(express.static('public'));
console.log('Serving static files from:', process.cwd() + '/public');

// Parse JSON requests (except for Stripe webhook route)
app.use((req, res, next) => {
    if (req.path === '/api/payments/webhook' && req.method === 'POST') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Debug middleware
app.use((req, res, next) => {
    // Add CORS headers to all responses
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, stripe-signature, X-Clerk-Auth-Token, X-Requested-With, Accept, Origin');

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Don't log bodies of file uploads as they're binary data
    if ((req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') && 
        req.path !== '/api/payments/webhook' && 
        !req.path.includes('upload-') &&
        !req.headers['content-type']?.includes('multipart/form-data')) {
        console.log('Request body:', req.body);
    }
    next();
});

// Connect to MongoDB
connectDB().catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root-level sitemap route (SEO standard)
app.get('/sitemap.xml', async (req, res) => {
    try {
        console.log('GET /sitemap.xml - Serving sitemap at root level');
        await connectDB();
        
        // Import the sitemap generation logic directly
        const { Tool } = await import('./db/models/Tool.js');
        const { BlogPost } = await import('./db/models/BlogPost.js');
        const { NewsPost } = await import('./db/models/NewsPost.js');
        
        // Determine the frontend URL more intelligently
        let frontendUrl = process.env.FRONTEND_URL;
        
        if (!frontendUrl) {
            // Extract from request headers if available
            const host = req.get('host');
            const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
            const referer = req.get('referer');
            
            if (referer) {
                // Extract base URL from referer
                const refererUrl = new URL(referer);
                frontendUrl = `${refererUrl.protocol}//${refererUrl.host}`;
            } else if (host) {
                // Use current host but assume it's the frontend
                frontendUrl = `${protocol}://${host.replace(':3005', '')}`;
                // Handle common production scenarios
                if (host.includes('aitoolfind.co') || host.includes('netlify') || host.includes('vercel')) {
                    frontendUrl = `${protocol}://${host}`;
                }
            } else {
                // Fallback for development
                frontendUrl = 'http://localhost:8080';
            }
        }
        
        console.log('Using frontend URL for sitemap:', frontendUrl);
        
        // Fetch all public content
        const [tools, blogPosts, newsPosts] = await Promise.all([
            Tool.find({ status: { $in: ['published', 'approved'] } }).select('slug updatedAt createdAt').sort({ updatedAt: -1 }),
            BlogPost.find({ status: 'published' }).select('slug updatedAt date').sort({ updatedAt: -1 }),
            NewsPost.find({ status: 'published' }).select('slug updatedAt date').sort({ updatedAt: -1 })
        ]);

        // Static pages
        const staticPages = [
            { url: '', priority: '1.0', changefreq: 'daily' },
            { url: '/latest-launches', priority: '0.8', changefreq: 'daily' },
            { url: '/top-products', priority: '0.8', changefreq: 'daily' },
            { url: '/upcoming', priority: '0.7', changefreq: 'daily' },
            { url: '/categories', priority: '0.8', changefreq: 'weekly' },
            { url: '/trending', priority: '0.7', changefreq: 'daily' },
            { url: '/blog', priority: '0.7', changefreq: 'daily' },
            { url: '/latest-news', priority: '0.7', changefreq: 'daily' },
            { url: '/news', priority: '0.7', changefreq: 'daily' },
            { url: '/about', priority: '0.5', changefreq: 'monthly' },
            { url: '/guides', priority: '0.6', changefreq: 'weekly' },
            { url: '/faq', priority: '0.5', changefreq: 'monthly' },
            { url: '/advertise', priority: '0.5', changefreq: 'monthly' },
            { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
            { url: '/terms', priority: '0.3', changefreq: 'yearly' }
        ];

        // Build sitemap XML
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        staticPages.forEach(page => {
            sitemap += `
  <url>
    <loc>${frontendUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Add tools
        tools.forEach(tool => {
            const lastmod = tool.updatedAt || tool.createdAt;
            sitemap += `
  <url>
    <loc>${frontendUrl}/ai-tools/${tool.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        // Add blog posts
        blogPosts.forEach(post => {
            const lastmod = post.updatedAt || new Date(post.date);
            sitemap += `
  <url>
    <loc>${frontendUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        // Add news posts
        newsPosts.forEach(post => {
            const lastmod = post.updatedAt || new Date(post.date);
            sitemap += `
  <url>
    <loc>${frontendUrl}/news/${post.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        sitemap += `
</urlset>`;

        console.log(`Generated sitemap with ${staticPages.length + tools.length + blogPosts.length + newsPosts.length} URLs`);

        // Set appropriate headers
        res.set({
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        });

        return res.send(sitemap);
        
    } catch (error) {
        console.error('Error serving root sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// Special handling for the vote endpoint to ensure maximum compatibility
app.use('/api/tools/:id/vote', (req, res, next) => {
    // Set permissive CORS headers specifically for vote endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// API Routes
app.use('/api/tools', toolsHandler.middleware());
app.use('/api/blog', blogHandler.middleware());
app.use('/api/news', newsHandler.middleware());
app.use('/api/sales-inquiries', salesInquiriesHandler.middleware());
app.use('/api/newsletter', newsletterHandler.middleware());
app.use('/api/sitemap', sitemapHandler.middleware());
app.use('/api/advertising-plans', advertisingPlansHandler.middleware());
app.use('/api/payments', paymentsHandler.middleware());
app.use('/api/payment-settings', paymentSettingsHandler.middleware());
app.use('/api/users', usersHandler.middleware());

// New API Routes for v1.0.4
app.use('/api/reviews', reviewsRouter);
app.use('/api/config', configRouter);
app.use('/api/sponsorships', sponsorshipsRouter);

// Users API endpoint
app.get('/api/users', async (req, res) => {
    try {
        console.log('Fetching users from Clerk');
        const { data: users } = await clerkClient.users.getUserList();
        console.log('Got users from Clerk:', users.length);

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.emailAddresses[0]?.emailAddress || '',
            role: (user.publicMetadata?.role as string) || 'user',
            status: (user.publicMetadata?.status as string) || 'active',
            lastActive: user.lastSignInAt || user.createdAt,
            joinedAt: user.createdAt,
            avatarUrl: user.imageUrl,
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Add better error handling for Express
app.use((err, req, res, next) => {
  console.error('Express error caught:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    status: err.status
  });
  
  // Send detailed error in development, simplified in production
  if (process.env.NODE_ENV === 'development') {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
  } else {
    res.status(err.status || 500).json({
      error: 'Server error occurred'
    });
  }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server started successfully`);
}); 