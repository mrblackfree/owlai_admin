import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// MySQL 연결 설정
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'ai_tool_finder',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    }
  }
);

// 연결 테스트
export async function connectMySQL() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL 연결 성공');
    
    // 개발 환경에서는 자동으로 테이블 동기화
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ MySQL 테이블 동기화 완료');
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error);
    throw error;
  }
}

export default sequelize;

