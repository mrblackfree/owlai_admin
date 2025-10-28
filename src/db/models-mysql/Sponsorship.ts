import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface SponsorshipAttributes {
  id: number;
  toolId: string;
  toolName: string;
  toolUrl: string;
  logoUrl?: string;
  description: string;
  placement: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'paused';
  impressions: number;
  clicks: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SponsorshipCreationAttributes extends Optional<SponsorshipAttributes, 'id' | 'logoUrl' | 'impressions' | 'clicks' | 'createdAt' | 'updatedAt'> {}

class Sponsorship extends Model<SponsorshipAttributes, SponsorshipCreationAttributes> implements SponsorshipAttributes {
  public id!: number;
  public toolId!: string;
  public toolName!: string;
  public toolUrl!: string;
  public logoUrl?: string;
  public description!: string;
  public placement!: string;
  public startDate!: Date;
  public endDate!: Date;
  public status!: 'active' | 'expired' | 'paused';
  public impressions!: number;
  public clicks!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sponsorship.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    toolId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    toolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    toolUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    status: {
      type: DataTypes.ENUM('active', 'expired', 'paused'),
      allowNull: false,
      defaultValue: 'active',
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
    tableName: 'sponsorships',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['placement'],
      },
      {
        fields: ['startDate', 'endDate'],
      },
    ],
  }
);

export default Sponsorship;

