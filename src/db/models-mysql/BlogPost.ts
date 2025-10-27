import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql-connection.js';

interface AuthorAttributes {
  name: string;
  avatar: string;
}

interface BlogPostAttributes {
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
  readTime: string;
  imageUrl: string;
  tags?: string[];
  tags_ko?: string[];
  status: 'draft' | 'published';
  likes: number;
  comments: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BlogPostCreationAttributes extends Optional<BlogPostAttributes, 'id' | 'title_ko' | 'excerpt_ko' | 'content_ko' | 'category_ko' | 'tags' | 'tags_ko' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'> {}

class BlogPost extends Model<BlogPostAttributes, BlogPostCreationAttributes> implements BlogPostAttributes {
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
  public readTime!: string;
  public imageUrl!: string;
  public tags?: string[];
  public tags_ko?: string[];
  public status!: 'draft' | 'published';
  public likes!: number;
  public comments!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BlogPost.init(
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
    readTime: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
    likes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    comments: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'blog_posts',
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

export default BlogPost;

