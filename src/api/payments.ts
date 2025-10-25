import express from 'express';
import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import Stripe from 'stripe';
import { Subscription } from '../db/models/Subscription.js';
import { createHandler } from "./handler.js";
import { z } from "zod";
import { AdvertisingPlan } from '../db/models/AdvertisingPlan.js';
import { AdvertisingPurchase } from '../db/models/AdvertisingPurchase.js';
import { PaymentSettings } from '../db/models/PaymentSettings.js';
import { connectDB } from '../db/connection.js';

const router = express.Router();

const handler = createHandler();

// Define subscription plans (fallback if payment settings not configured)
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    description: 'Access to all basic features',
    price_monthly: process.env.STRIPE_BASIC_PRICE_MONTHLY,
    price_yearly: process.env.STRIPE_BASIC_PRICE_YEARLY
  },
  premium: {
    name: 'Premium Plan',
    description: 'Full access to all features',
    price_monthly: process.env.STRIPE_PREMIUM_PRICE_MONTHLY,
    price_yearly: process.env.STRIPE_PREMIUM_PRICE_YEARLY
  },
  enterprise: {
    name: 'Enterprise Plan',
    description: 'Custom solutions for large organizations',
    price_monthly: process.env.STRIPE_ENTERPRISE_PRICE_MONTHLY,
    price_yearly: process.env.STRIPE_ENTERPRISE_PRICE_YEARLY
  }
};

// Helper function to get configured Stripe instance
async function getConfiguredStripe() {
  const paymentSettings = await PaymentSettings.getSettings();
  const stripeConfig = paymentSettings.getCurrentStripeConfig();
  
  if (!stripeConfig || !stripeConfig.secretKey) {
    // Fallback to environment variables if no database config
    const envSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!envSecretKey) {
      throw new Error('Stripe not configured. Please configure payment settings in admin panel.');
    }
    
    return new Stripe(envSecretKey, {
      apiVersion: '2023-10-16'
    });
  }
  
  return new Stripe(stripeConfig.secretKey, {
    apiVersion: '2023-10-16'
  });
}

// Helper function to get payment settings
async function getPaymentSettings() {
  return await PaymentSettings.getSettings();
}

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    res.json(SUBSCRIPTION_PLANS);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get user's active subscription
router.get('/subscription', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Get user's subscription
    const subscription = await Subscription.findOne({ 
      userId, 
      status: 'active' 
    }).sort({ createdAt: -1 });
    
    if (!subscription) {
      return res.json({ hasActiveSubscription: false });
    }
    
    res.json({
      hasActiveSubscription: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create Stripe checkout session (legacy subscription system)
router.post('/create-checkout-session', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { plan, interval } = req.body;
    
    if (!plan || !['basic', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }
    
    if (!interval || !['month', 'year'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid billing interval' });
    }
    
    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get configured Stripe instance
    const stripe = await getConfiguredStripe();
    
    // Get price ID based on plan and interval
    const priceId = interval === 'month' 
      ? SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].price_monthly 
      : SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].price_yearly;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid price configuration' });
    }
    
    // Create or retrieve Stripe customer
    let customerId;
    const existingCustomers = await stripe.customers.list({
      email: user.emailAddresses[0]?.emailAddress,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0]?.emailAddress,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          clerkId: userId
        }
      });
      customerId = customer.id;
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId as string,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        clerkId: userId,
        plan,
        interval
      }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook to handle Stripe events (legacy subscription system)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }
  
  let event;
  
  try {
    // Get webhook secret from payment settings or fallback to env
    const paymentSettings = await getPaymentSettings();
    const stripeConfig = paymentSettings.getCurrentStripeConfig();
    const webhookSecret = stripeConfig?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    
    const stripe = await getConfiguredStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Get user's active subscription
    const subscription = await Subscription.findOne({ 
      userId, 
      status: 'active' 
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    // Get configured Stripe instance
    const stripe = await getConfiguredStripe();
    
    // Cancel at period end
    await stripe.subscriptions.update(subscription.subscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update the subscription in the database
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    
    res.json({ 
      message: 'Subscription will be canceled at the end of the current billing period',
      subscription
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Helper functions for webhook handling (updated to use configured Stripe)
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.customer) return;
  
  try {
    const stripe = await getConfiguredStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    
    const clerkId = session.metadata?.clerkId;
    if (!clerkId) return;
    
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const plan = session.metadata?.plan || 'basic';
    const interval = session.metadata?.interval || 'month';
    
    // Get the stripe invoice
    const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice as string);
    
    // Create subscription in database
    await Subscription.create({
      userId: clerkId,
      customerId,
      subscriptionId,
      status: stripeSubscription.status,
      plan,
      priceId: stripeSubscription.items.data[0].price.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      interval,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription || !invoice.customer) return;
  
  try {
    const stripe = await getConfiguredStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );
    
    // Find the subscription in our database
    const subscription = await Subscription.findOne({ 
      subscriptionId: invoice.subscription 
    });
    
    if (!subscription) return;
    
    // Update subscription details - handle the status safely
    const status = stripeSubscription.status as 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
    subscription.status = status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    
    await subscription.save();
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  try {
    // Find the subscription in our database
    const subscription = await Subscription.findOne({ 
      subscriptionId: stripeSubscription.id 
    });
    
    if (!subscription) return;
    
    // Update subscription details - handle the status safely
    const status = stripeSubscription.status as 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
    subscription.status = status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    
    if (stripeSubscription.canceled_at) {
      subscription.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
    }
    
    await subscription.save();
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  try {
    // Update subscription in our database
    await Subscription.findOneAndUpdate(
      { subscriptionId: stripeSubscription.id },
      { 
        status: 'canceled',
        canceledAt: new Date()
      }
    );
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Validation schemas for advertising payment system
const createSessionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  paymentMethod: z.enum(['stripe', 'paypal']),
  successUrl: z.string().url("Valid success URL is required"),
  cancelUrl: z.string().url("Valid cancel URL is required")
});

const verifyPaymentSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  paymentMethod: z.enum(['stripe', 'paypal'])
});

const updatePurchaseSchema = z.object({
  toolId: z.string().optional(),
  toolName: z.string().optional(),
  toolUrl: z.string().url().optional(),
  notes: z.string().optional()
});

// Create payment session (advertising system)
handler.post('/create-session', async (req, res) => {
  try {
    console.log('POST /api/payments/create-session - Creating payment session:', JSON.stringify(req.body));
    await connectDB();

    const validatedData = createSessionSchema.parse(req.body);
    const { planId, paymentMethod, successUrl, cancelUrl } = validatedData;

    // Get the advertising plan
    const plan = await AdvertisingPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Advertising plan not found or inactive' });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();

    if (paymentMethod === 'stripe') {
      if (!plan.stripePriceId) {
        return res.status(400).json({ error: 'Stripe payment not available for this plan' });
      }

      // Check if Stripe is enabled and configured
      const stripeConfig = paymentSettings.getCurrentStripeConfig();
      if (!stripeConfig) {
        return res.status(400).json({ error: 'Stripe is not configured. Please contact administrator.' });
      }

      // Create Stripe checkout session with configured settings
      const stripe = await getConfiguredStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          planId: plan._id.toString(),
          planName: plan.name,
          paymentMethod: 'stripe'
        },
      });

      return res.json({
        url: session.url,
        sessionId: session.id
      });
    } else if (paymentMethod === 'paypal') {
      if (!plan.paypalPlanId) {
        return res.status(400).json({ error: 'PayPal payment not available for this plan' });
      }

      // Check if PayPal is enabled and configured
      const paypalConfig = paymentSettings.getCurrentPayPalConfig();
      if (!paypalConfig) {
        return res.status(400).json({ error: 'PayPal is not configured. Please contact administrator.' });
      }

      // For PayPal, we'll create a simple redirect URL
      // In a real implementation, you'd integrate with PayPal SDK
      const paypalSession = {
        id: `paypal_${Date.now()}_${planId}`,
        url: `https://www.${paypalConfig.mode === 'sandbox' ? 'sandbox.' : ''}paypal.com/cgi-bin/webscr?cmd=_xclick&business=your-paypal-email&item_name=${encodeURIComponent(plan.name)}&amount=${plan.price}&currency_code=${plan.currency}&return=${encodeURIComponent(successUrl)}&cancel_return=${encodeURIComponent(cancelUrl)}`
      };

      return res.json({
        url: paypalSession.url,
        sessionId: paypalSession.id
      });
    }

    return res.status(400).json({ error: 'Invalid payment method' });
  } catch (error) {
    console.error('Error creating payment session:', error);
    
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
      error: 'Failed to create payment session' 
    });
  }
});

// Verify payment and create purchase record (advertising system)
handler.post('/verify-payment', async (req, res) => {
  try {
    console.log('POST /api/payments/verify-payment - Verifying payment:', JSON.stringify(req.body));
    await connectDB();

    const validatedData = verifyPaymentSchema.parse(req.body);
    const { sessionId, paymentMethod } = validatedData;

    let purchaseData: any = {};

    if (paymentMethod === 'stripe') {
      // Retrieve the session from Stripe using configured instance
      const stripe = await getConfiguredStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not completed' });
      }

      const planId = session.metadata?.planId;
      if (!planId) {
        return res.status(400).json({ error: 'Invalid session metadata' });
      }

      const plan = await AdvertisingPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      purchaseData = {
        userId: 'user_temp', // This should come from authentication
        userEmail: session.customer_details?.email || 'temp@example.com',
        planId: plan._id,
        planName: plan.name,
        amount: session.amount_total ? session.amount_total / 100 : plan.price,
        currency: session.currency?.toUpperCase() || plan.currency,
        paymentMethod: 'stripe',
        paymentId: session.payment_intent as string,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
        placement: plan.placement,
        features: plan.features,
        analytics: {
          impressions: 0,
          clicks: 0,
          ctr: 0
        }
      };
    } else if (paymentMethod === 'paypal') {
      // For PayPal, you'd verify the payment with PayPal API
      // This is a simplified implementation
      const [, timestamp, planId] = sessionId.split('_');
      
      const plan = await AdvertisingPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      purchaseData = {
        userId: 'user_temp', // This should come from authentication
        userEmail: 'temp@example.com', // This should come from PayPal verification
        planId: plan._id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        paymentMethod: 'paypal',
        paymentId: sessionId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
        placement: plan.placement,
        features: plan.features,
        analytics: {
          impressions: 0,
          clicks: 0,
          ctr: 0
        }
      };
    }

    // Create the purchase record
    const purchase = await AdvertisingPurchase.create(purchaseData);
    console.log('Created advertising purchase:', purchase._id.toString());

    return res.json({
      success: true,
      message: 'Payment verified and purchase created',
      data: purchase
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    
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
      error: 'Failed to verify payment' 
    });
  }
});

// Get user purchases
handler.get('/user-purchases', async (req, res) => {
  try {
    console.log('GET /api/payments/user-purchases - Fetching user purchases');
    await connectDB();
    
    // This should get userId from authentication
    const userId = 'user_temp'; // Placeholder
    
    const purchases = await AdvertisingPurchase.find({ userId }).sort({ createdAt: -1 });
    
    return res.json(purchases);
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Get single purchase
handler.get('/purchase/:id', async (req, res) => {
  try {
    console.log('GET /api/payments/purchase/:id - Fetching purchase:', req.params.id);
    await connectDB();
    
    const purchase = await AdvertisingPurchase.findById(req.params.id);
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    return res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return res.status(500).json({ error: 'Failed to fetch purchase' });
  }
});

// Update purchase
handler.patch('/purchase/:id', async (req, res) => {
  try {
    console.log('PATCH /api/payments/purchase/:id - Updating purchase:', req.params.id);
    await connectDB();

    const validatedData = updatePurchaseSchema.parse(req.body);
    
    const purchase = await AdvertisingPurchase.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    return res.json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    
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
      error: 'Failed to update purchase' 
    });
  }
});

// Stripe webhook handler for advertising payments
handler.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Get webhook secret from payment settings
    const paymentSettings = await getPaymentSettings();
    const stripeConfig = paymentSettings.getCurrentStripeConfig();
    const webhookSecret = stripeConfig?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    
    const stripe = await getConfiguredStripe();
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Payment succeeded:', session.id);
      // Additional processing if needed
      break;
    }
    default: {
      console.log(`Unhandled event type ${event.type}`);
      break;
    }
  }

  res.json({ received: true });
});

export const paymentsHandler = handler;

export default router; 