import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { SiteConfig } from '../db/models/SiteConfig.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a local uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../public/uploads/og-images');
fs.mkdirSync(uploadsDir, { recursive: true });

// Create local uploads directory for logos
const logosDir = path.join(__dirname, '../../public/uploads/logos');
fs.mkdirSync(logosDir, { recursive: true });

// Add a fallback local storage for when Cloudinary fails
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'og-image-' + uniqueSuffix + ext);
  }
});

// Local storage for logos
const logoLocalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// Create a fallback upload middleware
const uploadOgImageLocal = multer({ storage: localStorage });
const uploadLogoLocal = multer({ storage: logoLocalStorage });

// Configure Cloudinary
console.log('Configuring Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'PRESENT' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING'
});

// Check if all Cloudinary credentials are present
const hasCloudinaryCredentials = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (!hasCloudinaryCredentials) {
  console.warn('⚠️ Cloudinary credentials missing or incomplete. Will use local storage for uploads.');
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Test Cloudinary configuration
  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Cloudinary connection successful:', result);
    })
    .catch(error => {
      console.error('❌ Cloudinary connection failed:', error);
      console.warn('Will fall back to local storage for uploads');
    });
}

// Setup multer storage with Cloudinary for regular logos
const logoStorage = hasCloudinaryCredentials 
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'ai-tool-finder/site/logos',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, crop: 'limit' }],
        resource_type: 'auto' // Allow automatic detection of resource type
      } as any
    })
  : logoLocalStorage; // Use local storage as fallback if no Cloudinary credentials

// Specific storage for OG images with different dimensions
const ogImageStorage = hasCloudinaryCredentials
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'ai-tool-finder/site/og-images',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }],
        resource_type: 'auto' // Allow automatic detection of resource type
      } as any
    })
  : localStorage; // Use local storage as fallback if no Cloudinary credentials

// Specific storage for favicons with different dimensions
const faviconStorage = hasCloudinaryCredentials
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'ai-tool-finder/site/favicons',
        allowed_formats: ['jpg', 'jpeg', 'png', 'ico', 'gif'],
        transformation: [{ width: 64, crop: 'limit' }], // Remove height constraint for better handling
        resource_type: 'auto' // Allow automatic detection of resource type
      } as any
    })
  : logoLocalStorage; // Reuse the logo local storage for favicons too

// Create separate upload middleware for different image types
const uploadLogo = hasCloudinaryCredentials ? multer({ storage: logoStorage }) : uploadLogoLocal;
const uploadFavicon = hasCloudinaryCredentials ? multer({ storage: faviconStorage }) : uploadLogoLocal;
const uploadOgImage = hasCloudinaryCredentials ? multer({ storage: ogImageStorage }) : uploadOgImageLocal;

// Add file type validation middleware
const validateImageType = (req, res, next) => {
  // Skip validation if no file is present (multer will handle that error)
  if (!req.file) {
    return next();
  }
  
  // Only allow JPEG and PNG files for maximum compatibility
  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    console.error('Invalid file type rejected:', req.file.mimetype);
    return res.status(400).json({ 
      error: 'Invalid file type. Only JPEG and PNG files are allowed.',
      submittedType: req.file.mimetype,
      allowedTypes: allowedMimeTypes
    });
  }
  
  // File type is valid, continue
  next();
};

// TESTING ROUTE - No auth required, direct database access
router.post('/test-save', async (req, res) => {
  try {
    console.log('TEST ROUTE: Received data to save:', JSON.stringify(req.body, null, 2));
    
    // Force create or update the config
    const defaultConfig = {
      siteName: 'Default Name',
      siteDescription: 'Default Description',
      footerText: 'Default Footer',
      contactEmail: 'default@example.com',
      metaTags: {
        title: 'Default Title',
        description: 'Default Description',
        keywords: 'default, keywords',
        ogImage: '/default-og.jpg'
      }
    };
    
    // Find existing or create new - directly access database
    let config = await SiteConfig.findOne();
    if (!config) {
      console.log('Creating brand new config with defaults and overrides');
      config = new SiteConfig({
        ...defaultConfig,
        ...req.body
      });
    } else {
      console.log('Found existing config, updating with new data');
      // For each key in req.body, update the config directly
      Object.keys(req.body).forEach(key => {
        if (key === 'metaTags' && req.body.metaTags) {
          // Handle metaTags specially
          config.metaTags = {
            ...config.metaTags || {},
            ...req.body.metaTags
          };
        } else {
          config[key] = req.body[key];
        }
      });
    }
    
    console.log('About to save config:', JSON.stringify(config.toObject(), null, 2));
    
    // Save and get ID
    const savedConfig = await config.save();
    console.log('Config saved with ID:', savedConfig._id);
    
    // Verify save worked
    const verifyConfig = await SiteConfig.findById(savedConfig._id);
    console.log('Verified saved config:', JSON.stringify(verifyConfig?.toObject(), null, 2));
    
    res.json({
      success: true,
      message: 'Test save completed successfully',
      saved: req.body,
      fullConfig: verifyConfig
    });
  } catch (error) {
    console.error('TEST ROUTE ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Get site configuration
router.get('/', async (req, res) => {
  try {
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching site config:', error);
    res.status(500).json({ error: 'Failed to fetch site configuration' });
  }
});

// Update site configuration (admin only)
router.put('/', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    // Log auth information for debugging
    console.log('Auth session claims:', req.auth?.sessionClaims);
    console.log('User role from metadata:', req.auth?.sessionClaims?.metadata?.role);
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to update site settings by user:', req.auth.userId);
      return res.status(403).json({ 
        error: 'Not authorized to update site settings',
        details: 'User is not an admin',
        userRole: req.auth.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    console.log('Admin user updating site settings:', req.auth.userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      console.log('No existing config found, creating new one');
      config = await SiteConfig.create({});
    } else {
      console.log('Found existing config with ID:', config._id);
    }
    
    // Prepare update data with proper handling of nested objects
    const updateData = { 
      ...req.body,
      updatedAt: new Date() 
    };
    
    // Ensure nested objects like metaTags and socialLinks are properly merged
    if (req.body.metaTags) {
      updateData.metaTags = {
        ...(config.metaTags || {}),
        ...req.body.metaTags
      };
    }
    
    if (req.body.socialLinks) {
      updateData.socialLinks = {
        ...(config.socialLinks || {}),
        ...req.body.socialLinks
      };
    }
    
    console.log('Using direct MongoDB updateOne with data:', JSON.stringify(updateData, null, 2));
    
    // Use updateOne with { upsert: true } to ensure it creates if doesn't exist
    const result = await mongoose.model('SiteConfig').updateOne(
      { _id: config._id }, 
      { $set: updateData },
      { upsert: true }
    );
    
    console.log('MongoDB update result:', result);
    
    // Get the updated document directly from the database
    const updatedConfig = await SiteConfig.findById(config._id);
    if (!updatedConfig) {
      throw new Error('Failed to retrieve updated configuration');
    }
    
    // Also add a fallback direct update for maximum reliability
    try {
      await SiteConfig.findByIdAndUpdate(
        config._id,
        { $set: updateData },
        { new: true, upsert: true }
      );
    } catch (updateError) {
      console.warn('Secondary update method failed:', updateError);
      // Continue anyway since we already tried the primary method
    }
    
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating site config:', error);
    res.status(500).json({ 
      error: 'Failed to update site configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload generic logo
router.post('/upload-logo', ClerkExpressRequireAuth(), uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    // Log authentication information for debugging
    console.log('Auth info for logo upload:', {
      userId: req.auth?.userId,
      userRole: req.auth?.sessionClaims?.metadata?.role,
      email: req.auth?.sessionClaims?.email
    });
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload logo by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload logo',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File upload successful, details:', {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      cloudinaryPath: req.file.path.includes('http') ? req.file.path : 'local file'
    });
    
    try {
      // Find the first config or create a default one
      let config = await SiteConfig.findOne();
      if (!config) {
        config = new SiteConfig({});
      }
      
      config.logo = req.file.path;
      config.updatedAt = new Date();
      
      const savedConfig = await config.save();
      console.log('Config updated with new logo:', savedConfig.logo);
      
      res.json({ 
        success: true, 
        logoUrl: config.logo,
        storage: req.file.path.includes('cloudinary') ? 'cloudinary' : 'local'
      });
    } catch (dbError) {
      console.error('Database error while saving logo URL:', dbError);
      res.status(500).json({ 
        error: 'Failed to save logo URL to database', 
        message: dbError.message
      });
    }
  } catch (error) {
    console.error('Error uploading logo to Cloudinary:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload logo',
      message: error.message,
      details: error.response?.data || error.code || 'Unknown error'
    });
  }
});

// Upload light mode logo
router.post('/upload-logo-light', ClerkExpressRequireAuth(), uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload light logo by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload logo',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    config.logoLight = req.file.path;
    config.updatedAt = new Date();
    
    await config.save();
    
    res.json({ 
      success: true, 
      logoUrl: config.logoLight 
    });
  } catch (error) {
    console.error('Error uploading light mode logo:', error);
    res.status(500).json({ error: 'Failed to upload light mode logo' });
  }
});

// Upload dark mode logo
router.post('/upload-logo-dark', ClerkExpressRequireAuth(), uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload dark logo by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload logo',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    config.logoDark = req.file.path;
    config.updatedAt = new Date();
    
    await config.save();
    
    res.json({ 
      success: true, 
      logoUrl: config.logoDark 
    });
  } catch (error) {
    console.error('Error uploading dark mode logo:', error);
    res.status(500).json({ error: 'Failed to upload dark mode logo' });
  }
});

// Upload favicon - use specific favicon upload middleware
router.post('/upload-favicon', ClerkExpressRequireAuth(), uploadFavicon.single('favicon'), validateImageType, async (req, res) => {
  try {
    // Log authentication information for debugging
    console.log('Auth info for favicon upload:', {
      userId: req.auth?.userId,
      userRole: req.auth?.sessionClaims?.metadata?.role,
      email: req.auth?.sessionClaims?.email
    });
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload favicon by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload favicon',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File upload successful, favicon details:', {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      cloudinaryPath: req.file.path.includes('http') ? req.file.path : 'local file'
    });
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    config.favicon = req.file.path;
    config.updatedAt = new Date();
    
    await config.save();
    
    res.json({ 
      success: true, 
      faviconUrl: config.favicon,
      storage: req.file.path.includes('cloudinary') ? 'cloudinary' : 'local'
    });
  } catch (error) {
    console.error('Error uploading favicon to Cloudinary:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload favicon',
      message: error.message,
      details: error.response?.data || error.code || 'Unknown error'
    });
  }
});

// Test endpoint for saving config without auth (for debugging only)
router.put('/test-save', async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Saving config without auth check');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      console.log('No existing config found, creating new one');
      config = await SiteConfig.create({});
    } else {
      console.log('Found existing config with ID:', config._id);
    }
    
    // Prepare update data
    const updateData = { 
      ...req.body,
      updatedAt: new Date() 
    };
    
    // Direct update using findByIdAndUpdate
    const updatedConfig = await SiteConfig.findByIdAndUpdate(
      config._id,
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    console.log('Updated config:', updatedConfig);
    
    res.json({
      success: true,
      message: 'Config updated successfully via test endpoint',
      config: updatedConfig
    });
  } catch (error) {
    console.error('TEST ENDPOINT Error:', error);
    res.status(500).json({ 
      error: 'Failed to update site configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Force refresh endpoint for clients to reload settings
router.get('/force-refresh', async (req, res) => {
  try {
    console.log('Force refresh requested for site config');
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      console.log('No existing config found, creating new one');
      config = await SiteConfig.create({});
    }
    
    // Update timestamp to invalidate cache
    config.updatedAt = new Date();
    await config.save();
    
    console.log('Config refreshed with new timestamp:', config.updatedAt);
    
    res.json({
      success: true,
      message: 'Cache invalidated, clients should reload settings',
      config: config,
      timestamp: config.updatedAt
    });
  } catch (error) {
    console.error('Error in force-refresh:', error);
    res.status(500).json({ 
      error: 'Failed to refresh configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload OG image
router.post('/upload-og-image', ClerkExpressRequireAuth(), uploadOgImage.single('ogImage'), validateImageType, async (req, res) => {
  try {
    // Log authentication information for debugging
    console.log('Auth info for cloud OG upload:', {
      userId: req.auth?.userId,
      userRole: req.auth?.sessionClaims?.metadata?.role,
      email: req.auth?.sessionClaims?.email
    });
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload OG image (cloud) by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload OG image',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File upload successful, OG image details:', {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      cloudinaryPath: req.file.path.includes('http') ? req.file.path : 'local file'
    });
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({
        metaTags: { ogImage: '' }
      });
    }
    
    // Initialize metaTags if it doesn't exist
    if (!config.metaTags) {
      config.metaTags = {};
    }
    
    // Set the ogImage path
    config.metaTags.ogImage = req.file.path;
    config.updatedAt = new Date();
    
    await config.save();
    
    res.json({ 
      success: true, 
      ogImageUrl: config.metaTags.ogImage,
      storage: req.file.path.includes('cloudinary') ? 'cloudinary' : 'local'
    });
  } catch (error) {
    console.error('Error uploading OG image to Cloudinary:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload OG image',
      message: error.message,
      details: error.response?.data || error.code || 'Unknown error'
    });
  }
});

// Add a new endpoint that uses local storage as a fallback
router.post('/upload-og-image-local', ClerkExpressRequireAuth(), uploadOgImage.single('ogImage'), validateImageType, async (req, res) => {
  try {
    // Log authentication information for debugging
    console.log('Auth info for local OG upload:', {
      userId: req.auth?.userId,
      userRole: req.auth?.sessionClaims?.metadata?.role,
      email: req.auth?.sessionClaims?.email
    });
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload OG image (local) by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload OG image',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({
        metaTags: { ogImage: '' }
      });
    }
    
    // Initialize metaTags if it doesn't exist
    if (!config.metaTags) {
      config.metaTags = {};
    }
    
    // Get the file path - if it's an absolute path, extract the filename
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    // Construct the URL directly to ensure correct path formatting
    const publicUrl = `${baseUrl}/uploads/og-images/${filename}`;

    console.log('OG image upload details:', {
      originalPath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename,
      publicUrl,
      fileExists: fs.existsSync(req.file.path)
    });
    
    // Set the ogImage path
    config.metaTags.ogImage = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('OG image uploaded locally:', {
      originalPath: req.file.path,
      filename,
      publicUrl
    });
    
    res.json({ 
      success: true, 
      ogImageUrl: config.metaTags.ogImage,
      storage: 'local'
    });
  } catch (error) {
    console.error('Error uploading OG image locally:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload OG image locally',
      message: error.message,
      details: error.response?.data || error.code || 'Unknown error'
    });
  }
});

// Add a development test endpoint with no auth
router.post('/test-upload-og-image', uploadOgImage.single('ogImage'), validateImageType, async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Uploading OG image without auth check');
    
    if (!req.file) {
      console.error('TEST ENDPOINT: No OG image file received in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Log file details to help with debugging
    console.log('TEST ENDPOINT: OG image upload details:', {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename || path.basename(req.file.path),
      cloudinaryPath: req.file.path.includes('cloudinary.com') ? 'cloudinary' : 'local'
    });
    
    // Determine storage type and get the URL for the file
    const storageType = req.file.path.includes('cloudinary.com') ? 'cloudinary' : 'local';
    let publicUrl = req.file.path;
    
    // If it's a local file, construct the URL
    if (storageType === 'local') {
      const filename = path.basename(req.file.path);
      const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
      publicUrl = `${baseUrl}/uploads/og-images/${filename}`;
    }
    
    console.log('TEST ENDPOINT: Public URL for uploaded OG image:', publicUrl);
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({
        metaTags: { ogImage: '' }
      });
    }
    
    // Initialize metaTags if it doesn't exist
    if (!config.metaTags) {
      config.metaTags = {};
    }
    
    // Set the ogImage path
    config.metaTags.ogImage = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('TEST ENDPOINT: OG image uploaded successfully:', {
      originalPath: req.file.path,
      publicUrl,
      storageType,
      fileExists: fs.existsSync(req.file.path)
    });
    
    res.json({ 
      success: true, 
      ogImageUrl: config.metaTags.ogImage,
      storage: storageType,
      note: 'This is a test endpoint with no auth - do not use in production'
    });
  } catch (error) {
    console.error('TEST ENDPOINT: Error uploading OG image:', error);
    console.error('TEST ENDPOINT: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload OG image in test endpoint',
      message: error.message,
      stack: error.stack
    });
  }
});

// Upload generic logo with local fallback
router.post('/upload-logo-local', ClerkExpressRequireAuth(), uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    // Log authentication information for debugging
    console.log('Auth info for local logo upload:', {
      userId: req.auth?.userId,
      userRole: req.auth?.sessionClaims?.metadata?.role,
      email: req.auth?.sessionClaims?.email
    });
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload logo locally by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload logo',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Get the file path - if it's an absolute path, extract the filename
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    // Construct the URL directly to ensure correct path formatting
    const publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    
    console.log('File upload details:', {
      originalPath: req.file.path,
      filename,
      publicUrl,
      fileExists: fs.existsSync(req.file.path)
    });
    
    config.logo = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('Logo uploaded locally:', {
      originalPath: req.file.path,
      filename,
      publicUrl
    });
    
    res.json({ 
      success: true, 
      logoUrl: config.logo,
      storage: 'local'
    });
  } catch (error) {
    console.error('Error uploading logo locally:', error);
    res.status(500).json({ 
      error: 'Failed to upload logo locally',
      message: error.message 
    });
  }
});

// Upload light mode logo with local fallback
router.post('/upload-logo-light-local', ClerkExpressRequireAuth(), uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload light logo locally by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload logo',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Get the file path - if it's an absolute path, extract the filename
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    // Construct the URL directly to ensure correct path formatting
    const publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    
    console.log('File upload details:', {
      originalPath: req.file.path,
      filename,
      publicUrl,
      fileExists: fs.existsSync(req.file.path)
    });
    
    config.logoLight = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('Light mode logo uploaded locally:', {
      originalPath: req.file.path,
      filename,
      publicUrl
    });
    
    res.json({ 
      success: true, 
      logoUrl: config.logoLight,
      storage: 'local'
    });
  } catch (error) {
    console.error('Error uploading light mode logo locally:', error);
    res.status(500).json({ 
      error: 'Failed to upload light mode logo locally',
      message: error.message 
    });
  }
});

// Upload dark mode logo with local fallback
router.post('/upload-logo-dark-local', ClerkExpressRequireAuth(), uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload dark logo locally by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload logo',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Get the file path - if it's an absolute path, extract the filename
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    // Construct the URL directly to ensure correct path formatting
    const publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    
    console.log('File upload details:', {
      originalPath: req.file.path,
      filename,
      publicUrl,
      fileExists: fs.existsSync(req.file.path)
    });
    
    config.logoDark = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('Dark mode logo uploaded locally:', {
      originalPath: req.file.path,
      filename,
      publicUrl
    });
    
    res.json({ 
      success: true, 
      logoUrl: config.logoDark,
      storage: 'local'
    });
  } catch (error) {
    console.error('Error uploading dark mode logo locally:', error);
    res.status(500).json({ 
      error: 'Failed to upload dark mode logo locally',
      message: error.message 
    });
  }
});

// Add a development test endpoint with no auth for logo upload
router.post('/test-upload-logo', uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Uploading logo without auth check');
    
    if (!req.file) {
      console.error('TEST ENDPOINT: No file received in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Log file details to help with debugging
    console.log('TEST ENDPOINT: File upload details:', {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename || path.basename(req.file.path),
      cloudinaryPath: req.file.path.includes('cloudinary.com') ? 'cloudinary' : 'local'
    });
    
    // Determine storage type
    const storageType = req.file.path.includes('cloudinary.com') ? 'cloudinary' : 'local';
    
    // Get the URL for the file
    let publicUrl = req.file.path;
    
    // If it's a local file, construct the URL
    if (storageType === 'local') {
      const filename = path.basename(req.file.path);
      const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
      publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    }
    
    console.log('TEST ENDPOINT: Public URL for uploaded file:', publicUrl);
    
    try {
      // Find the first config or create a default one
      let config = await SiteConfig.findOne();
      console.log('Current config found:', config ? 'YES' : 'NO');
      
      if (!config) {
        console.log('No config found, creating new one');
        config = new SiteConfig({});
      }
      
      // Update the logo URL
      config.logo = publicUrl;
      config.updatedAt = new Date();
      
      console.log('About to save config:', {
        logo: config.logo,
        updatedAt: config.updatedAt,
        id: config._id
      });
      
      // Save with more error handling
      const savedConfig = await config.save();
      console.log('Config saved successfully with ID:', savedConfig._id);
      
      console.log('TEST ENDPOINT: Logo uploaded successfully:', {
        originalPath: req.file.path,
        publicUrl,
        storageType,
        configId: savedConfig._id
      });
      
      return res.json({ 
        success: true, 
        logoUrl: config.logo,
        storage: storageType,
        configId: savedConfig._id.toString(),
        note: 'This is a test endpoint with no auth - do not use in production'
      });
    } catch (dbError) {
      console.error('TEST ENDPOINT: Database error saving config:', dbError);
      return res.status(500).json({ 
        error: 'Failed to save logo to database',
        message: dbError.message,
        stack: dbError.stack
      });
    }
  } catch (error) {
    console.error('TEST ENDPOINT: Error uploading logo:', error);
    res.status(500).json({ 
      error: 'Failed to upload logo in test endpoint',
      message: error.message,
      stack: error.stack
    });
  }
});

// Test endpoints for light and dark mode logos
router.post('/test-upload-logo-light', uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Uploading light mode logo without auth check');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    const publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    config.logoLight = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    res.json({ 
      success: true, 
      logoUrl: config.logoLight,
      storage: 'local',
      note: 'Test endpoint - no auth required'
    });
  } catch (error) {
    console.error('TEST ENDPOINT: Error uploading light logo:', error);
    res.status(500).json({ 
      error: 'Failed to upload light mode logo in test endpoint',
      message: error.message
    });
  }
});

router.post('/test-upload-logo-dark', uploadLogo.single('logo'), validateImageType, async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Uploading dark mode logo without auth check');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    const publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    config.logoDark = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    res.json({ 
      success: true, 
      logoUrl: config.logoDark,
      storage: 'local',
      note: 'Test endpoint - no auth required'
    });
  } catch (error) {
    console.error('TEST ENDPOINT: Error uploading dark logo:', error);
    res.status(500).json({ 
      error: 'Failed to upload dark mode logo in test endpoint',
      message: error.message
    });
  }
});

// Add a specific endpoint for updating the logo display setting - add this near the other config endpoints
router.put('/logo-display', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    console.log('Updating logo display setting:', req.body);
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to update logo display setting by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to update logo display setting',
        details: 'User is not an admin'
      });
    }
    
    if (typeof req.body.showSiteNameWithLogo !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'showSiteNameWithLogo must be a boolean value'
      });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Update the setting and save
    config.showSiteNameWithLogo = req.body.showSiteNameWithLogo;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('Logo display setting updated:', config.showSiteNameWithLogo);
    
    // Return the updated config
    res.json({ 
      success: true, 
      message: 'Logo display setting updated successfully',
      showSiteNameWithLogo: config.showSiteNameWithLogo 
    });
  } catch (error) {
    console.error('Error updating logo display setting:', error);
    res.status(500).json({ 
      error: 'Failed to update logo display setting',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint for updating logo display setting without auth - for development use only
router.put('/test-logo-display', async (req, res) => {
  try {
    console.log('Using test endpoint to update logo display setting:', req.body);
    
    if (typeof req.body.showSiteNameWithLogo !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'showSiteNameWithLogo must be a boolean value'
      });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Update the setting and save
    config.showSiteNameWithLogo = req.body.showSiteNameWithLogo;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('Logo display setting updated via test endpoint:', config.showSiteNameWithLogo);
    
    // Return the updated config
    res.json({ 
      success: true, 
      message: 'Logo display setting updated successfully via test endpoint',
      showSiteNameWithLogo: config.showSiteNameWithLogo 
    });
  } catch (error) {
    console.error('Error updating logo display setting via test endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to update logo display setting',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload favicon with local storage fallback
router.post('/upload-favicon-local', ClerkExpressRequireAuth(), uploadFavicon.single('favicon'), validateImageType, async (req, res) => {
  try {
    // Log authentication information for debugging
    console.log('Auth info for local favicon upload:', {
      userId: req.auth?.userId,
      userRole: req.auth?.sessionClaims?.metadata?.role,
      email: req.auth?.sessionClaims?.email
    });
    
    // Check if user is admin - allow both direct role check and email domain check
    const isAdmin = req.auth?.sessionClaims?.metadata?.role === 'admin';
    const userEmail = req.auth?.sessionClaims?.email || '';
    const isAdminDomain = userEmail.endsWith('@webbuddy.agency');
    
    if (!isAdmin && !isAdminDomain) {
      console.warn('Unauthorized attempt to upload favicon locally by user:', req.auth?.userId);
      return res.status(403).json({ 
        error: 'Not authorized to upload favicon',
        details: 'User is not an admin',
        userRole: req.auth?.sessionClaims?.metadata?.role || 'none',
        email: userEmail
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Get the file path - if it's an absolute path, extract the filename
    const filename = path.basename(req.file.path);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    // Construct the URL directly to ensure correct path formatting
    const publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    
    console.log('Favicon upload details:', {
      originalPath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename,
      publicUrl,
      fileExists: fs.existsSync(req.file.path)
    });
    
    config.favicon = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('Favicon uploaded locally:', {
      originalPath: req.file.path,
      filename,
      publicUrl
    });
    
    res.json({ 
      success: true, 
      faviconUrl: config.favicon,
      storage: 'local'
    });
  } catch (error) {
    console.error('Error uploading favicon locally:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload favicon locally',
      message: error.message,
      details: error.response?.data || error.code || 'Unknown error'
    });
  }
});

// Add a development test endpoint with no auth for favicon upload
router.post('/test-upload-favicon', uploadFavicon.single('favicon'), validateImageType, async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Uploading favicon without auth check');
    
    if (!req.file) {
      console.error('TEST ENDPOINT: No favicon file received in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Log file details to help with debugging
    console.log('TEST ENDPOINT: Favicon upload details:', {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename || path.basename(req.file.path),
      cloudinaryPath: req.file.path.includes('cloudinary.com') ? 'cloudinary' : 'local'
    });
    
    // Determine storage type and get the URL for the file
    const storageType = req.file.path.includes('cloudinary.com') ? 'cloudinary' : 'local';
    let publicUrl = req.file.path;
    
    // If it's a local file, construct the URL
    if (storageType === 'local') {
      const filename = path.basename(req.file.path);
      const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
      publicUrl = `${baseUrl}/uploads/logos/${filename}`;
    }
    
    console.log('TEST ENDPOINT: Public URL for uploaded favicon:', publicUrl);
    
    // Find the first config or create a default one
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    
    // Set the favicon URL
    config.favicon = publicUrl;
    config.updatedAt = new Date();
    
    await config.save();
    
    console.log('TEST ENDPOINT: Favicon uploaded successfully:', {
      originalPath: req.file.path,
      publicUrl,
      storageType,
      fileExists: fs.existsSync(req.file.path)
    });
    
    res.json({ 
      success: true, 
      faviconUrl: config.favicon,
      storage: storageType,
      note: 'This is a test endpoint with no auth - do not use in production'
    });
  } catch (error) {
    console.error('TEST ENDPOINT: Error uploading favicon:', error);
    console.error('TEST ENDPOINT: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to upload favicon in test endpoint',
      message: error.message,
      stack: error.stack
    });
  }
});

export default router;
 