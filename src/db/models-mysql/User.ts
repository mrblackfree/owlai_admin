import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface UserAttributes {
  id: number;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  customUsername?: string;
  avatarUrl?: string;
  avatarStyle?: string;
  bio?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  savedTools?: string[];
  upvotedTools?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'firstName' | 'lastName' | 'displayName' | 'customUsername' | 'avatarUrl' | 'avatarStyle' | 'bio' | 'savedTools' | 'upvotedTools' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public clerkId!: string;
  public email!: string;
  public firstName?: string;
  public lastName?: string;
  public displayName?: string;
  public customUsername?: string;
  public avatarUrl?: string;
  public avatarStyle?: string;
  public bio?: string;
  public role!: 'user' | 'admin';
  public status!: 'active' | 'inactive' | 'banned';
  public savedTools?: string[];
  public upvotedTools?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    clerkId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customUsername: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    avatarStyle: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'avataaars',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      allowNull: false,
      defaultValue: 'active',
    },
    savedTools: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    upvotedTools: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        fields: ['clerkId'],
        unique: true,
      },
      {
        fields: ['email'],
        unique: true,
      },
      {
        fields: ['role'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default User;

