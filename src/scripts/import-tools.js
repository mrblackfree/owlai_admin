import 'dotenv/config';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your models (adjust paths as needed)
import { Tool } from '../db/models/Tool.ts';
import { connectDB } from '../db/connection.ts';

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, '../../../Ai-Tool-Finder-Frontend/Ai_Tools_Data-Aitoolfinder.xlsx');
const BATCH_SIZE = 50; // Process tools in batches to avoid memory issues
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set DRY_RUN=true to preview without importing

// Helper function to generate slug
const generateSlug = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
};

// Helper function to clean and parse URLs
const cleanUrl = (url) => {
    if (!url) return '';
    const urlStr = String(url).trim();
    if (!urlStr) return '';
    
    // Add https:// if no protocol is specified
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        return `https://${urlStr}`;
    }
    
    return urlStr;
};

// Helper function to extract domain from URL
const extractDomain = (url) => {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
};

// Helper function to parse pricing info
const parsePricing = (pricingText, startingPriceText) => {
    const pricing = {
        type: 'free',
        startingPrice: undefined
    };
    
    if (pricingText) {
        const text = String(pricingText).toLowerCase();
        if (text.includes('free') && text.includes('paid')) {
            pricing.type = 'freemium';
        } else if (text.includes('paid') || text.includes('subscription') || text.includes('premium')) {
            pricing.type = 'paid';
        } else if (text.includes('enterprise')) {
            pricing.type = 'enterprise';
        } else if (text.includes('free')) {
            pricing.type = 'free';
        }
    }
    
    // Parse starting price
    if (startingPriceText) {
        const priceStr = String(startingPriceText).replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
            pricing.startingPrice = price;
        }
    }
    
    return pricing;
};

// Helper function to parse tags/categories
const parseTags = (tagsText) => {
    if (!tagsText) return [];
    
    const text = String(tagsText);
    // Split by common delimiters and clean up
    return text
        .split(/[,;|/\n\r]+/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length < 50) // Reasonable tag length
        .slice(0, 10); // Limit to 10 tags
};

// Helper function to parse features
const parseFeatures = (featuresText) => {
    if (!featuresText) return ['AI-powered functionality']; // Default feature
    
    const text = String(featuresText);
    const features = text
        .split(/[,;\n\r]+|(?:\d+\.|[•\-*])\s*/) // Split by delimiters and list markers
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0 && feature.length < 200) // Reasonable feature length
        .slice(0, 15); // Limit to 15 features
    
    return features.length > 0 ? features : ['AI-powered functionality'];
};

// Helper function to determine tool category
const categorizeByContent = (name, description, tags) => {
    const content = `${name} ${description} ${tags.join(' ')}`.toLowerCase();
    
    // Category mapping based on keywords
    const categoryMap = {
        'writing': ['writing', 'content', 'copywriting', 'blog', 'article', 'text generation', 'grammar'],
        'design': ['design', 'graphic', 'logo', 'ui', 'ux', 'visual', 'creative', 'art', 'image generation'],
        'productivity': ['productivity', 'task', 'management', 'organization', 'workflow', 'automation', 'planning'],
        'marketing': ['marketing', 'social media', 'seo', 'advertising', 'campaign', 'analytics', 'email marketing'],
        'development': ['code', 'development', 'programming', 'api', 'developer', 'coding', 'software'],
        'business': ['business', 'finance', 'sales', 'crm', 'analytics', 'insights', 'reporting'],
        'education': ['education', 'learning', 'teaching', 'course', 'training', 'academic'],
        'communication': ['chat', 'communication', 'meeting', 'video', 'collaboration', 'messaging'],
        'research': ['research', 'data', 'analysis', 'insight', 'investigation', 'discovery'],
        'customer-service': ['customer', 'support', 'service', 'help', 'assistant', 'chatbot'],
        'healthcare': ['health', 'medical', 'wellness', 'fitness', 'mental health', 'therapy'],
        'finance': ['finance', 'money', 'investment', 'trading', 'banking', 'fintech'],
        'hr': ['hr', 'human resources', 'recruitment', 'hiring', 'talent', 'employee'],
        'sales': ['sales', 'lead', 'conversion', 'prospect', 'revenue', 'selling'],
        'video': ['video', 'editing', 'production', 'youtube', 'streaming', 'multimedia'],
        'audio': ['audio', 'music', 'sound', 'voice', 'podcast', 'speech'],
        'translation': ['translation', 'language', 'translate', 'multilingual', 'localization'],
        'gaming': ['gaming', 'game', 'entertainment', 'fun', 'interactive'],
        'real-estate': ['real estate', 'property', 'housing', 'rental', 'mortgage'],
        'legal': ['legal', 'law', 'compliance', 'contract', 'attorney'],
        'travel': ['travel', 'trip', 'vacation', 'hotel', 'booking', 'tourism'],
        'e-commerce': ['ecommerce', 'shopping', 'retail', 'store', 'marketplace', 'selling'],
        'social-media': ['social', 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
        'other': [] // Default fallback
    };
    
    // Find the best matching category
    for (const [category, keywords] of Object.entries(categoryMap)) {
        if (category === 'other') continue;
        
        for (const keyword of keywords) {
            if (content.includes(keyword)) {
                return category;
            }
        }
    }
    
    return 'other'; // Default category
};

// Function to analyze Excel structure
const analyzeExcelStructure = (filePath) => {
    console.log('📊 Analyzing Excel file structure...');
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found at: ${filePath}`);
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`📋 Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);
    
    // Analyze each sheet
    const analysis = {};
    
    for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);
            
            analysis[sheetName] = {
                headers,
                rowCount: dataRows.length,
                sampleData: dataRows.slice(0, 3) // First 3 rows of data
            };
            
            console.log(`\n📄 Sheet: ${sheetName}`);
            console.log(`   Headers: ${headers.join(', ')}`);
            console.log(`   Data rows: ${dataRows.length}`);
        }
    }
    
    return { workbook, analysis };
};

// Function to map Excel columns to our tool schema
const mapExcelToToolSchema = (row, headers) => {
    const tool = {};
    
    // Create a mapping object for easier access
    const data = {};
    headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
            data[header.toLowerCase().trim()] = row[index];
        }
    });
    
    // Map common field variations to our schema
    const fieldMappings = {
        name: ['tools name', 'name', 'tool name', 'title', 'tool_name', 'toolname', 'product name'],
        description: ['full_description', 'short_description', 'description', 'desc', 'overview', 'summary', 'about', 'details'],
        websiteUrl: ['visit_website_url', 'website', 'url', 'website url', 'link', 'website_url', 'site', 'homepage'],
        category: ['primary_task', 'category', 'type', 'classification', 'section', 'group'],
        tags: ['applicable_tasks', 'tags', 'keywords', 'labels', 'categories', 'topics'],
        pricing: ['pricing', 'price', 'cost', 'pricing model', 'pricing_type'],
        startingPrice: ['starting price', 'price', 'cost', 'min price', 'base price'],
        features: ['pros', 'features', 'capabilities', 'functionality', 'what it does', 'key features'],
        logo: ['logo', 'image', 'icon', 'logo url', 'image url']
    };
    
    // Extract data using field mappings
    for (const [schemaField, possibleHeaders] of Object.entries(fieldMappings)) {
        for (const header of possibleHeaders) {
            if (data[header]) {
                tool[schemaField] = data[header];
                break;
            }
        }
    }
    
    // Clean and validate the mapped data
    if (!tool.name) {
        return null; // Skip if no name
    }
    
    tool.name = String(tool.name).trim();
    if (tool.name.length < 2) {
        return null; // Skip if name too short
    }
    
    // Clean description
    tool.description = tool.description ? String(tool.description).trim() : `${tool.name} - AI-powered tool`;
    if (tool.description.length < 10) {
        tool.description = `${tool.name} - AI-powered tool that enhances productivity and efficiency.`;
    }
    
    // Clean and validate URL
    tool.websiteUrl = cleanUrl(tool.websiteUrl);
    if (!tool.websiteUrl) {
        return null; // Skip if no valid URL
    }
    
    // Parse tags
    const tags = parseTags(tool.tags);
    tool.tags = tags.length > 0 ? tags : ['AI', 'productivity'];
    
    // Determine category
    tool.category = tool.category ? String(tool.category).toLowerCase().trim() : 
                   categorizeByContent(tool.name, tool.description, tool.tags);
    
    // Parse pricing
    const pricing = parsePricing(tool.pricing, tool.startingPrice);
    tool.pricing = pricing;
    
    // Parse features
    let featuresText = tool.features;
    
    // If we have separate pros and cons, combine them
    const prosText = data['pros'];
    const consText = data['cons'];
    
    if (prosText || consText) {
        const combinedFeatures = [];
        if (prosText) {
            const prosFeatures = parseFeatures(prosText);
            combinedFeatures.push(...prosFeatures.map(f => `✅ ${f}`));
        }
        if (consText) {
            const consFeatures = parseFeatures(consText);
            combinedFeatures.push(...consFeatures.map(f => `⚠️ ${f}`));
        }
        if (combinedFeatures.length > 0) {
            tool.features = combinedFeatures.slice(0, 15); // Limit to 15 features
        } else {
            tool.features = parseFeatures(featuresText);
        }
    } else {
        tool.features = parseFeatures(featuresText);
    }
    
    // Generate slug
    tool.slug = generateSlug(tool.name);
    
    // Set default values
    tool.status = 'published'; // You can change this to 'pending' if you want to review first
    tool.views = Math.floor(Math.random() * 100) + 10; // Random initial views
    tool.votes = Math.floor(Math.random() * 50); // Random initial votes
    tool.rating = 0;
    tool.reviews = 0;
    tool.isTrending = Math.random() < 0.1; // 10% chance of being trending
    tool.isNewTool = Math.random() < 0.2; // 20% chance of being new
    tool.isUpcoming = false;
    tool.isTopRated = Math.random() < 0.05; // 5% chance of being top rated
    
    // Clean logo URL if provided
    if (tool.logo) {
        tool.logo = cleanUrl(tool.logo);
    }
    
    return tool;
};

// Function to import tools in batches
const importToolsInBatches = async (tools) => {
    console.log(`\n📦 Importing ${tools.length} tools in batches of ${BATCH_SIZE}...`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < tools.length; i += BATCH_SIZE) {
        const batch = tools.slice(i, i + BATCH_SIZE);
        console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tools.length / BATCH_SIZE)} (${batch.length} tools)`);
        
        for (const toolData of batch) {
            try {
                if (DRY_RUN) {
                    console.log(`[DRY RUN] Would import: ${toolData.name}`);
                    imported++;
                    continue;
                }
                
                // Check if tool already exists
                const existingTool = await Tool.findOne({ 
                    $or: [
                        { slug: toolData.slug },
                        { name: toolData.name },
                        { websiteUrl: toolData.websiteUrl }
                    ]
                });
                
                if (existingTool) {
                    console.log(`⏭️  Skipping existing tool: ${toolData.name}`);
                    skipped++;
                    continue;
                }
                
                // Create new tool
                const newTool = new Tool(toolData);
                await newTool.save();
                
                console.log(`✅ Imported: ${toolData.name} (${toolData.category})`);
                imported++;
                
                // Small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Error importing ${toolData.name}:`, error.message);
                errors++;
            }
        }
        
        // Progress update
        console.log(`📊 Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    }
    
    return { imported, skipped, errors };
};

// Main import function
const importTools = async () => {
    try {
        console.log('🚀 Starting tool import process...');
        console.log(`📁 Excel file: ${EXCEL_FILE_PATH}`);
        console.log(`🔍 Dry run: ${DRY_RUN ? 'YES' : 'NO'}`);
        
        // Analyze Excel structure
        const { workbook, analysis } = analyzeExcelStructure(EXCEL_FILE_PATH);
        
        // Let user choose the sheet to import from
        const sheetNames = Object.keys(analysis);
        if (sheetNames.length === 0) {
            throw new Error('No sheets found in Excel file');
        }
        
        console.log('\n📋 Available sheets:');
        sheetNames.forEach((name, index) => {
            const sheet = analysis[name];
            console.log(`${index + 1}. ${name} (${sheet.rowCount} rows)`);
            console.log(`   Headers: ${sheet.headers.slice(0, 5).join(', ')}${sheet.headers.length > 5 ? '...' : ''}`);
        });
        
        // For automation, use the first sheet or the largest one
        const targetSheet = sheetNames.reduce((largest, current) => 
            analysis[current].rowCount > analysis[largest].rowCount ? current : largest
        );
        
        console.log(`\n🎯 Using sheet: ${targetSheet} (${analysis[targetSheet].rowCount} rows)`);
        
        // Connect to database
        if (!DRY_RUN) {
            console.log('\n🔌 Connecting to database...');
            await connectDB();
            console.log('✅ Database connected');
        }
        
        // Parse the selected sheet
        const worksheet = workbook.Sheets[targetSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);
        
        console.log(`\n📝 Processing ${dataRows.length} rows...`);
        
        // Map Excel data to tool schema
        const tools = [];
        let processed = 0;
        
        for (const row of dataRows) {
            processed++;
            
            if (processed % 1000 === 0) {
                console.log(`📊 Processed ${processed}/${dataRows.length} rows...`);
            }
            
            const tool = mapExcelToToolSchema(row, headers);
            if (tool) {
                tools.push(tool);
            }
        }
        
        console.log(`\n✅ Successfully mapped ${tools.length} tools from ${dataRows.length} rows`);
        
        if (tools.length === 0) {
            console.log('❌ No valid tools found to import');
            return;
        }
        
        // Show sample of mapped tools
        console.log('\n🔍 Sample mapped tools:');
        tools.slice(0, 3).forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            console.log(`   Category: ${tool.category}`);
            console.log(`   Pricing: ${tool.pricing.type}${tool.pricing.startingPrice ? ` ($${tool.pricing.startingPrice})` : ''}`);
            console.log(`   Tags: ${tool.tags.slice(0, 3).join(', ')}${tool.tags.length > 3 ? '...' : ''}`);
            console.log(`   URL: ${tool.websiteUrl}`);
        });
        
        // Import tools
        const results = await importToolsInBatches(tools);
        
        // Final summary
        console.log('\n🎉 Import completed!');
        console.log(`📊 Final Results:`);
        console.log(`   ✅ Imported: ${results.imported}`);
        console.log(`   ⏭️  Skipped: ${results.skipped}`);
        console.log(`   ❌ Errors: ${results.errors}`);
        console.log(`   📈 Success rate: ${((results.imported / tools.length) * 100).toFixed(1)}%`);
        
        if (!DRY_RUN) {
            console.log('\n🔧 Post-import tasks:');
            console.log('1. Check your admin panel to review imported tools');
            console.log('2. Update any tool statuses if needed');
            console.log('3. Add custom logos for tools without images');
            console.log('4. Review and update categories as needed');
        }
        
    } catch (error) {
        console.error('💥 Import failed:', error);
        process.exit(1);
    } finally {
        if (!DRY_RUN) {
            mongoose.disconnect();
        }
    }
};

// Export for use as module
export {
    importTools,
    analyzeExcelStructure,
    mapExcelToToolSchema
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    importTools();
} 