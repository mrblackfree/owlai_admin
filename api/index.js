// Vercel Serverless Function Handler
let app;

export default async function handler(req, res) {
  // Lazy load Express app
  if (!app) {
    try {
      const module = await import('../dist/index.js');
      app = module.default;
      
      if (!app) {
        throw new Error('Express app not exported from dist/index.js');
      }
      
      console.log('[Vercel] Express app loaded successfully');
    } catch (error) {
      console.error('[Vercel] Failed to load Express app:', error);
      return res.status(500).json({
        error: 'Failed to initialize server',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Check server logs'
      });
    }
  }

  // Handle request with Express
  try {
    return app(req, res);
  } catch (error) {
    console.error('[Vercel] Request handling error:', error);
    return res.status(500).json({
      error: 'Request failed',
      message: error.message
    });
  }
}

