// Vercel Serverless Function wrapper for Express
export default async function handler(req, res) {
  try {
    const { default: app } = await import('../dist/index.js');
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

