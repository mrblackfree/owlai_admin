/**
 * This script creates a test admin user directly in the database
 * Run with: node src/createTestAdmin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hunt';
    console.log('MongoDB: Connecting to', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB: Connected successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
};

// Define SiteConfig schema
const siteConfigSchema = new mongoose.Schema({
  siteName: { 
    type: String, 
    required: true, 
    default: 'AI Tool Finder' 
  },
  siteDescription: { 
    type: String,
    default: 'Discover the best AI tools for your needs'
  },
  logo: { 
    type: String,
    default: '/logo.svg'
  },
  logoDark: {
    type: String,
    default: ''
  },
  logoLight: {
    type: String,
    default: ''
  },
  favicon: { 
    type: String,
    default: '/favicon.ico'
  },
  primaryColor: { 
    type: String,
    default: '#10b981' // Default green color
  },
  secondaryColor: { 
    type: String,
    default: '#3b82f6' // Default blue color
  },
  allowUserRegistration: { 
    type: Boolean,
    default: true
  },
  allowUserSubmissions: { 
    type: Boolean,
    default: true
  },
  requireApprovalForSubmissions: { 
    type: Boolean,
    default: true
  },
  requireApprovalForReviews: { 
    type: Boolean,
    default: true
  },
  footerText: { 
    type: String,
    default: '© 2024 AI Tool Finder. All rights reserved.'
  },
  contactEmail: { 
    type: String,
    default: 'contact@example.com'
  },
  socialLinks: {
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' }
  },
  analyticsId: { 
    type: String,
    default: ''
  },
  customCss: {
    type: String,
    default: ''
  },
  customJs: {
    type: String,
    default: ''
  },
  metaTags: {
    title: { type: String, default: 'AI Tool Finder - Discover the Best AI Tools' },
    description: { type: String, default: 'Find the best AI tools for your needs, from content creation to productivity and beyond.' },
    keywords: { type: String, default: 'AI tools, artificial intelligence, productivity tools, AI software' },
    ogImage: { type: String, default: '/og-image.jpg' }
  },
  defaultTheme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  allowThemeToggle: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

// Create or update site config
const createOrUpdateSiteConfig = async (data) => {
  try {
    console.log('Checking if site config exists...');
    const existingConfig = await SiteConfig.findOne();
    
    if (existingConfig) {
      console.log('Existing config found, updating it...');
      
      // Update existing config with provided data
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          existingConfig[key] = data[key];
        }
      });
      
      await existingConfig.save();
      console.log('Config updated successfully');
      return existingConfig;
    } else {
      console.log('No config found, creating new one...');
      const newConfig = new SiteConfig(data);
      await newConfig.save();
      console.log('New config created successfully');
      return newConfig;
    }
  } catch (err) {
    console.error('Error creating/updating site config:', err);
    throw err;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    // Create or update site config
    const siteConfig = await createOrUpdateSiteConfig({
      siteName: "AI Tool Finder",
      siteDescription: "The best place to discover AI tools",
      footerText: "© 2024 AI Tool Finder. All rights reserved.",
      contactEmail: "admin@example.com",
      metaTags: {
        title: "AI Tool Finder - Your AI Tool Directory",
        description: "Discover the best AI tools for your needs",
        keywords: "AI tools, artificial intelligence, tools directory",
        ogImage: "/og-image.jpg"
      }
    });
    
    console.log('Operation completed successfully');
    console.log('Site config:', siteConfig);
  } catch (err) {
    console.error('Error in main execution:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

main(); 