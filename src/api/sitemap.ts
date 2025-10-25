import { createHandler } from "./handler.js";
import { Tool } from '../db/models/Tool.js';
import { BlogPost } from '../db/models/BlogPost.js';
import { NewsPost } from '../db/models/NewsPost.js';
import { connectDB } from '../db/connection.js';

const handler = createHandler();

// Helper function to get URLs from environment variables
function getUrls() {
  const frontendUrl = process.env.FRONTEND_URL;
  const apiUrl = process.env.BACKEND_URL;
  
  if (!frontendUrl) {
    console.error('FRONTEND_URL environment variable is not set!');
    throw new Error('FRONTEND_URL environment variable is required');
  }
  
  if (!apiUrl) {
    console.error('BACKEND_URL environment variable is not set!');
    throw new Error('BACKEND_URL environment variable is required');
  }
  
  console.log('Using URLs from environment - Frontend:', frontendUrl, 'Backend:', apiUrl);
  
  return { frontendUrl, apiUrl };
}

// Generate XML sitemap
handler.get('/sitemap.xml', async (req, res) => {
  try {
    console.log('GET /api/sitemap/sitemap.xml - Generating sitemap');
    await connectDB();
    
    const { frontendUrl } = getUrls();
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
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Generate sitemap and return metadata
handler.post('/generate', async (req, res) => {
  try {
    console.log('POST /api/sitemap/generate - Generating sitemap metadata');
    await connectDB();
    
    // Count all public content
    const [toolsCount, blogPostsCount, newsPostsCount] = await Promise.all([
      Tool.countDocuments({ status: { $in: ['published', 'approved'] } }),
      BlogPost.countDocuments({ status: 'published' }),
      NewsPost.countDocuments({ status: 'published' })
    ]);

    const staticPagesCount = 15; // Number of static pages
    const totalUrls = staticPagesCount + toolsCount + blogPostsCount + newsPostsCount;
    
    const { frontendUrl, apiUrl } = getUrls();
    console.log('Generate sitemap - Frontend URL:', frontendUrl, 'API URL:', apiUrl);
    
    const sitemapData = {
      totalUrls,
      breakdown: {
        staticPages: staticPagesCount,
        tools: toolsCount,
        blogPosts: blogPostsCount,
        newsPosts: newsPostsCount
      },
      lastGenerated: new Date().toISOString(),
      sitemapUrl: `${frontendUrl}/sitemap.xml`
    };

    console.log('Sitemap metadata generated:', sitemapData);

    return res.json({
      success: true,
      message: 'Sitemap generated successfully',
      data: sitemapData
    });
    
  } catch (error) {
    console.error('Error generating sitemap metadata:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to generate sitemap metadata' 
    });
  }
});

// Get sitemap statistics
handler.get('/stats', async (req, res) => {
  try {
    console.log('GET /api/sitemap/stats - Getting sitemap statistics');
    await connectDB();
    
    // Count all public content
    const [toolsCount, blogPostsCount, newsPostsCount] = await Promise.all([
      Tool.countDocuments({ status: { $in: ['published', 'approved'] } }),
      BlogPost.countDocuments({ status: 'published' }),
      NewsPost.countDocuments({ status: 'published' })
    ]);

    const staticPagesCount = 15;
    const totalUrls = staticPagesCount + toolsCount + blogPostsCount + newsPostsCount;
    
    const { frontendUrl, apiUrl } = getUrls();
    console.log('Sitemap stats - Frontend URL:', frontendUrl, 'API URL:', apiUrl);
    
    const stats = {
      totalUrls,
      breakdown: {
        staticPages: staticPagesCount,
        tools: toolsCount,
        blogPosts: blogPostsCount,
        newsPosts: newsPostsCount
      },
      sitemapUrl: `${frontendUrl}/sitemap.xml`
    };

    return res.json(stats);
    
  } catch (error) {
    console.error('Error getting sitemap statistics:', error);
    return res.status(500).json({ error: 'Failed to get sitemap statistics' });
  }
});

export const sitemapHandler = handler; 