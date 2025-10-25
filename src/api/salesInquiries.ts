import { createHandler } from "./handler.js";
import { z } from "zod";
import { SalesInquiry } from '../db/models/SalesInquiry.js';
import { connectDB } from '../db/connection.js';

// More flexible schema that handles optional fields and transforms data if needed
const salesInquirySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  companyName: z.string().min(1, "Company name is required"),
  monthlyBudget: z.string().min(1, "Please select a monthly budget"),
  message: z.string().min(10, "Message must be at least 10 characters"),
}).catchall(z.any()); // Allow any additional fields

const handler = createHandler();

// Get all sales inquiries
handler.get('/', async (req, res) => {
  try {
    console.log('GET /api/sales-inquiries - Fetching inquiries');
    await connectDB();
    const inquiries = await SalesInquiry.find().sort({ submittedAt: -1 });
    return res.json(inquiries);
  } catch (error) {
    console.error('Error fetching sales inquiries:', error);
    return res.status(500).json({ error: 'Failed to fetch sales inquiries' });
  }
});

// Create new sales inquiry
handler.post('/', async (req, res) => {
  try {
    console.log('POST /api/sales-inquiries - Creating inquiry, body:', JSON.stringify(req.body));
    await connectDB();

    // Preprocess request to ensure all required fields are there and in correct format
    let formData = req.body;
    
    // First, handle the case where the frontend might wrap everything in an object
    if (formData && typeof formData === 'object' && Object.keys(formData).length === 1) {
      const firstKey = Object.keys(formData)[0];
      // Check if the first property appears to be an object that contains our fields
      if (typeof formData[firstKey] === 'object' && formData[firstKey] !== null) {
        console.log('Unwrapping nested form data from:', firstKey);
        formData = formData[firstKey];
      }
    }

    console.log('Processed form data:', JSON.stringify(formData));

    // Validate request body
    const validatedData = salesInquirySchema.parse(formData);
    console.log('Validation successful, data:', JSON.stringify(validatedData));

    // Extract only the fields we need for the database
    const inquiryData = {
      fullName: validatedData.fullName,
      email: validatedData.email,
      companyName: validatedData.companyName,
      monthlyBudget: validatedData.monthlyBudget,
      message: validatedData.message,
      status: 'new',
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    // Create new inquiry
    const inquiry = await SalesInquiry.create(inquiryData);
    console.log('Created inquiry successfully:', inquiry._id.toString());
    return res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully. We'll get back to you soon!",
      data: inquiry
    });
  } catch (error) {
    console.error('Error creating sales inquiry:', error);
    
    if (error instanceof z.ZodError) {
      // Format Zod validation errors into a more readable format
      const formattedErrors = error.errors.map(err => {
        return {
          field: err.path.join('.'),
          message: err.message
        };
      });
      
      console.error('Validation errors:', JSON.stringify(formattedErrors));
      
      // Return a user-friendly error message
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: formattedErrors,
        message: formattedErrors.map(e => e.message).join(', ')
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create sales inquiry',
      message: 'An error occurred while processing your request'
    });
  }
});

// Update sales inquiry status
handler.patch('/:id/status', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const inquiry = await SalesInquiry.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ error: 'Sales inquiry not found' });
    }

    return res.json(inquiry);
  } catch (error) {
    console.error('Error updating sales inquiry:', error);
    return res.status(500).json({ error: 'Failed to update sales inquiry' });
  }
});

// Delete sales inquiry
handler.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const inquiry = await SalesInquiry.findByIdAndDelete(id);

    if (!inquiry) {
      return res.status(404).json({ error: 'Sales inquiry not found' });
    }

    return res.json({ message: 'Sales inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales inquiry:', error);
    return res.status(500).json({ error: 'Failed to delete sales inquiry' });
  }
});

export const salesInquiriesHandler = handler; 