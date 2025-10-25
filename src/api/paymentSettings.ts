import { createHandler } from "./handler.js";
import { z } from "zod";
import { PaymentSettings } from '../db/models/PaymentSettings.js';
import { connectDB } from '../db/connection.js';

const handler = createHandler();

// Validation schemas
const stripeConfigSchema = z.object({
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional()
});

const paypalConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  webhookId: z.string().optional()
});

const updatePaymentSettingsSchema = z.object({
  stripe: z.object({
    enabled: z.boolean().optional(),
    mode: z.enum(['test', 'live']).optional(),
    test: stripeConfigSchema.optional(),
    live: stripeConfigSchema.optional()
  }).optional(),
  paypal: z.object({
    enabled: z.boolean().optional(),
    mode: z.enum(['sandbox', 'live']).optional(),
    sandbox: paypalConfigSchema.optional(),
    live: paypalConfigSchema.optional()
  }).optional(),
  currency: z.string().optional(),
  environment: z.enum(['development', 'production']).optional()
});

// Get payment settings
handler.get('/', async (req, res) => {
  try {
    console.log('GET /api/payment-settings - Fetching payment settings');
    await connectDB();
    
    const settings = await PaymentSettings.getSettings();
    
    // Remove sensitive data before sending to frontend
    const safeSettings = {
      _id: settings._id,
      stripe: {
        enabled: settings.stripe.enabled,
        mode: settings.stripe.mode,
        test: {
          publishableKey: settings.stripe.test.publishableKey,
          // Don't send secret keys to frontend
          secretKey: settings.stripe.test.secretKey ? '••••••••' : undefined,
          webhookSecret: settings.stripe.test.webhookSecret ? '••••••••' : undefined
        },
        live: {
          publishableKey: settings.stripe.live.publishableKey,
          secretKey: settings.stripe.live.secretKey ? '••••••••' : undefined,
          webhookSecret: settings.stripe.live.webhookSecret ? '••••••••' : undefined
        }
      },
      paypal: {
        enabled: settings.paypal.enabled,
        mode: settings.paypal.mode,
        sandbox: {
          clientId: settings.paypal.sandbox.clientId,
          clientSecret: settings.paypal.sandbox.clientSecret ? '••••••••' : undefined,
          webhookId: settings.paypal.sandbox.webhookId
        },
        live: {
          clientId: settings.paypal.live.clientId,
          clientSecret: settings.paypal.live.clientSecret ? '••••••••' : undefined,
          webhookId: settings.paypal.live.webhookId
        }
      },
      currency: settings.currency,
      environment: settings.environment,
      lastUpdated: settings.lastUpdated,
      updatedBy: settings.updatedBy
    };
    
    return res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch payment settings' 
    });
  }
});

// Update payment settings
handler.patch('/', async (req, res) => {
  try {
    console.log('PATCH /api/payment-settings - Updating payment settings');
    await connectDB();

    const validatedData = updatePaymentSettingsSchema.parse(req.body);
    
    const settings = await PaymentSettings.getSettings();
    
    // Update settings
    if (validatedData.stripe) {
      if (validatedData.stripe.enabled !== undefined) {
        settings.stripe.enabled = validatedData.stripe.enabled;
      }
      if (validatedData.stripe.mode) {
        settings.stripe.mode = validatedData.stripe.mode;
      }
      if (validatedData.stripe.test) {
        Object.assign(settings.stripe.test, validatedData.stripe.test);
      }
      if (validatedData.stripe.live) {
        Object.assign(settings.stripe.live, validatedData.stripe.live);
      }
    }
    
    if (validatedData.paypal) {
      if (validatedData.paypal.enabled !== undefined) {
        settings.paypal.enabled = validatedData.paypal.enabled;
      }
      if (validatedData.paypal.mode) {
        settings.paypal.mode = validatedData.paypal.mode;
      }
      if (validatedData.paypal.sandbox) {
        Object.assign(settings.paypal.sandbox, validatedData.paypal.sandbox);
      }
      if (validatedData.paypal.live) {
        Object.assign(settings.paypal.live, validatedData.paypal.live);
      }
    }
    
    if (validatedData.currency) {
      settings.currency = validatedData.currency;
    }
    
    if (validatedData.environment) {
      settings.environment = validatedData.environment;
    }
    
    settings.lastUpdated = new Date();
    // TODO: Get user ID from authentication when implemented
    settings.updatedBy = 'admin';
    
    await settings.save();
    
    // Validate the configuration
    const validation = settings.validateConfiguration();
    
    return res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: {
        _id: settings._id,
        validation
      }
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    
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
      error: 'Failed to update payment settings' 
    });
  }
});

// Test connection for Stripe
handler.post('/test-stripe', async (req, res) => {
  try {
    console.log('POST /api/payment-settings/test-stripe - Testing Stripe connection');
    await connectDB();
    
    const { mode } = req.body;
    const settings = await PaymentSettings.getSettings();
    const stripeConfig = settings.getCurrentStripeConfig();
    
    if (!stripeConfig || settings.stripe.mode !== mode) {
      return res.status(400).json({
        success: false,
        error: 'Stripe configuration not found or mode mismatch'
      });
    }
    
    // Import Stripe dynamically to test connection
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2023-10-16'
    });
    
    // Test the connection by fetching account info
    const account = await stripe.accounts.retrieve();
    
    return res.json({
      success: true,
      message: 'Stripe connection successful',
      data: {
        accountId: account.id,
        country: account.country,
        currency: account.default_currency,
        mode: stripeConfig.mode
      }
    });
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to test Stripe connection'
    });
  }
});

// Get payment configuration for frontend (public keys only)
handler.get('/public-config', async (req, res) => {
  try {
    console.log('GET /api/payment-settings/public-config - Fetching public payment config');
    await connectDB();
    
    const settings = await PaymentSettings.getSettings();
    
    const publicConfig = {
      stripe: {
        enabled: settings.stripe.enabled,
        publishableKey: settings.stripe.enabled ? 
          (settings.stripe.mode === 'test' ? 
            settings.stripe.test.publishableKey : 
            settings.stripe.live.publishableKey
          ) : null,
        mode: settings.stripe.mode
      },
      paypal: {
        enabled: settings.paypal.enabled,
        clientId: settings.paypal.enabled ?
          (settings.paypal.mode === 'sandbox' ?
            settings.paypal.sandbox.clientId :
            settings.paypal.live.clientId
          ) : null,
        mode: settings.paypal.mode
      },
      currency: settings.currency
    };
    
    return res.json({
      success: true,
      data: publicConfig
    });
  } catch (error) {
    console.error('Error fetching public payment config:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch payment configuration' 
    });
  }
});

export const paymentSettingsHandler = handler; 