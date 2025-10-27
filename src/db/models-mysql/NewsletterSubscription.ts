import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface NewsletterSubscriptionAttributes {
  id: number;
  email: string;
  status: 'active' | 'unsubscribed';
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsletterSubscriptionCreationAttributes extends Optional<NewsletterSubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class NewsletterSubscription extends Model<NewsletterSubscriptionAttributes, NewsletterSubscriptionCreationAttributes> implements NewsletterSubscriptionAttributes {
  public id!: number;
  public email!: string;
  public status!: 'active' | 'unsubscribed';
  public source!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NewsletterSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'unsubscribed'),
      allowNull: false,
      defaultValue: 'active',
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'website',
    },
  },
  {
    sequelize,
    tableName: 'newsletter_subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
        unique: true,
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default NewsletterSubscription;

