import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface PaymentSettingsAttributes {
  id: number;
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;
  stripeMode: 'test' | 'live';
  paypalClientId?: string;
  paypalClientSecret?: string;
  paypalMode: 'sandbox' | 'live';
  enabledProviders: string[];
  defaultCurrency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentSettingsCreationAttributes extends Optional<PaymentSettingsAttributes, 'id' | 'stripeSecretKey' | 'stripePublishableKey' | 'stripeWebhookSecret' | 'paypalClientId' | 'paypalClientSecret' | 'createdAt' | 'updatedAt'> {}

class PaymentSettings extends Model<PaymentSettingsAttributes, PaymentSettingsCreationAttributes> implements PaymentSettingsAttributes {
  public id!: number;
  public stripeSecretKey?: string;
  public stripePublishableKey?: string;
  public stripeWebhookSecret?: string;
  public stripeMode!: 'test' | 'live';
  public paypalClientId?: string;
  public paypalClientSecret?: string;
  public paypalMode!: 'sandbox' | 'live';
  public enabledProviders!: string[];
  public defaultCurrency!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PaymentSettings.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    stripeSecretKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    stripePublishableKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    stripeWebhookSecret: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    stripeMode: {
      type: DataTypes.ENUM('test', 'live'),
      allowNull: false,
      defaultValue: 'test',
    },
    paypalClientId: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    paypalClientSecret: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    paypalMode: {
      type: DataTypes.ENUM('sandbox', 'live'),
      allowNull: false,
      defaultValue: 'sandbox',
    },
    enabledProviders: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    defaultCurrency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD',
    },
  },
  {
    sequelize,
    tableName: 'payment_settings',
    timestamps: true,
  }
);

export default PaymentSettings;

