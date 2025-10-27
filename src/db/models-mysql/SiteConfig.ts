import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface SiteConfigAttributes {
  id: number;
  siteName: string;
  siteDescription: string;
  logo?: string;
  logoLight?: string;
  logoDark?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  allowUserRegistration: boolean;
  allowUserSubmissions: boolean;
  requireApprovalForSubmissions: boolean;
  requireApprovalForReviews: boolean;
  footerText: string;
  contactEmail: string;
  socialLinks: any;
  analyticsId?: string;
  customCss?: string;
  customJs?: string;
  metaTags: any;
  defaultTheme: string;
  allowThemeToggle: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SiteConfigCreationAttributes extends Optional<SiteConfigAttributes, 'id' | 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'analyticsId' | 'customCss' | 'customJs' | 'createdAt' | 'updatedAt'> {}

class SiteConfig extends Model<SiteConfigAttributes, SiteConfigCreationAttributes> implements SiteConfigAttributes {
  public id!: number;
  public siteName!: string;
  public siteDescription!: string;
  public logo?: string;
  public logoLight?: string;
  public logoDark?: string;
  public favicon?: string;
  public primaryColor!: string;
  public secondaryColor!: string;
  public allowUserRegistration!: boolean;
  public allowUserSubmissions!: boolean;
  public requireApprovalForSubmissions!: boolean;
  public requireApprovalForReviews!: boolean;
  public footerText!: string;
  public contactEmail!: string;
  public socialLinks!: any;
  public analyticsId?: string;
  public customCss?: string;
  public customJs?: string;
  public metaTags!: any;
  public defaultTheme!: string;
  public allowThemeToggle!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SiteConfig.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    siteName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'AI Tool Finder',
    },
    siteDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    logoLight: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    logoDark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    favicon: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    primaryColor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#10b981',
    },
    secondaryColor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#3b82f6',
    },
    allowUserRegistration: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowUserSubmissions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    requireApprovalForSubmissions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    requireApprovalForReviews: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    footerText: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    socialLinks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    analyticsId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customCss: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customJs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metaTags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    defaultTheme: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'system',
    },
    allowThemeToggle: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'site_config',
    timestamps: true,
  }
);

export default SiteConfig;

