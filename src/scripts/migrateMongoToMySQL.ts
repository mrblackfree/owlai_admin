import { connectDB as connectMongo } from '../db/connection.js';
import { Tool as MongoTool } from '../db/models/Tool.js';
import { BlogPost as MongoBlogPost } from '../db/models/BlogPost.js';
import { NewsPost as MongoNewsPost } from '../db/models/NewsPost.js';
import { connectMySQL } from '../db/mysql-connection.js';
import { Tool as MySQLTool, BlogPost as MySQLBlogPost, NewsPost as MySQLNewsPost } from '../db/models-mysql/index.js';

/**
 * MongoDB → MySQL 데이터 마이그레이션 스크립트
 */

async function migrateTools() {
  console.log('\n📦 Tool 데이터 마이그레이션 시작...');
  
  const mongoTools = await MongoTool.find({});
  console.log(`   MongoDB에서 ${mongoTools.length}개의 도구를 찾았습니다.`);

  let migrated = 0;
  for (const mongoTool of mongoTools) {
    try {
      await MySQLTool.create({
        name: mongoTool.name,
        name_ko: (mongoTool as any).name_ko,
        slug: mongoTool.slug,
        description: mongoTool.description,
        description_ko: (mongoTool as any).description_ko,
        websiteUrl: mongoTool.websiteUrl,
        category: mongoTool.category,
        category_ko: (mongoTool as any).category_ko,
        tags: mongoTool.tags,
        tags_ko: (mongoTool as any).tags_ko,
        pricingType: mongoTool.pricing.type,
        startingPrice: mongoTool.pricing.startingPrice,
        features: mongoTool.features,
        features_ko: (mongoTool as any).features_ko,
        logo: mongoTool.logo,
        status: mongoTool.status as any,
        isTrending: mongoTool.isTrending,
        isNewTool: mongoTool.isNewTool,
        isUpcoming: mongoTool.isUpcoming,
        isTopRated: mongoTool.isTopRated,
        views: mongoTool.views,
        votes: mongoTool.votes,
        rating: mongoTool.rating,
        reviews: mongoTool.reviews,
      });
      migrated++;

      if (migrated % 10 === 0) {
        console.log(`   진행: ${migrated}/${mongoTools.length}`);
      }
    } catch (error) {
      console.error(`   ❌ Tool ${mongoTool.name} 마이그레이션 실패:`, error);
    }
  }

  console.log(`✅ Tool 마이그레이션 완료: ${migrated}/${mongoTools.length}\n`);
}

async function migrateBlogPosts() {
  console.log('📰 BlogPost 데이터 마이그레이션 시작...');
  
  const mongoPosts = await MongoBlogPost.find({});
  console.log(`   MongoDB에서 ${mongoPosts.length}개의 블로그 게시물을 찾았습니다.`);

  let migrated = 0;
  for (const post of mongoPosts) {
    try {
      await MySQLBlogPost.create({
        title: (post as any).title,
        title_ko: (post as any).title_ko,
        slug: (post as any).slug,
        excerpt: (post as any).excerpt,
        excerpt_ko: (post as any).excerpt_ko,
        content: (post as any).content,
        content_ko: (post as any).content_ko,
        date: (post as any).date,
        author: (post as any).author,
        category: (post as any).category,
        category_ko: (post as any).category_ko,
        readTime: (post as any).readTime,
        imageUrl: (post as any).imageUrl,
        tags: (post as any).tags,
        tags_ko: (post as any).tags_ko,
        status: (post as any).status,
        likes: (post as any).likes || 0,
        comments: (post as any).comments || 0,
      });
      migrated++;
    } catch (error) {
      console.error(`   ❌ BlogPost ${(post as any).title} 마이그레이션 실패:`, error);
    }
  }

  console.log(`✅ BlogPost 마이그레이션 완료: ${migrated}/${mongoPosts.length}\n`);
}

async function migrateNewsPosts() {
  console.log('📢 NewsPost 데이터 마이그레이션 시작...');
  
  const mongoPosts = await MongoNewsPost.find({});
  console.log(`   MongoDB에서 ${mongoPosts.length}개의 뉴스 게시물을 찾았습니다.`);

  let migrated = 0;
  for (const post of mongoPosts) {
    try {
      await MySQLNewsPost.create({
        title: (post as any).title,
        title_ko: (post as any).title_ko,
        slug: (post as any).slug,
        excerpt: (post as any).excerpt,
        excerpt_ko: (post as any).excerpt_ko,
        content: (post as any).content,
        content_ko: (post as any).content_ko,
        date: (post as any).date,
        author: (post as any).author,
        category: (post as any).category,
        category_ko: (post as any).category_ko,
        imageUrl: (post as any).imageUrl,
        tags: (post as any).tags,
        tags_ko: (post as any).tags_ko,
        status: (post as any).status,
        source: (post as any).source,
        sourceUrl: (post as any).sourceUrl,
        views: (post as any).views || 0,
        shares: (post as any).shares || 0,
      });
      migrated++;
    } catch (error) {
      console.error(`   ❌ NewsPost ${(post as any).title} 마이그레이션 실패:`, error);
    }
  }

  console.log(`✅ NewsPost 마이그레이션 완료: ${migrated}/${mongoPosts.length}\n`);
}

async function main() {
  console.log('🔄 MongoDB → MySQL 데이터 마이그레이션\n');
  console.log('=' .repeat(50));

  try {
    // MongoDB 연결
    console.log('\n📌 MongoDB 연결 중...');
    await connectMongo();
    console.log('✅ MongoDB 연결 성공');

    // MySQL 연결
    console.log('\n📌 MySQL 연결 중...');
    await connectMySQL();
    console.log('✅ MySQL 연결 성공');

    // 마이그레이션 실행
    await migrateTools();
    await migrateBlogPosts();
    await migrateNewsPosts();

    console.log('=' .repeat(50));
    console.log('\n🎉 모든 데이터 마이그레이션 완료!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

