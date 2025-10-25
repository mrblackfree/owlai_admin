import 'dotenv/config';
import { connectDB } from '../db/connection.js';
import { Tool } from '../db/models/Tool.js';
import mongoose from 'mongoose';

// Define the mock data type
interface MockProduct {
  name: string;
  description: string;
  websiteUrl: string;
  category: string;
  tags: string[];
  pricing: {
    type: 'free' | 'freemium' | 'paid' | 'enterprise';
    startingPrice?: number;
  };
  features: string[];
  logo?: string;
}

// Mock data
const MOCK_PRODUCTS: MockProduct[] = [
  {
    name: "Example AI Tool",
    description: "An example AI tool for testing",
    websiteUrl: "https://example.com",
    category: "Development",
    tags: ["AI", "Testing"],
    pricing: {
      type: "free"
    },
    features: ["Feature 1", "Feature 2"]
  }
];

// Helper function to normalize pricing type
function normalizePricingType(type: string): 'free' | 'freemium' | 'paid' | 'enterprise' {
  const normalized = type.toLowerCase();
  switch (normalized) {
    case 'free': return 'free';
    case 'freemium': return 'freemium';
    case 'premium':
    case 'paid': return 'paid';
    default: return 'enterprise';
  }
}

// Helper function to generate unique slug
function generateUniqueSlug(name: string, existingSlugs: Set<string>): string {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/--+/g, '-'); // Replace multiple hyphens with single hyphen

  let slug = baseSlug;
  let counter = 1;

  // Keep incrementing counter until we find a unique slug
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

// Helper function to get logo URL
async function getLogoUrl(website: string, name: string): Promise<string> {
  if (!website) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&format=svg`;
  }

  try {
    // Try Clearbit first
    const domain = website.replace(/^https?:\/\//, '').split('/')[0];
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;

    // Test if Clearbit has the logo
    const response = await fetch(clearbitUrl);
    if (response.ok) {
      return clearbitUrl;
    }

    // If Clearbit fails, fallback to UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&format=svg`;
  } catch (error) {
    // If anything fails, use UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&format=svg`;
  }
}

async function migrateTools() {
  try {
    console.log('Starting tools migration...');
    await connectDB();

    // Clear existing tools
    await Tool.deleteMany({});
    console.log('Cleared existing tools');

    // Format and insert tools
    const formattedTools = await Promise.all(MOCK_PRODUCTS.map(async (tool: MockProduct) => ({
      name: tool.name,
      description: tool.description,
      websiteUrl: tool.websiteUrl,
      category: tool.category,
      tags: tool.tags,
      pricing: tool.pricing,
      features: tool.features,
      logo: tool.logo,
      status: 'published',
      slug: tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isTrending: false,
      isNew: true,
      views: 0,
      votes: 0,
      rating: 0,
      reviews: 0
    })));

    // Insert tools
    await Tool.insertMany(formattedTools);
    console.log(`Successfully migrated ${formattedTools.length} tools`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('An unknown error occurred:', error);
    }
    process.exit(1);
  }
}

// Run migration
migrateTools(); 