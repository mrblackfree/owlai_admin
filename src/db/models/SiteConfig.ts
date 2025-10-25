import mongoose from 'mongoose';

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
  showSiteNameWithLogo: {
    type: Boolean,
    default: true
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
    type: Object,
    default: {
      title: 'AI Tool Finder - Discover the Best AI Tools',
      description: 'Find the best AI tools for your needs, from content creation to productivity and beyond.',
      keywords: 'AI tools, artificial intelligence, productivity tools, AI software',
      ogImage: '/og-image.jpg'
    }
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

// Ensure there's only one site config document
siteConfigSchema.statics.getSiteConfig = async function() {
  const config = await this.findOne();
  if (config) {
    return config;
  }
  
  // If no config exists, create default one
  return await this.create({});
};

export const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema); 