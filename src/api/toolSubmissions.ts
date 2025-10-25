import { createHandler } from "./handler.js";
import { z } from "zod";
import { ToolSubmission } from '../db/models/ToolSubmission.js';
import { connectDB } from '../db/connection.js';

const toolSubmissionSchema = z.object({
  toolName: z.string().min(2, "Tool name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  websiteUrl: z.string().url("Please enter a valid website URL"),
  logoUrl: z.string().url("Please enter a valid logo URL"),
  category: z.string().min(1, "Category is required"),
  pricingType: z.string().min(1, "Pricing type is required"),
  keyHighlights: z.array(z.string()).min(1, "At least one key highlight is required"),
  twitterUrl: z.string().url("Please enter a valid Twitter URL").optional(),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional(),
});

const handler = createHandler();

// Get all tool submissions
handler.get('/', async (req, res) => {
  try {
    await connectDB();
    const submissions = await ToolSubmission.find().sort({ submittedAt: -1 });
    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching tool submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch tool submissions' });
  }
});

// Create new tool submission
handler.post('/', async (req, res) => {
  try {
    await connectDB();
    const validatedData = toolSubmissionSchema.parse(req.body);
    const submission = await ToolSubmission.create(validatedData);
    return res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating tool submission:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Failed to create tool submission' });
  }
});

// Update tool submission status
handler.patch('/:id/status', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const submission = await ToolSubmission.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ error: 'Tool submission not found' });
    }

    return res.json(submission);
  } catch (error) {
    console.error('Error updating tool submission:', error);
    return res.status(500).json({ error: 'Failed to update tool submission' });
  }
});

// Delete tool submission
handler.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const submission = await ToolSubmission.findByIdAndDelete(id);

    if (!submission) {
      return res.status(404).json({ error: 'Tool submission not found' });
    }

    return res.json({ message: 'Tool submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool submission:', error);
    return res.status(500).json({ error: 'Failed to delete tool submission' });
  }
});

export const toolSubmissionsHandler = handler; 