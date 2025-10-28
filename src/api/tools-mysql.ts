import { createHandler } from "./handler.js";
import { z } from "zod";
import { Request, Response } from 'express';
import { Tool } from '../db/models-mysql/index.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { Op } from 'sequelize';
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
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
};

// Get dashboard statistics
handler.get('/stats', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/tools/stats - Fetching dashboard statistics (MySQL)');
        await connectMySQL();

        const [totalTools, pendingSubmissions] = await Promise.all([
            Tool.count({ where: { status: 'published' } }),
            Tool.count({ where: { status: 'pending' } }),
        ]);

        // Get category counts
        const categoryResults = await Tool.findAll({
            where: { status: 'published' },
            attributes: [
                'category',
                [Tool.sequelize!.fn('COUNT', '*'), 'count']
            ],
            group: ['category'],
            order: [[Tool.sequelize!.fn('COUNT', '*'), 'DESC']],
            raw: true,
        });

        const categoryCounts = categoryResults.map((r: any) => ({
            _id: r.category,
            count: parseInt(r.count)
        }));

        // Get recent tools
        const recentTools = await Tool.findAll({
            where: { status: 'published' },
            attributes: ['name', 'category', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 5,
        });

        // Get popular tools
        const popularTools = await Tool.findAll({
            where: { status: 'published' },
            attributes: ['name', 'views'],
            order: [['views', 'DESC']],
            limit: 5,
        });

        return res.json({
            totalTools,
            pendingSubmissions,
            categoryCounts,
            recentTools,
            popularTools,
            statusCounts: [],
            pricingCounts: []
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get all tools with pagination
handler.get('/', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/tools - Fetching tools (MySQL)');
        await connectMySQL();

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        
        const category = req.query.category as string;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as string || 'createdAt';
        const status = req.query.status as string || 'published';

        // Build where clause
        const where: any = { status };
        
        if (category && category !== 'all') {
            where.category = category;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }

        // Build order clause
        let order: any[] = [];
        switch (sortBy) {
            case 'trending':
                order = [['isTrending', 'DESC'], ['views', 'DESC']];
                break;
            case 'newest':
                order = [['createdAt', 'DESC']];
                break;
            case 'popular':
                order = [['views', 'DESC']];
                break;
            case 'rating':
                order = [['rating', 'DESC']];
                break;
            default:
                order = [['createdAt', 'DESC']];
        }

        const { count, rows } = await Tool.findAndCountAll({
            where,
            limit,
            offset,
            order,
        });

        const totalPages = Math.ceil(count / limit);

        return res.json({
            data: rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount: count,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        });
    } catch (error) {
        console.error('Error fetching tools:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Get tool by slug
handler.get('/:slug', async (req: Request, res: Response) => {
    try {
        console.log(`GET /api/tools/${req.params.slug} - Fetching tool (MySQL)`);
        await connectMySQL();

        const tool = await Tool.findOne({
            where: { slug: req.params.slug }
        });

        if (!tool) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('TOOL_NOT_FOUND', lang, 'error') });
        }

        // Increment view count
        await tool.increment('views');

        return res.json(tool);
    } catch (error) {
        console.error('Error fetching tool:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('DB_QUERY_FAILED', lang, 'error') });
    }
});

// Create new tool
handler.post('/', async (req: Request, res: Response) => {
    try {
        console.log('POST /api/tools - Creating tool (MySQL)');
        await connectMySQL();

        const lang = getLanguage(req);
        const validationResult = toolSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: getMessage('VALIDATION_ERROR', lang, 'error'),
                details: validationResult.error.errors
            });
        }

        const toolData = validationResult.data;
        
        // Generate slug if not provided
        if (!toolData.slug) {
            toolData.slug = generateSlug(toolData.name);
        }

        const newTool = await Tool.create({
            name: toolData.name,
            slug: toolData.slug,
            description: toolData.description,
            websiteUrl: toolData.websiteUrl,
            category: toolData.category,
            tags: toolData.tags,
            pricingType: toolData.pricing.type,
            startingPrice: toolData.pricing.startingPrice,
            features: toolData.features,
            logo: toolData.logo,
            status: toolData.status as any,
            isTrending: toolData.isTrending || false,
            isNewTool: toolData.isNew || false,
            isUpcoming: toolData.isUpcoming || false,
            isTopRated: toolData.isTopRated || false,
            views: toolData.views,
            votes: toolData.votes,
            rating: toolData.rating,
            reviews: toolData.reviews,
        });

        return res.status(201).json({
            message: getMessage('TOOL_CREATED', lang, 'success'),
            tool: newTool
        });
    } catch (error: any) {
        console.error('Error creating tool:', error);
        const lang = getLanguage(req);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: getMessage('TOOL_ALREADY_EXISTS', lang, 'error') });
        }
        
        return res.status(500).json({ error: getMessage('TOOL_CREATE_FAILED', lang, 'error') });
    }
});

// Update tool
handler.patch('/:id', async (req: Request, res: Response) => {
    try {
        console.log(`PATCH /api/tools/${req.params.id} - Updating tool (MySQL)`);
        await connectMySQL();

        const tool = await Tool.findByPk(req.params.id);

        if (!tool) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('TOOL_NOT_FOUND', lang, 'error') });
        }

        await tool.update(req.body);

        const lang = getLanguage(req);
        return res.json({
            message: getMessage('TOOL_UPDATED', lang, 'success'),
            tool
        });
    } catch (error) {
        console.error('Error updating tool:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('TOOL_UPDATE_FAILED', lang, 'error') });
    }
});

// Delete tool
handler.delete('/:id', async (req: Request, res: Response) => {
    try {
        console.log(`DELETE /api/tools/${req.params.id} - Deleting tool (MySQL)`);
        await connectMySQL();

        const tool = await Tool.findByPk(req.params.id);

        if (!tool) {
            const lang = getLanguage(req);
            return res.status(404).json({ error: getMessage('TOOL_NOT_FOUND', lang, 'error') });
        }

        await tool.destroy();

        const lang = getLanguage(req);
        return res.json({
            message: getMessage('TOOL_DELETED', lang, 'success')
        });
    } catch (error) {
        console.error('Error deleting tool:', error);
        const lang = getLanguage(req);
        return res.status(500).json({ error: getMessage('TOOL_DELETE_FAILED', lang, 'error') });
    }
});

export { handler as toolsHandler };

