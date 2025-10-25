import { createHandler } from "./handler.js";
import { z } from "zod";
import { AdvertisingPlan } from '../db/models/AdvertisingPlan.js';
import { AdvertisingPurchase } from '../db/models/AdvertisingPurchase.js';
import { connectDB } from '../db/connection.js';

const handler = createHandler();

// Validation schemas
const advertisingPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be non-negative"),
  currency: z.enum(['USD', 'EUR', 'GBP']).optional().default('USD'),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  features: z.array(z.string().min(1)).min(1, "At least one feature is required"),
  isActive: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  stripePriceId: z.string().optional(),
  paypalPlanId: z.string().optional(),
  placement: z.enum(['basic', 'featured', 'premium', 'sponsored']).optional().default('basic'),
  maxListings: z.number().min(1).optional().default(1),
  analytics: z.boolean().optional().default(false),
  socialPromotion: z.boolean().optional().default(false),
  newsletterFeature: z.boolean().optional().default(false),
  prioritySupport: z.boolean().optional().default(false),
  customIntegrations: z.boolean().optional().default(false)
});

// Get all advertising plans (public endpoint)
handler.get('/', async (req, res) => {
  try {
    console.log('GET /api/advertising-plans - Fetching all plans');
    await connectDB();
    
    const { active } = req.query;
    const filter = active === 'true' ? { isActive: true } : {};
    
    const plans = await AdvertisingPlan.find(filter).sort({ price: 1 });
    
    return res.json(plans);
  } catch (error) {
    console.error('Error fetching advertising plans:', error);
    return res.status(500).json({ error: 'Failed to fetch advertising plans' });
  }
});

// Get single advertising plan
handler.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/advertising-plans/:id - Fetching plan:', req.params.id);
    await connectDB();
    
    const plan = await AdvertisingPlan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Advertising plan not found' });
    }
    
    return res.json(plan);
  } catch (error) {
    console.error('Error fetching advertising plan:', error);
    return res.status(500).json({ error: 'Failed to fetch advertising plan' });
  }
});

// Create advertising plan (admin only)
handler.post('/', async (req, res) => {
  try {
    console.log('POST /api/advertising-plans - Creating plan:', JSON.stringify(req.body));
    await connectDB();

    // Validate request body
    const validatedData = advertisingPlanSchema.parse(req.body);
    
    // Check if slug already exists
    const existingPlan = await AdvertisingPlan.findOne({ slug: validatedData.slug });
    if (existingPlan) {
      return res.status(409).json({ error: 'A plan with this slug already exists' });
    }

    const plan = await AdvertisingPlan.create(validatedData);
    console.log('Created advertising plan successfully:', plan._id.toString());
    
    return res.status(201).json({
      success: true,
      message: 'Advertising plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error creating advertising plan:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: formattedErrors
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create advertising plan' 
    });
  }
});

// Update advertising plan (admin only)
handler.patch('/:id', async (req, res) => {
  try {
    console.log('PATCH /api/advertising-plans/:id - Updating plan:', req.params.id);
    await connectDB();

    // Validate request body (partial update)
    const validatedData = advertisingPlanSchema.partial().parse(req.body);
    
    // If slug is being updated, check for conflicts
    if (validatedData.slug) {
      const existingPlan = await AdvertisingPlan.findOne({ 
        slug: validatedData.slug, 
        _id: { $ne: req.params.id } 
      });
      if (existingPlan) {
        return res.status(409).json({ error: 'A plan with this slug already exists' });
      }
    }

    const plan = await AdvertisingPlan.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Advertising plan not found' });
    }

    return res.json({
      success: true,
      message: 'Advertising plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating advertising plan:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: formattedErrors
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to update advertising plan' 
    });
  }
});

// Delete advertising plan (admin only)
handler.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/advertising-plans/:id - Deleting plan:', req.params.id);
    await connectDB();
    
    // Check if plan has active purchases
    const activePurchases = await AdvertisingPurchase.countDocuments({
      planId: req.params.id,
      status: 'active'
    });
    
    if (activePurchases > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan with active purchases. Please wait for them to expire or cancel them first.' 
      });
    }

    const plan = await AdvertisingPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ error: 'Advertising plan not found' });
    }

    return res.json({
      success: true,
      message: 'Advertising plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting advertising plan:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to delete advertising plan' 
    });
  }
});

// Get advertising plan statistics (admin only)
handler.get('/stats/overview', async (req, res) => {
  try {
    console.log('GET /api/advertising-plans/stats/overview - Fetching statistics');
    await connectDB();
    
    const [
      totalPlans,
      activePlans,
      totalPurchases,
      activePurchases,
      totalRevenue
    ] = await Promise.all([
      AdvertisingPlan.countDocuments(),
      AdvertisingPlan.countDocuments({ isActive: true }),
      AdvertisingPurchase.countDocuments(),
      AdvertisingPurchase.countDocuments({ status: 'active' }),
      AdvertisingPurchase.aggregate([
        { $match: { status: { $in: ['active', 'expired'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get purchases by plan
    const purchasesByPlan = await AdvertisingPurchase.aggregate([
      { $group: { _id: '$planName', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      totalPlans,
      activePlans,
      totalPurchases,
      activePurchases,
      totalRevenue: totalRevenue[0]?.total || 0,
      purchasesByPlan
    });
  } catch (error) {
    console.error('Error fetching advertising statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch advertising statistics' });
  }
});

export const advertisingPlansHandler = handler; 