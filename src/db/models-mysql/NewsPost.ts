import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface AuthorAttributes {
  name: string;
  avatar: string;
}

interface NewsPostAttributes {
  id: number;
  title: string;
  title_ko?: string;
  slug: string;
  excerpt: string;
  excerpt_ko?: string;
  content: string;
  content_ko?: string;
  date: string;
  author: AuthorAttributes;
  category: string;
  category_ko?: string;
  imageUrl: string;
  tags?: string[];
  tags_ko?: string[];
  status: 'draft' | 'published';
  source: string;
  sourceUrl: string;
  views: number;
  shares: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsPostCreationAttributes extends Optional<NewsPostAttributes, 'id' | 'title_ko' | 'excerpt_ko' | 'content_ko' | 'category_ko' | 'tags' | 'tags_ko' | 'views' | 'shares' | 'createdAt' | 'updatedAt'> {}

class NewsPost extends Model<NewsPostAttributes, NewsPostCreationAttributes> implements NewsPostAttributes {
  public id!: number;
  public title!: string;
  public title_ko?: string;
  public slug!: string;
  public excerpt!: string;
  public excerpt_ko?: string;
  public content!: string;
  public content_ko?: string;
  public date!: string;
  public author!: AuthorAttributes;
  public category!: string;
  public category_ko?: string;
  public imageUrl!: string;
  public tags?: string[];
  public tags_ko?: string[];
  public status!: 'draft' | 'published';
  public source!: string;
  public sourceUrl!: string;
  public views!: number;
  public shares!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NewsPost.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    title_ko: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt_ko: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    content_ko: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    date: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    author: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category_ko: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
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
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    },
    source: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    sourceUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    views: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    shares: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'news_posts',
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
        type: 'FULLTEXT',
        fields: ['title', 'excerpt', 'content'],
      },
    ],
  }
);

export default NewsPost;

