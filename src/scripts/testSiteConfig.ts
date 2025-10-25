/**
 * Test script for site configuration functionality
 * 
 * This script simulates various aspects of site configuration:
 * 1. Saving config to the database
 * 2. Retrieving config from the database
 * 3. Updating specific fields
 * 4. Testing nested objects
 * 
 * Run with: npx ts-node src/scripts/testSiteConfig.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SiteConfig } from '../db/models/SiteConfig.js';

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

// Test configuration operations
const testConfig = async () => {
  try {
    // First, find the current config
    console.log('\n1. Retrieving current config...');
    let config = await SiteConfig.findOne();
    
    if (!config) {
      console.log('No config found, creating a new one...');
      config = await SiteConfig.create({});
    }
    
    console.log('Current config:', config.toObject());
    
    // Update a simple field
    console.log('\n2. Updating site name...');
    config.siteName = 'AI Tool Finder - Updated';
    await config.save();
    
    // Verify the update
    const updatedConfig = await SiteConfig.findById(config._id);
    console.log('Updated site name:', updatedConfig?.siteName);
    
    // Update a nested object
    console.log('\n3. Updating meta tags...');
    if (!updatedConfig) throw new Error('Config not found');
    
    updatedConfig.metaTags = {
      ...updatedConfig.metaTags,
      title: 'AI Tool Finder - New Title',
      description: 'Updated description for testing'
    };
    
    await updatedConfig.save();
    
    // Verify nested object update
    const configWithMeta = await SiteConfig.findById(config._id);
    console.log('Updated meta tags:', configWithMeta?.metaTags);
    
    // Test updating with updateOne
    console.log('\n4. Testing updateOne method...');
    const updateResult = await SiteConfig.updateOne(
      { _id: config._id },
      { 
        $set: { 
          siteDescription: 'Updated via updateOne',
          'socialLinks.twitter': 'https://twitter.com/test'
        } 
      }
    );
    
    console.log('updateOne result:', updateResult);
    
    // Verify updateOne changes
    const finalConfig = await SiteConfig.findById(config._id);
    console.log('\n5. Final config state:');
    console.log('- Site name:', finalConfig?.siteName);
    console.log('- Site description:', finalConfig?.siteDescription);
    console.log('- Meta title:', finalConfig?.metaTags?.title);
    console.log('- Twitter link:', finalConfig?.socialLinks?.twitter);
    
    // Reset to original values for next test
    console.log('\n6. Resetting config to original values...');
    await SiteConfig.updateOne(
      { _id: config._id },
      { 
        $set: { 
          siteName: 'AI Tool Finder',
          siteDescription: 'Discover the best AI tools for your needs',
          'metaTags.title': 'AI Tool Finder - Discover the Best AI Tools',
          'metaTags.description': 'Find the best AI tools for your needs, from content creation to productivity and beyond.',
          'socialLinks.twitter': ''
        } 
      }
    );
    
    // Verify reset
    const resetConfig = await SiteConfig.findById(config._id);
    console.log('Reset config:', resetConfig?.toObject());
    
  } catch (error) {
    console.error('Error testing config:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the tests
(async () => {
  try {
    await connectDB();
    await testConfig();
  } catch (error) {
    console.error('Script failed:', error);
  }
})(); 