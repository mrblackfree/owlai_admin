import { createHandler } from "./handler.js";
import { z } from "zod";
import { Tool } from '../db/models/Tool.js';
import { connectDB } from '../db/connection.js';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { getLanguage, localizeDocument } from '../utils/language.js';
import { getMessage } from '../i18n/messages.js';

// Zod validation messages helper
const getValidationMessages = (lang: string = 'ko') => {
    const messages = {
        ko: {
            nameMin: "이름은 최소 2자 이상이어야 합니다",
            descriptionMin: "설명은 최소 10자 이상이어야 합니다",
            invalidUrl: "올바른 URL을 입력해주세요",
            selectCategory: "카테고리를 선택해주세요",
            addTag: "최소 1개 이상의 태그를 추가해주세요",
            selectPricing: "가격 유형을 선택해주세요",
            addFeature: "최소 1개 이상의 기능을 추가해주세요"
        },
        en: {
            nameMin: "Name must be at least 2 characters",
            descriptionMin: "Description must be at least 10 characters",
            invalidUrl: "Please enter a valid URL",
            selectCategory: "Please select a category",
            addTag: "Add at least one tag",
            selectPricing: "Please select a pricing type",
            addFeature: "Add at least one feature"
        }
    };
    return messages[lang as 'ko' | 'en'] || messages.ko;
};

const createToolSchema = (lang: string = 'ko') => {
    const msg = getValidationMessages(lang);
    return z.object({
        name: z.string().min(2, msg.nameMin),
        description: z.string().min(10, msg.descriptionMin),
        websiteUrl: z.string().url(msg.invalidUrl),
        category: z.string().min(1, msg.selectCategory),
        tags: z.array(z.string()).min(1, msg.addTag),
        pricing: z.object({
            type: z.enum(["free", "freemium", "paid", "enterprise"], {
                required_error: msg.selectPricing,
            }),
            startingPrice: z.union([
                z.string().transform((val) => {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? undefined : parsed;
                }),
                z.number(),
                z.undefined()
            ]),
        }),
        features: z.array(z.string()).min(1, msg.addFeature),
        logo: z.string().optional(),
        status: z.enum(["draft", "published", "archived", "pending", "approved", "rejected"]).default("draft"),
        isTrending: z.boolean().optional(),
        isNew: z.boolean().optional(),
        isUpcoming: z.boolean().optional(),
        isTopRated: z.boolean().optional(),
        views: z.number().default(0),
        votes: z.number().default(0),
        rating: z.number().default(0),
        reviews: z.number().default(0),
        slug: z.string().optional(),
    });
};

const toolSchema = createToolSchema('ko');

const handler = createHandler();

// Add a function to generate slug from name
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric character with a dash
        .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
        .replace(/-+/g, '-'); // Replace multiple consecutive dashes with a single dash
};

// Get dashboard statistics
handler.get('/stats', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/tools/stats - Fetching dashboard statistics');
        await connectDB();

        const stats = await Promise.all([
            // Total tools count
            Tool.countDocuments({ status: 'published' }),
            // Pending submissions count
            Tool.countDocuments({ status: 'pending' }),
            // Tools by category
            Tool.aggregate([
                { $match: { status: 'published' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Recent tools
            Tool.find({ status: 'published' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name category createdAt'),
            // Popular tools (by views)
            Tool.find({ status: 'published' })
                .sort({ views: -1 })
                .limit(5)
                .select('name views'),
            // Tools by status
            Tool.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Tools by pricing type
            Tool.aggregate([
                { $match: { status: 'published' } },
                { $group: { _id: '$pricing.type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        return res.json({
            totalTools: stats[0],
            pendingSubmissions: stats[1],
            categoryCounts: stats[2],
            recentTools: stats[3],
            popularTools: stats[4],
            statusCounts: stats[5],
            pricingCounts: stats[6]
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get all tool submissions (pending tools)
handler.get('/submissions', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/tools/submissions - Fetching tool submissions');
        await connectDB();

        const submissions = await Tool.find({ status: 'pending' }).sort({ createdAt: -1 });
        console.log('GET /api/tools/submissions - Found', submissions.length, 'submissions');

        // Format the submissions with properly formatted dates
        const formattedSubmissions = submissions.map(submission => ({
            ...submission.toObject(),
            _id: submission._id.toString(),
            id: submission._id.toString(),
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
            submittedDate: submission.createdAt ? new Date(submission.createdAt).toISOString() : null
        }));

        return res.json(formattedSubmissions);
    } catch (error) {
        console.error('Error fetching tool submissions:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get all tools with pagination
handler.get('/', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/tools - Fetching tools');
        await connectDB();

        const { 
            search, 
            limit = '50', 
            page = '1', 
            category, 
            pricing, 
            status = 'published',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        // Pagination setup
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 50;
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query: any = {};
        
        // Status filter (allow different statuses for admin)
        if (status && typeof status === 'string') {
            query.status = status;
        } else {
            query.status = 'published';
        }

        // Category filter
        if (category && typeof category === 'string') {
            query.category = { $regex: category, $options: 'i' };
        }

        // Pricing filter
        if (pricing && typeof pricing === 'string') {
            query['pricing.type'] = pricing;
        }

        // Sort options
        const sortOptions: any = {};
        const validSortFields = ['createdAt', 'updatedAt', 'name', 'views', 'votes', 'rating'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
        sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

        // If search query is provided, create a search filter
        if (search && typeof search === 'string' && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            
            // Create a compound query to search across multiple fields
            query.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { tags: { $in: [searchRegex] } }
            ];
            
            // Optimize search with proper MongoDB queries - prioritize name matches first
            const searchLower = search.toLowerCase();
            
            // First try exact name matches for fastest results
            const [tools, totalCount] = await Promise.all([
                Tool.find(query)
                    .sort({ 
                        // Prioritize name matches, then by popularity
                        name: 1,
                        views: -1,
                        createdAt: -1 
                    })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Tool.countDocuments(query)
            ]);
                
            console.log(`Search for "${search}" - Found ${tools.length}/${totalCount} results (Page ${pageNum})`);
            
            // Transform the search results
            const formattedTools = tools.map(tool => ({
                _id: tool._id.toString(),
                id: tool._id.toString(),
                name: tool.name,
                slug: tool.slug,
                description: tool.description,
                websiteUrl: tool.websiteUrl,
                url: tool.websiteUrl,
                website: new URL(tool.websiteUrl).hostname,
                category: tool.category,
                tags: tool.tags,
                pricing: {
                    type: tool.pricing?.type || 'free',
                    startingPrice: tool.pricing?.startingPrice || undefined,
                },
                features: tool.features,
                status: tool.status,
                isTrending: tool.isTrending || false,
                isNew: tool.isNewTool || false,
                isUpcoming: tool.isUpcoming || false,
                isTopRated: tool.isTopRated || false,
                views: tool.views || 0,
                votes: tool.votes || 0,
                rating: tool.rating || 0,
                reviews: tool.reviews || 0,
                createdAt: tool.createdAt,
                updatedAt: tool.updatedAt,
                logo: tool.logo
            }));

            // Return paginated search results
            return res.json({
                data: formattedTools,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    limit: limitNum,
                    hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                    hasPrevPage: pageNum > 1
                }
            });
        }

        // For non-search queries, implement proper pagination
        const [tools, totalCount] = await Promise.all([
            Tool.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Tool.countDocuments(query)
        ]);

        console.log(`GET /api/tools - Page ${pageNum}, Found ${tools.length}/${totalCount} tools`);

        // Transform the data to match the expected format
        const formattedTools = tools.map(tool => ({
            _id: tool._id.toString(),
            id: tool._id.toString(),
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            websiteUrl: tool.websiteUrl,
            url: tool.websiteUrl,
            website: new URL(tool.websiteUrl).hostname,
            category: tool.category,
            tags: tool.tags,
            pricing: {
                type: tool.pricing?.type || 'free',
                startingPrice: tool.pricing?.startingPrice || undefined,
            },
            features: tool.features,
            status: tool.status,
            isTrending: tool.isTrending || false,
            isNew: tool.isNewTool || false,
            isUpcoming: tool.isUpcoming || false,
            isTopRated: tool.isTopRated || false,
            views: tool.views || 0,
            votes: tool.votes || 0,
            rating: tool.rating || 0,
            reviews: tool.reviews || 0,
            createdAt: tool.createdAt,
            updatedAt: tool.updatedAt,
            logo: tool.logo
        }));

        // Return paginated response with metadata
        return res.json({
            data: formattedTools,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                limit: limitNum,
                hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Error fetching tools:', error);
        return res.status(500).json({ error: 'Failed to fetch tools' });
    }
});

// Get single tool by ID or slug
handler.get('/:idOrSlug', async (req, res) => {
    try {
        console.log('GET /api/tools/:idOrSlug - Fetching tool:', req.params.idOrSlug);
        await connectDB();

        // Try to find by slug first
        let tool = await Tool.findOne({ slug: req.params.idOrSlug });

        // If not found by slug, try to find by ID
        if (!tool && mongoose.Types.ObjectId.isValid(req.params.idOrSlug)) {
            tool = await Tool.findById(req.params.idOrSlug);
        }

        if (!tool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        // Increment views
        tool.views += 1;
        await tool.save();

        // Format the response
        const formattedTool = {
            _id: tool._id.toString(),
            id: tool._id.toString(),
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            websiteUrl: tool.websiteUrl,
            url: tool.websiteUrl,
            website: new URL(tool.websiteUrl).hostname,
            category: tool.category,
            tags: tool.tags,
            pricing: {
                type: tool.pricing?.type || 'free',
                startingPrice: tool.pricing?.startingPrice || undefined,
            },
            features: tool.features,
            status: tool.status,
            isTrending: tool.isTrending || false,
            isNew: tool.isNewTool || false,
            isUpcoming: tool.isUpcoming || false,
            isTopRated: tool.isTopRated || false,
            views: tool.views || 0,
            votes: tool.votes || 0,
            rating: tool.rating || 0,
            reviews: tool.reviews || 0,
            createdAt: tool.createdAt,
            updatedAt: tool.updatedAt,
            logo: tool.logo
        };

        return res.json(formattedTool);
    } catch (error) {
        console.error('Error fetching tool:', error);
        return res.status(500).json({ error: 'Failed to fetch tool' });
    }
});

// Create new tool
handler.post('/', async (req, res) => {
    try {
        await connectDB();
        const toolData = toolSchema.parse(req.body);

        // Generate slug from name if not provided
        const slug = toolData.slug || generateSlug(toolData.name);

        // Check if slug already exists
        const existingTool = await Tool.findOne({ slug });
        if (existingTool) {
            // If slug exists, append a random number
            const randomSuffix = Math.floor(Math.random() * 1000);
            toolData.slug = `${slug}-${randomSuffix}`;
        } else {
            toolData.slug = slug;
        }

        // Map isNew field from frontend to isNewTool in database
        const dbToolData = {
            ...toolData,
            isNewTool: toolData.isNew,
            status: 'pending'
        };

        const newTool = new Tool(dbToolData);

        await newTool.save();
        return res.status(201).json(newTool);
    } catch (error) {
        console.error('Error creating tool:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to create tool' });
    }
});

// Update tool
handler.patch('/:id', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const updateData = toolSchema.partial().parse(req.body);
        
        // Map frontend fields to database fields
        const dbUpdateData = {
            ...updateData,
            isNewTool: updateData.isNew,
            updatedAt: new Date()
        };

        const updatedTool = await Tool.findByIdAndUpdate(
            id,
            dbUpdateData,
            { new: true, runValidators: true }
        );

        if (!updatedTool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        // Format the response
        const formattedTool = {
            ...updatedTool.toObject(),
            _id: updatedTool._id.toString(),
            id: updatedTool._id.toString(),
            isNew: updatedTool.isNewTool
        };

        return res.json(formattedTool);
    } catch (error) {
        console.error('Error updating tool:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update tool' });
    }
});

// Delete tool
handler.delete('/:id', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;

        const deletedTool = await Tool.findByIdAndDelete(id);
        if (!deletedTool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting tool:', error);
        return res.status(500).json({ error: 'Failed to delete tool' });
    }
});

// Update tool status
handler.patch('/:id/status', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { status } = z.object({
            status: z.enum(["draft", "published", "archived", "pending", "approved", "rejected"])
        }).parse(req.body);

        // If status is 'approved', we'll actually set it to 'published' to make it appear in the main listing
        const finalStatus = status === 'approved' ? 'published' : status;

        const updatedTool = await Tool.findByIdAndUpdate(
            id,
            { status: finalStatus, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedTool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        return res.json(updatedTool);
    } catch (error) {
        console.error('Error updating tool status:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update tool status' });
    }
});

// Update tool votes (PATCH method)
handler.patch('/:id/vote', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { action } = z.object({
            action: z.enum(["upvote", "downvote"])
        }).parse(req.body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`PATCH /vote: Invalid ObjectId format for ID: ${id}`);
            return res.status(400).json({ error: 'Invalid ID format for voting' });
        }

        // Find the tool
        const tool = await Tool.findById(id);
        
        if (!tool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        // Update votes based on action
        if (action === "upvote") {
            tool.votes = (tool.votes || 0) + 1;
        } else if (action === "downvote") {
            tool.votes = Math.max(0, (tool.votes || 0) - 1); // Ensure votes don't go below 0
        }

        await tool.save();

        return res.json({ 
            success: true, 
            votes: tool.votes 
        });
    } catch (error) {
        console.error('Error updating tool votes (PATCH):', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update votes' });
    }
});

// Update tool votes (POST method - alternative for environments where PATCH isn't supported)
handler.post('/:id/vote', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { action } = z.object({
            action: z.enum(["upvote", "downvote"])
        }).parse(req.body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`POST /vote: Invalid ObjectId format for ID: ${id}`);
            return res.status(400).json({ error: 'Invalid ID format for voting' });
        }

        // Find the tool
        const tool = await Tool.findById(id);
        
        if (!tool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        // Update votes based on action
        if (action === "upvote") {
            tool.votes = (tool.votes || 0) + 1;
        } else if (action === "downvote") {
            tool.votes = Math.max(0, (tool.votes || 0) - 1); // Ensure votes don't go below 0
        }

        await tool.save();

        return res.json({ 
            success: true, 
            votes: tool.votes 
        });
    } catch (error) {
        console.error('Error updating tool votes (POST):', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update votes' });
    }
});

// Update tool votes (GET method - for maximum compatibility with restrictive environments)
handler.get('/:id/vote', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { action } = z.object({
      action: z.enum(["upvote", "downvote"])
    }).parse(req.query);  // Note: using query parameters instead of body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`GET /vote: Invalid ObjectId format for ID: ${id}`);
        return res.status(400).json({ error: 'Invalid ID format for voting' });
    }

    // Find the tool
    const tool = await Tool.findById(id);
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Update votes based on action
    if (action === "upvote") {
      tool.votes = (tool.votes || 0) + 1;
    } else if (action === "downvote") {
      tool.votes = Math.max(0, (tool.votes || 0) - 1); // Ensure votes don't go below 0
    }

    await tool.save();

    return res.json({ 
      success: true, 
      votes: tool.votes 
    });
  } catch (error) {
    console.error('Error updating tool votes via GET:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update votes' });
  }
});

export const toolsHandler = handler; 