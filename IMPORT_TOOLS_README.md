# AI Tools Import Script

This script allows you to import your 13,000 AI tools from the Excel file into your website database while maintaining all existing functionality like upvotes, comments, admin management, and more.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd Ai-Tool-Finder-Backend
npm install
```

### 2. Set Up Environment Variables
Make sure your `.env` file has the database connection string:
```bash
DATABASE_URL=your_mongodb_connection_string
# or
MONGODB_URI=your_mongodb_connection_string
```

### 3. Preview Import (Dry Run)
Before importing, run a dry run to see what will be imported:
```bash
npm run import:tools:dry
```

### 4. Import Tools
When you're ready to import:
```bash
npm run import:tools
```

### 5. Analyze Excel Structure (Optional)
To see the structure of your Excel file:
```bash
npm run analyze:excel
```

## 📊 Features

### ✅ Maintains All Existing Functionality
- **Upvotes & Voting System**: Tools get random initial votes and are ready for user upvoting
- **Comments & Reviews**: Database schema supports reviews and comments
- **Admin Panel Management**: All imported tools appear in your admin dashboard
- **Tool Status Management**: Tools can be set to published, pending, draft, etc.
- **Categories & Tags**: Intelligent categorization based on content
- **Trending & Featured Tools**: Random assignment of trending/featured flags
- **View Tracking**: Tools get initial view counts and support view tracking
- **Search & Filtering**: All tools are searchable and filterable

### 🔧 Smart Data Processing
- **Intelligent Field Mapping**: Automatically maps Excel columns to your database schema
- **URL Cleaning**: Validates and cleans website URLs
- **Category Detection**: Uses AI-powered categorization based on tool descriptions
- **Pricing Parsing**: Extracts pricing information (free, freemium, paid, enterprise)
- **Feature Extraction**: Parses and formats tool features
- **Slug Generation**: Creates SEO-friendly URLs for each tool
- **Duplicate Prevention**: Skips tools that already exist in your database

### 📈 Batch Processing
- **Memory Efficient**: Processes tools in batches to handle large datasets
- **Progress Tracking**: Shows real-time import progress
- **Error Handling**: Continues processing even if some tools fail
- **Detailed Reporting**: Comprehensive import summary with success rates

## 📋 Excel File Requirements

The script can handle various Excel column names. It automatically maps common variations:

### Required Columns (at least one variation needed):
- **Name**: `name`, `tool name`, `title`, `tool_name`, `toolname`, `product name`
- **Website**: `website`, `url`, `website url`, `link`, `website_url`, `site`, `homepage`

### Optional Columns (automatically detected):
- **Description**: `description`, `desc`, `overview`, `summary`, `about`, `details`
- **Category**: `category`, `type`, `classification`, `section`, `group`
- **Tags**: `tags`, `keywords`, `labels`, `categories`, `topics`
- **Pricing**: `pricing`, `price`, `cost`, `pricing model`, `pricing_type`
- **Features**: `features`, `capabilities`, `functionality`, `what it does`
- **Logo**: `logo`, `image`, `icon`, `logo url`, `image url`

## 🎯 Category Mapping

The script intelligently categorizes tools based on their content:

- **Writing**: Content creation, copywriting, blogging
- **Design**: Graphic design, UI/UX, image generation
- **Productivity**: Task management, workflow automation
- **Marketing**: Social media, SEO, advertising
- **Development**: Programming, coding, APIs
- **Business**: Analytics, CRM, reporting
- **Education**: Learning, teaching, training
- **Communication**: Chat, video, collaboration
- **Research**: Data analysis, insights
- **Customer Service**: Support, chatbots
- **Healthcare**: Medical, wellness, fitness
- **Finance**: Money, investment, fintech
- **HR**: Recruitment, talent management
- **Sales**: Lead generation, conversion
- **Video**: Editing, production, streaming
- **Audio**: Music, voice, podcasts
- **Translation**: Language, localization
- **Gaming**: Entertainment, interactive tools
- **Real Estate**: Property, housing
- **Legal**: Law, compliance, contracts
- **Travel**: Trip planning, booking
- **E-commerce**: Shopping, retail, marketplace
- **Social Media**: Platform-specific tools

## 🔧 Configuration Options

### Environment Variables
- `DRY_RUN=true`: Preview import without saving to database
- `BATCH_SIZE=50`: Number of tools to process at once (default: 50)

### Script Customization
You can modify the script to:
- Change default tool status (published/pending)
- Adjust initial vote/view counts
- Modify category mappings
- Add custom field mappings

## 📊 Sample Output

```
🚀 Starting tool import process...
📁 Excel file: /path/to/Ai_Tools_Data-Aitoolfinder.xlsx
🔍 Dry run: NO

📊 Analyzing Excel file structure...
📋 Found 1 sheet(s): Sheet1
📄 Sheet: Sheet1
   Headers: Tool Name, Website, Description, Category, Pricing
   Data rows: 13000

🎯 Using sheet: Sheet1 (13000 rows)
🔌 Connecting to database...
✅ Database connected

📝 Processing 13000 rows...
✅ Successfully mapped 12850 tools from 13000 rows

🔍 Sample mapped tools:
1. ChatGPT
   Category: writing
   Pricing: freemium ($20)
   Tags: AI, chat, writing
   URL: https://chat.openai.com

📦 Importing 12850 tools in batches of 50...
🔄 Processing batch 1/257 (50 tools)
✅ Imported: ChatGPT (writing)
✅ Imported: DALL-E 2 (design)
...

🎉 Import completed!
📊 Final Results:
   ✅ Imported: 12850
   ⏭️  Skipped: 0
   ❌ Errors: 0
   📈 Success rate: 100.0%
```

## 🔧 Post-Import Tasks

After importing, you should:

1. **Check Admin Panel**: Review imported tools in your admin dashboard
2. **Update Tool Status**: Change status from 'published' to 'pending' if you want to review first
3. **Add Custom Logos**: Upload logos for tools without images
4. **Review Categories**: Adjust categories if needed
5. **Set Featured Tools**: Mark important tools as trending/featured
6. **Test Functionality**: Verify upvotes, comments, and search work correctly

## 🚨 Important Notes

### Before Running
- **Backup your database** before importing
- Test with `DRY_RUN=true` first
- Ensure your Excel file is in the correct location
- Check that all required environment variables are set

### During Import
- Don't stop the process once started (it's designed to handle interruptions)
- Monitor the console output for any errors
- Large imports may take 30+ minutes

### After Import
- Tools are imported with `published` status by default
- Random initial votes/views are assigned for realistic appearance
- All tools support the full functionality of your existing tools

## 🐛 Troubleshooting

### Common Issues
1. **File not found**: Ensure Excel file path is correct
2. **Database connection error**: Check your environment variables
3. **Import stops**: Check console for specific error messages
4. **Duplicate tools**: Script automatically skips existing tools

### Getting Help
Check the console output for detailed error messages. The script provides comprehensive logging for debugging.

## 🔄 Re-running the Import

The script is safe to re-run. It will:
- Skip tools that already exist
- Only import new tools
- Provide a summary of what was processed

This makes it perfect for updating your database with new tools from updated Excel files. 