import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

// Tool 인터페이스
interface ToolAttributes {
  id: number;
  name: string;
  name_ko?: string;
  slug: string;
  description: string;
  description_ko?: string;
  websiteUrl: string;
  category: string;
  category_ko?: string;
  tags?: string[];
  tags_ko?: string[];
  pricingType: 'free' | 'freemium' | 'paid' | 'enterprise';
  startingPrice?: number;
  features?: string[];
  features_ko?: string[];
  logo?: string;
  status: 'draft' | 'published' | 'archived' | 'pending' | 'approved' | 'rejected';
  isTrending: boolean;
  isNewTool: boolean;
  isUpcoming: boolean;
  isTopRated: boolean;
  views: number;
  votes: number;
  rating: number;
  reviews: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ToolCreationAttributes extends Optional<ToolAttributes, 'id' | 'name_ko' | 'description_ko' | 'category_ko' | 'tags' | 'tags_ko' | 'startingPrice' | 'features' | 'features_ko' | 'logo' | 'createdAt' | 'updatedAt'> {}

// Sequelize 모델 클래스
class Tool extends Model<ToolAttributes, ToolCreationAttributes> implements ToolAttributes {
  public id!: number;
  public name!: string;
  public name_ko?: string;
  public slug!: string;
  public description!: string;
  public description_ko?: string;
  public websiteUrl!: string;
  public category!: string;
  public category_ko?: string;
  public tags?: string[];
  public tags_ko?: string[];
  public pricingType!: 'free' | 'freemium' | 'paid' | 'enterprise';
  public startingPrice?: number;
  public features?: string[];
  public features_ko?: string[];
  public logo?: string;
  public status!: 'draft' | 'published' | 'archived' | 'pending' | 'approved' | 'rejected';
  public isTrending!: boolean;
  public isNewTool!: boolean;
  public isUpcoming!: boolean;
  public isTopRated!: boolean;
  public views!: number;
  public votes!: number;
  public rating!: number;
  public reviews!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 모델 초기화
Tool.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    name_ko: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    description_ko: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    websiteUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true,
      }
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category_ko: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    tags_ko: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    pricingType: {
      type: DataTypes.ENUM('free', 'freemium', 'paid', 'enterprise'),
      allowNull: false,
      defaultValue: 'free',
    },
    startingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    features_ko: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    isTrending: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isNewTool: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isUpcoming: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isTopRated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    views: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    votes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reviews: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'tools',
    timestamps: true,
    indexes: [
      {
        fields: ['slug'],
        unique: true,
      },
      {
        fields: ['category'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['isTrending'],
      },
      {
        fields: ['isNewTool'],
      },
      {
        fields: ['rating'],
      },
      {
        fields: ['views'],
      },
    ],
  }
);

export default Tool;

