import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface ToolSubmissionAttributes {
  id: number;
  toolName: string;
  description: string;
  websiteUrl: string;
  logoUrl?: string;
  category: string;
  pricingType: string;
  keyHighlights?: string[];
  submittedBy: string;
  submitterEmail: string;
  twitterUrl?: string;
  githubUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ToolSubmissionCreationAttributes extends Optional<ToolSubmissionAttributes, 'id' | 'logoUrl' | 'keyHighlights' | 'twitterUrl' | 'githubUrl' | 'reviewNotes' | 'createdAt' | 'updatedAt'> {}

class ToolSubmission extends Model<ToolSubmissionAttributes, ToolSubmissionCreationAttributes> implements ToolSubmissionAttributes {
  public id!: number;
  public toolName!: string;
  public description!: string;
  public websiteUrl!: string;
  public logoUrl?: string;
  public category!: string;
  public pricingType!: string;
  public keyHighlights?: string[];
  public submittedBy!: string;
  public submitterEmail!: string;
  public twitterUrl?: string;
  public githubUrl?: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public reviewNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ToolSubmission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    toolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    websiteUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pricingType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    keyHighlights: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    submittedBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    submitterEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    twitterUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    githubUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tool_submissions',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['submittedBy'],
      },
    ],
  }
);

export default ToolSubmission;

