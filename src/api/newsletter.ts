import { createHandler } from "./handler.js";
import { z } from "zod";
import { NewsletterSubscription } from '../db/models/NewsletterSubscription.js';
import { connectDB } from '../db/connection.js';

const subscriptionSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  source: z.enum(['footer', 'homepage', 'other']).optional().default('footer'),
});

const handler = createHandler();

// Get all newsletter subscriptions
handler.get('/', async (req, res) => {
  try {
    console.log('GET /api/newsletter - Fetching subscriptions');
    await connectDB();
    const subscriptions = await NewsletterSubscription.find().sort({ subscribedAt: -1 });
    return res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error);
    return res.status(500).json({ error: 'Failed to fetch newsletter subscriptions' });
  }
});

// Subscribe to newsletter
handler.post('/', async (req, res) => {
  try {
    console.log('POST /api/newsletter - Creating subscription, body:', JSON.stringify(req.body));
    await connectDB();

    // Get client IP and user agent for tracking
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate request body
    const validatedData = subscriptionSchema.parse(req.body);
    console.log('Validation successful, data:', JSON.stringify(validatedData));

    // Check if email already exists
    const existingSubscription = await NewsletterSubscription.findOne({ 
      email: validatedData.email 
    });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return res.status(409).json({
          success: false,
          message: "You're already subscribed to our newsletter!",
          data: existingSubscription
        });
      } else {
        // Reactivate unsubscribed user
        existingSubscription.status = 'active';
        existingSubscription.subscribedAt = new Date();
        existingSubscription.unsubscribedAt = undefined;
        existingSubscription.source = validatedData.source;
        existingSubscription.ipAddress = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
        existingSubscription.userAgent = userAgent;
        
        await existingSubscription.save();
        
        return res.status(200).json({
          success: true,
          message: "Welcome back! You've been resubscribed to our newsletter.",
          data: existingSubscription
        });
      }
    }

    // Create new subscription
    const subscriptionData = {
      email: validatedData.email,
      source: validatedData.source,
      status: 'active',
      subscribedAt: new Date(),
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent: userAgent,
    };

    const subscription = await NewsletterSubscription.create(subscriptionData);
    console.log('Created subscription successfully:', subscription._id.toString());
    
    return res.status(201).json({
      success: true,
      message: "Thank you for subscribing! You'll receive our latest AI tools and news.",
      data: subscription
    });
  } catch (error) {
    console.error('Error creating newsletter subscription:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.error('Validation errors:', JSON.stringify(formattedErrors));
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: formattedErrors,
        message: formattedErrors.map(e => e.message).join(', ')
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to subscribe to newsletter',
      message: 'An error occurred while processing your subscription'
    });
  }
});

// Update subscription status
handler.patch('/:id/status', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'unsubscribed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };
    if (status === 'unsubscribed') {
      updateData.unsubscribedAt = new Date();
    } else {
      updateData.unsubscribedAt = undefined;
    }

    const subscription = await NewsletterSubscription.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Newsletter subscription not found' });
    }

    return res.json(subscription);
  } catch (error) {
    console.error('Error updating newsletter subscription:', error);
    return res.status(500).json({ error: 'Failed to update newsletter subscription' });
  }
});

// Unsubscribe via email (for unsubscribe links)
handler.post('/unsubscribe', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subscription = await NewsletterSubscription.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { 
        status: 'unsubscribed',
        unsubscribedAt: new Date()
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Email not found in our subscription list' });
    }

    return res.json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter.'
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
  }
});

// Delete subscription
handler.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const subscription = await NewsletterSubscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Newsletter subscription not found' });
    }

    return res.json({ message: 'Newsletter subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting newsletter subscription:', error);
    return res.status(500).json({ error: 'Failed to delete newsletter subscription' });
  }
});

// Get subscription statistics
handler.get('/stats', async (req, res) => {
  try {
    await connectDB();
    
    const totalSubscriptions = await NewsletterSubscription.countDocuments();
    const activeSubscriptions = await NewsletterSubscription.countDocuments({ status: 'active' });
    const unsubscribedCount = await NewsletterSubscription.countDocuments({ status: 'unsubscribed' });
    
    // Get subscriptions by source
    const bySource = await NewsletterSubscription.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscriptions = await NewsletterSubscription.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
      status: 'active'
    });

    return res.json({
      total: totalSubscriptions,
      active: activeSubscriptions,
      unsubscribed: unsubscribedCount,
      recent: recentSubscriptions,
      bySource: bySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching newsletter statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch newsletter statistics' });
  }
});

export const newsletterHandler = handler; 