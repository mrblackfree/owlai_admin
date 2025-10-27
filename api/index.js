// Vercel Serverless Function
// Auto-detected by Vercel from api/ folder

let app;

module.exports = async (req, res) => {
  // Lazy load the Express app
  if (!app) {
    try {
      const module = await import('../dist/index.js');
      app = module.default;
      console.log('Express app loaded successfully');
    } catch (error) {
      console.error('Failed to load Express app:', error);
      return res.status(500).json({ 
        error: 'Server initialization failed', 
        message: error.message 
      });
    }
  }
  
  // Forward the request to Express
  return app(req, res);
};

