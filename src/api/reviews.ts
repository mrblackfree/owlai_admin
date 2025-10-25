import express from 'express';
import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Review } from '../db/models/Review.js';
import { Tool } from '../db/models/Tool.js';

const router = express.Router();

// Get all reviews (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const status = req.query.status || 'approved'; // Default to approved reviews
    const toolId = req.query.toolId;
    
    const query: any = {};
    
    if (status === 'all' && req.query.isAdmin === 'true') {
      // Admin can see all reviews
    } else if (status !== 'all') {
      query.status = status;
    }
    
    if (toolId) {
      query.toolId = toolId;
    }
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Populate tool information for each review
    const reviewsWithToolInfo = await Promise.all(
      reviews.map(async (review) => {
        try {
          const tool = await Tool.findById(review.toolId);
          return {
            ...review.toObject(),
            toolName: tool?.name || 'Unknown Tool',
            toolSlug: tool?.slug || ''
          };
        } catch (error) {
          console.error(`Error fetching tool for review ${review._id}:`, error);
          return {
            ...review.toObject(),
            toolName: 'Unknown Tool',
            toolSlug: ''
          };
        }
      })
    );
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews: reviewsWithToolInfo,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Populate tool information
    let reviewWithToolInfo;
    try {
      const tool = await Tool.findById(review.toolId);
      reviewWithToolInfo = {
        ...review.toObject(),
        toolName: tool?.name || 'Unknown Tool',
        toolSlug: tool?.slug || ''
      };
    } catch (error) {
      console.error(`Error fetching tool for review ${review._id}:`, error);
      reviewWithToolInfo = {
        ...review.toObject(),
        toolName: 'Unknown Tool',
        toolSlug: ''
      };
    }
    
    res.json(reviewWithToolInfo);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Create a new review
router.post('/', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { toolId, rating, comment } = req.body;
    const userId = req.auth.userId;
    
    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate input
    if (!toolId || !rating || !comment) {
      return res.status(400).json({ error: 'ToolId, rating and comment are required' });
    }
    
    // Check if tool exists
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    // Check if user already reviewed this tool
    const existingReview = await Review.findOne({ toolId, userId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this tool' });
    }
    
    // Create review
    const newReview = await Review.create({
      toolId,
      userId,
      userName: `${user.firstName} ${user.lastName}`.trim() || user.username,
      userAvatar: user.imageUrl,
      rating,
      comment,
      status: 'pending' // All reviews start as pending
    });
    
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review (user can only update their own reviews)
router.put('/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.auth.userId;
    
    // Find review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if user owns this review
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }
    
    // Update only allowed fields
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    
    // Reset status to pending for re-moderation
    review.status = 'pending';
    review.updatedAt = new Date();
    
    await review.save();
    
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review (user can only delete their own reviews)
router.delete('/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Find review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if user owns this review or is an admin
    const user = await clerkClient.users.getUser(userId);
    const isAdmin = user?.publicMetadata?.role === 'admin';
    
    if (review.userId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }
    
    const toolId = review.toolId; // Save toolId before deleting
    const wasApproved = review.status === 'approved'; // Check if this was an approved review
    
    await Review.findByIdAndDelete(req.params.id);
    
    // If the review was approved, update the tool's rating
    if (wasApproved) {
      await updateToolRating(toolId);
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Admin routes for reviewing reviews
router.put('/:id/moderate', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const userId = req.auth.userId;
    
    // Check if user is admin
    const user = await clerkClient.users.getUser(userId);
    const isAdmin = user?.publicMetadata?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized to moderate reviews' });
    }
    
    // Find review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const prevStatus = review.status; // Save previous status
    
    // Update moderation fields
    if (status) review.status = status;
    if (adminResponse) review.adminResponse = adminResponse;
    review.updatedAt = new Date();
    
    await review.save();
    
    // Update tool's rating if review status changed to/from approved
    if (status === 'approved' || prevStatus === 'approved') {
      await updateToolRating(review.toolId);
    }
    
    res.json(review);
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

// Helper function to update a tool's average rating
async function updateToolRating(toolId) {
  try {
    // Get all approved reviews for this tool
    const reviews = await Review.find({ 
      toolId, 
      status: 'approved' 
    });
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    // Update the tool
    const updatedTool = await Tool.findByIdAndUpdate(toolId, {
      rating: parseFloat(averageRating.toFixed(1)),
      reviews: reviews.length
    }, { new: true });
    
    console.log(`Updated tool ${toolId}: rating=${updatedTool.rating}, reviews=${updatedTool.reviews}`);
  } catch (error) {
    console.error('Error updating tool rating:', error);
  }
}

// Special endpoint to force update a tool's review count and rating
router.get('/refresh-tool-ratings/:toolId', async (req, res) => {
  try {
    const toolId = req.params.toolId;
    
    // Validate toolId
    if (!toolId) {
      return res.status(400).json({ error: 'Tool ID is required' });
    }
    
    await updateToolRating(toolId);
    
    // Get the updated tool
    const tool = await Tool.findById(toolId);
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json({ 
      message: 'Tool ratings refreshed successfully',
      toolId: tool._id,
      rating: tool.rating,
      reviews: tool.reviews 
    });
  } catch (error) {
    console.error('Error refreshing tool ratings:', error);
    res.status(500).json({ error: 'Failed to refresh tool ratings' });
  }
});

export default router; 