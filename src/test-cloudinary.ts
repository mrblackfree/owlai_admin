import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test file path
const testFilePath = path.join(process.cwd(), 'public/uploads/logos/test-logo.svg');

// Create a test SVG file if it doesn't exist
if (!fs.existsSync(testFilePath)) {
  console.log('Creating test SVG file...');
  fs.writeFileSync(testFilePath, '<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>');
  console.log('Test file created at:', testFilePath);
} else {
  console.log('Test file already exists at:', testFilePath);
}

// Function to test Cloudinary upload
async function testCloudinaryUpload() {
  console.log('Cloudinary configuration:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'Present (length: ' + process.env.CLOUDINARY_API_KEY.length + ')' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'Missing'
  });

  try {
    // First, test the connection
    console.log('Testing Cloudinary connection...');
    const pingResult = await cloudinary.api.ping();
    console.log('Cloudinary ping successful:', pingResult);
    
    // Now try uploading a file
    console.log('Attempting to upload test file:', testFilePath);
    const uploadResult = await cloudinary.uploader.upload(testFilePath, {
      folder: 'ai-tool-finder/test',
      resource_type: 'auto'
    });
    
    console.log('Upload successful!');
    console.log('Uploaded file:', uploadResult.secure_url);
    console.log('Upload details:', {
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      bytes: uploadResult.bytes
    });
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code || 'N/A',
      http_code: error.http_code || 'N/A',
      stack: error.stack
    });
    
    throw error;
  }
}

// Run the test
testCloudinaryUpload()
  .then(result => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
  }); 