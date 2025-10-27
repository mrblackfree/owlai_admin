// Vercel Serverless Function Handler
// This file MUST be at api/index.js for Vercel to detect it

const path = require('path');

// Cache the Express app instance
let cachedApp = null;

async function loadApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Import the compiled Express app from dist/index.js
    const { default: app } = await import('../dist/index.js');
    cachedApp = app;
    console.log('[Vercel] Express app loaded successfully');
    return app;
  } catch (error) {
    console.error('[Vercel] Failed to load Express app:', error);
    throw error;
  }
}

// Export the serverless function handler
module.exports = async (req, res) => {
  try {
    const app = await loadApp();
    
    // Let Express handle the request
    return app(req, res);
  } catch (error) {
    console.error('[Vercel] Request handler error:', error);
    
    // Return detailed error for debugging
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

