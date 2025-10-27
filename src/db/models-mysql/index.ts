// MySQL Models Index
// 모든 Sequelize 모델을 한 곳에서 import

import sequelize from '../mysql-connection.js';
import Tool from './Tool.js';
import User from './User.js';
import BlogPost from './BlogPost.js';
import NewsPost from './NewsPost.js';
import Review from './Review.js';
import ToolSubmission from './ToolSubmission.js';
import NewsletterSubscription from './NewsletterSubscription.js';

// 모델 관계 설정 (필요시)
// Tool.hasMany(Review, { foreignKey: 'toolId' });
// Review.belongsTo(Tool, { foreignKey: 'toolId' });

export {
  sequelize,
  Tool,
  User,
  BlogPost,
  NewsPost,
  Review,
  ToolSubmission,
  NewsletterSubscription,
};

// 모든 모델 동기화 함수
export async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ MySQL 데이터베이스 동기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 동기화 실패:', error);
    throw error;
  }
}

