import mongoose from 'mongoose';

interface IPaymentConfig {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}

interface IPayPalConfig {
  clientId?: string;
  clientSecret?: string;
  webhookId?: string;
}

interface IPaymentSettings extends mongoose.Document {
  stripe: {
    enabled: boolean;
    mode: 'test' | 'live';
    test: IPaymentConfig;
    live: IPaymentConfig;
  };
  paypal: {
    enabled: boolean;
    mode: 'sandbox' | 'live';
    sandbox: IPayPalConfig;
    live: IPayPalConfig;
  };
  currency: string;
  lastUpdated: Date;
  updatedBy?: string;
  environment: 'development' | 'production';
  getCurrentStripeConfig(): any;
  getCurrentPayPalConfig(): any;
  validateConfiguration(): { isValid: boolean; errors: string[] };
}

interface IPaymentSettingsModel extends mongoose.Model<IPaymentSettings> {
  getSettings(): Promise<IPaymentSettings>;
}

const paymentSettingsSchema = new mongoose.Schema({
  // Stripe Configuration
  stripe: {
    enabled: { type: Boolean, default: false },
    mode: { type: String, enum: ['test', 'live'], default: 'test' },
    test: {
      publishableKey: { type: String },
      secretKey: { type: String },
      webhookSecret: { type: String }
    },
    live: {
      publishableKey: { type: String },
      secretKey: { type: String },
      webhookSecret: { type: String }
    }
  },
  
  // PayPal Configuration
  paypal: {
    enabled: { type: Boolean, default: false },
    mode: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
    sandbox: {
      clientId: { type: String },
      clientSecret: { type: String },
      webhookId: { type: String }
    },
    live: {
      clientId: { type: String },
      clientSecret: { type: String },
      webhookId: { type: String }
    }
  },
  
  // General Settings
  currency: { type: String, default: 'USD' },
  
  // Security and metadata
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String }, // User ID who last updated
  
  // Environment check
  environment: { type: String, enum: ['development', 'production'], default: 'development' }
}, {
  timestamps: true
});

// Ensure only one payment settings document exists
paymentSettingsSchema.index({}, { unique: true });

// Static method to get or create payment settings
paymentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Instance method to get current Stripe configuration
paymentSettingsSchema.methods.getCurrentStripeConfig = function() {
  if (!this.stripe.enabled) return null;
  
  const config = this.stripe.mode === 'test' ? this.stripe.test : this.stripe.live;
  return {
    publishableKey: config.publishableKey,
    secretKey: config.secretKey,
    webhookSecret: config.webhookSecret,
    mode: this.stripe.mode
  };
};

// Instance method to get current PayPal configuration
paymentSettingsSchema.methods.getCurrentPayPalConfig = function() {
  if (!this.paypal.enabled) return null;
  
  const config = this.paypal.mode === 'sandbox' ? this.paypal.sandbox : this.paypal.live;
  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    webhookId: config.webhookId,
    mode: this.paypal.mode
  };
};

// Instance method to validate configuration
paymentSettingsSchema.methods.validateConfiguration = function() {
  const errors = [];
  
  if (this.stripe.enabled) {
    const stripeConfig = this.getCurrentStripeConfig();
    if (!stripeConfig.secretKey) errors.push('Stripe secret key is required');
    if (!stripeConfig.publishableKey) errors.push('Stripe publishable key is required');
    if (!stripeConfig.webhookSecret) errors.push('Stripe webhook secret is required');
  }
  
  if (this.paypal.enabled) {
    const paypalConfig = this.getCurrentPayPalConfig();
    if (!paypalConfig.clientId) errors.push('PayPal client ID is required');
    if (!paypalConfig.clientSecret) errors.push('PayPal client secret is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const PaymentSettings = mongoose.model<IPaymentSettings, IPaymentSettingsModel>('PaymentSettings', paymentSettingsSchema); 