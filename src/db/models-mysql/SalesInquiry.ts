import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface SalesInquiryAttributes {
  id: number;
  fullName: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  budget?: string;
  timeline?: string;
  status: 'new' | 'contacted' | 'closed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SalesInquiryCreationAttributes extends Optional<SalesInquiryAttributes, 'id' | 'company' | 'phone' | 'budget' | 'timeline' | 'notes' | 'createdAt' | 'updatedAt'> {}

class SalesInquiry extends Model<SalesInquiryAttributes, SalesInquiryCreationAttributes> implements SalesInquiryAttributes {
  public id!: number;
  public fullName!: string;
  public email!: string;
  public company?: string;
  public phone?: string;
  public message!: string;
  public budget?: string;
  public timeline?: string;
  public status!: 'new' | 'contacted' | 'closed';
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SalesInquiry.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      }
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    budget: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    timeline: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'closed'),
      allowNull: false,
      defaultValue: 'new',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sales_inquiries',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['email'],
      },
    ],
  }
);

export default SalesInquiry;

