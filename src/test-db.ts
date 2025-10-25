import mongoose from 'mongoose';
import { SiteConfig } from './db/models/SiteConfig.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-tool-finder';

async function testDatabaseConnection() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    
    console.log('MongoDB connected successfully');
    
    // Try to find existing config
    const existingConfig = await SiteConfig.findOne();
    console.log('Existing config found:', existingConfig ? 'YES' : 'NO');
    
    if (existingConfig) {
      console.log('Config ID:', existingConfig._id);
      console.log('Current logo URL:', existingConfig.logo);
      
      // Try updating the existing config
      existingConfig.logo = `/test-logo-${Date.now()}.svg`;
      existingConfig.updatedAt = new Date();
      
      try {
        const savedConfig = await existingConfig.save();
        console.log('Config updated successfully:', savedConfig.logo);
      } catch (saveError) {
        console.error('Error saving config:', saveError);
      }
    } else {
      // Create a new config
      try {
        const newConfig = new SiteConfig({
          logo: `/test-logo-${Date.now()}.svg`,
          updatedAt: new Date()
        });
        
        const savedConfig = await newConfig.save();
        console.log('New config created successfully:', savedConfig);
      } catch (createError) {
        console.error('Error creating config:', createError);
      }
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 