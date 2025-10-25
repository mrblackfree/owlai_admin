import express from 'express';
import Sponsorship from '../db/models/Sponsorship.js';
import { Tool } from '../db/models/Tool.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/sponsorships - List all sponsorships
router.get('/', async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find()
      .populate('toolId', '_id name logo description slug category tags features pricing status views votes rating reviews createdAt updatedAt isTrending isNew')
      .sort({ createdAt: -1 });
    res.json(sponsorships);
  } catch (err) {
    console.error("Failed to fetch sponsorships with populated toolId:", err);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// GET /api/sponsorships/available-tools - List all available tools for sponsorship
router.get('/available-tools', async (req, res) => {
  try {
    const tools = await Tool.find({ 
      status: 'published' 
    }).select('_id name description logo slug category votes');
    res.json(tools);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available tools' });
  }
});

// POST /api/sponsorships - Create a new sponsorship
router.post('/', async (req, res) => {
  try {
    const tool = await Tool.findById(req.body.toolId);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.body.toolId)) {
        return res.status(400).json({ error: 'Invalid Tool ID provided for sponsorship' });
    }

    const sponsorshipData = { ...req.body };
    if (!sponsorshipData.name && tool) sponsorshipData.name = tool.name;
    if (!sponsorshipData.description && tool) sponsorshipData.description = tool.description;
    if (!sponsorshipData.logo && tool) sponsorshipData.logo = tool.logo;
    if (!sponsorshipData.slug && tool) sponsorshipData.slug = tool.slug;
    if (!sponsorshipData.category && tool) sponsorshipData.category = tool.category;
    if (!sponsorshipData.url && tool) sponsorshipData.url = tool.websiteUrl;

    const sponsorship = new Sponsorship(sponsorshipData);
    await sponsorship.save();
    const populatedSponsorship = await Sponsorship.findById(sponsorship._id)
        .populate('toolId', '_id name logo description slug category tags features pricing status views votes rating reviews createdAt updatedAt isTrending isNew');
    res.status(201).json(populatedSponsorship);
  } catch (err: any) {
    console.error("Error creating sponsorship:", err);
    res.status(400).json({ error: 'Failed to create sponsorship', details: err.message ? err.message : err });
  }
});

// PUT /api/sponsorships/:id - Update a sponsorship
router.put('/:id', async (req, res) => {
  try {
    const sponsorshipId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(sponsorshipId)) {
        return res.status(400).json({ error: 'Invalid Sponsorship ID format' });
    }
    if (req.body.toolId && !mongoose.Types.ObjectId.isValid(req.body.toolId)) {
        return res.status(400).json({ error: 'Invalid Tool ID format for update' });
    }

    const sponsorship = await Sponsorship.findByIdAndUpdate(sponsorshipId, req.body, { new: true })
        .populate('toolId', '_id name logo description slug category tags features pricing status views votes rating reviews createdAt updatedAt isTrending isNew');
    if (!sponsorship) return res.status(404).json({ error: 'Sponsorship not found' });
    res.json(sponsorship);
  } catch (err: any) {
    console.error("Error updating sponsorship:", err);
    res.status(400).json({ error: 'Failed to update sponsorship', details: err.message ? err.message : err });
  }
});

// DELETE /api/sponsorships/:id - Delete a sponsorship
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format', details: 'The provided ID is not a valid MongoDB ObjectId' });
    }
    const sponsorship = await Sponsorship.findByIdAndDelete(id);
    if (!sponsorship) return res.status(404).json({ error: 'Sponsorship not found' });
    res.json({ success: true, message: 'Sponsorship deleted successfully' });
  } catch (err: any) {
    console.error("Error deleting sponsorship:", err);
    res.status(500).json({ error: 'Failed to delete sponsorship', details: err.message ? err.message : err });
  }
});

export default router; 