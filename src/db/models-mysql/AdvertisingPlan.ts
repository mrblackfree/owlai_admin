import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface AdvertisingPlanAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
  placement: string;
  features: string[];
  stripePriceId?: string;
  paypalPlanId?: string;
  isPopular: boolean;
  status: 'active' | 'inactive';
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdvertisingPlanCreationAttributes extends Optional<AdvertisingPlanAttributes, 'id' | 'stripePriceId' | 'paypalPlanId' | 'isPopular' | 'displayOrder' | 'createdAt' | 'updatedAt'> {}

class AdvertisingPlan extends Model<AdvertisingPlanAttributes, AdvertisingPlanCreationAttributes> implements AdvertisingPlanAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public currency!: string;
  public duration!: number;
  public durationUnit!: 'days' | 'weeks' | 'months';
  public placement!: string;
  public features!: string[];
  public stripePriceId?: string;
  public paypalPlanId?: string;
  public isPopular!: boolean;
  public status!: 'active' | 'inactive';
  public displayOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdvertisingPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    durationUnit: {
      type: DataTypes.ENUM('days', 'weeks', 'months'),
      allowNull: false,
      defaultValue: 'months',
    },
    placement: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    stripePriceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    paypalPlanId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isPopular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'advertising_plans',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['displayOrder'],
      },
    ],
  }
);

export default AdvertisingPlan;

