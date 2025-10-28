import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface AdvertisingPurchaseAttributes {
  id: number;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal';
  paymentId: string;
  status: 'active' | 'expired' | 'cancelled';
  placement: string;
  startDate: Date;
  endDate: Date;
  toolId?: string;
  toolName?: string;
  toolUrl?: string;
  notes?: string;
  impressions: number;
  clicks: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdvertisingPurchaseCreationAttributes extends Optional<AdvertisingPurchaseAttributes, 'id' | 'toolId' | 'toolName' | 'toolUrl' | 'notes' | 'impressions' | 'clicks' | 'createdAt' | 'updatedAt'> {}

class AdvertisingPurchase extends Model<AdvertisingPurchaseAttributes, AdvertisingPurchaseCreationAttributes> implements AdvertisingPurchaseAttributes {
  public id!: number;
  public userId!: string;
  public userEmail!: string;
  public planId!: string;
  public planName!: string;
  public amount!: number;
  public currency!: string;
  public paymentMethod!: 'stripe' | 'paypal';
  public paymentId!: string;
  public status!: 'active' | 'expired' | 'cancelled';
  public placement!: string;
  public startDate!: Date;
  public endDate!: Date;
  public toolId?: string;
  public toolName?: string;
  public toolUrl?: string;
  public notes?: string;
  public impressions!: number;
  public clicks!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdvertisingPurchase.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    userEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    planId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    planName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD',
    },
    paymentMethod: {
      type: DataTypes.ENUM('stripe', 'paypal'),
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
    placement: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    toolId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    toolName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    toolUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    impressions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    clicks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'advertising_purchases',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['paymentId'],
        unique: true,
      },
    ],
  }
);

export default AdvertisingPurchase;

