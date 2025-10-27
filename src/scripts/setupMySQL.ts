import { connectMySQL } from '../db/mysql-connection.js';
import { syncDatabase } from '../db/models-mysql/index.js';

/**
 * MySQL 데이터베이스 초기 설정 스크립트
 * - 데이터베이스 연결 테스트
 * - 모든 테이블 생성
 */

async function setupMySQL() {
  console.log('🚀 MySQL 데이터베이스 초기 설정 시작...\n');

  try {
    // 1. MySQL 연결 테스트
    console.log('1️⃣  MySQL 연결 테스트 중...');
    const sequelize = await connectMySQL();
    console.log('✅ MySQL 연결 성공!\n');

    // 2. 데이터베이스 및 테이블 생성
    console.log('2️⃣  MySQL 테이블 생성 중...');
    await syncDatabase(false); // force: false = 기존 데이터 유지
    console.log('✅ 모든 테이블 생성 완료!\n');

    // 3. 생성된 테이블 목록 확인
    console.log('3️⃣  생성된 테이블 목록:');
    const [results]: any = await sequelize.query('SHOW TABLES');
    results.forEach((row: any, index: number) => {
      const tableName = Object.values(row)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    console.log('\n🎉 MySQL 데이터베이스 설정 완료!');
    console.log('\n📋 다음 단계:');
    console.log('   1. MongoDB 데이터 Export');
    console.log('   2. 데이터 변환 스크립트 실행');
    console.log('   3. MySQL로 Import');
    console.log('   4. API 엔드포인트를 Sequelize로 변환\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
setupMySQL();

