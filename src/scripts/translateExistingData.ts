import { connectDB } from '../db/connection.js';
import { Tool } from '../db/models/Tool.js';
import { BlogPost } from '../db/models/BlogPost.js';
import { NewsPost } from '../db/models/NewsPost.js';

// 카테고리 번역 맵
const categoryTranslations: Record<string, string> = {
  "Writing & Content Creation": "글쓰기 및 콘텐츠 제작",
  "Image Generation & Editing": "이미지 생성 및 편집",
  "Video Creation & Editing": "비디오 제작 및 편집",
  "Code & Development": "코드 및 개발",
  "Productivity & Automation": "생산성 및 자동화",
  "Business & Marketing": "비즈니스 및 마케팅",
  "Research & Analysis": "리서치 및 분석",
  "Communication & Chat": "커뮤니케이션 및 채팅",
  "Education & Learning": "교육 및 학습",
  "Design & Creative": "디자인 및 창작",
  "Audio & Music": "오디오 및 음악",
  "Data & Analytics": "데이터 및 분석",
  "Social Media": "소셜 미디어",
  "SEO & Web": "SEO 및 웹",
  "Healthcare & Wellness": "헬스케어 및 웰빙",
  "Finance & Trading": "금융 및 트레이딩",
  "Gaming & Entertainment": "게임 및 엔터테인먼트",
  "Translation & Language": "번역 및 언어",
  "Other": "기타"
};

// 태그 번역 맵
const tagTranslations: Record<string, string> = {
  "AI": "인공지능",
  "Machine Learning": "머신러닝",
  "GPT": "GPT",
  "Neural Networks": "신경망",
  "Deep Learning": "딥러닝",
  "NLP": "자연어처리",
  "Computer Vision": "컴퓨터 비전",
  "Automation": "자동화",
  "No-Code": "노코드",
  "API": "API",
  "Free": "무료",
  "Freemium": "프리미엄",
  "Paid": "유료",
  "Enterprise": "기업용"
};

// Google Translate API를 사용한 자동 번역 함수 (간단한 버전)
// 실제 구현 시 Google Translate API 또는 DeepL API 사용 권장
async function translateText(text: string, fromLang: string = 'en', toLang: string = 'ko'): Promise<string> {
  // 이 함수는 실제로는 Google Translate API나 DeepL API를 호출해야 합니다
  // 현재는 간단한 매핑만 사용
  
  // 카테고리 번역 확인
  if (categoryTranslations[text]) {
    return categoryTranslations[text];
  }
  
  // 태그 번역 확인
  if (tagTranslations[text]) {
    return tagTranslations[text];
  }
  
  // TODO: 실제 API 호출
  // const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     q: text,
  //     source: fromLang,
  //     target: toLang,
  //     format: 'text'
  //   })
  // });
  // const data = await response.json();
  // return data.data.translations[0].translatedText;
  
  console.log(`[번역 필요] "${text}" - 수동 번역 필요`);
  return text; // 번역 안 된 경우 원문 반환
}

// Tool 데이터 번역
async function translateTools() {
  console.log('🔄 Tool 데이터 번역 시작...');
  
  const tools = await Tool.find({});
  console.log(`총 ${tools.length}개의 도구를 찾았습니다.`);
  
  let translated = 0;
  let skipped = 0;
  
  for (const tool of tools) {
    try {
      // 이미 한글 필드가 있으면 스킵
      if (tool.name_ko) {
        skipped++;
        continue;
      }
      
      // 카테고리 번역
      const categoryKo = categoryTranslations[tool.category] || tool.category;
      
      // 태그 번역
      const tagsKo = tool.tags?.map((tag: string) => tagTranslations[tag] || tag) || [];
      
      // 업데이트 (name, description, features는 수동 번역 필요)
      await Tool.findByIdAndUpdate(tool._id, {
        $set: {
          category_ko: categoryKo,
          tags_ko: tagsKo,
          // name_ko와 description_ko, features_ko는 수동으로 추가 필요
          // 또는 Google Translate API 사용
        }
      });
      
      translated++;
      
      if (translated % 10 === 0) {
        console.log(`진행 중: ${translated}/${tools.length} 완료`);
      }
    } catch (error) {
      console.error(`Tool ${tool._id} 번역 실패:`, error);
    }
  }
  
  console.log(`✅ Tool 번역 완료: ${translated}개 번역됨, ${skipped}개 스킵됨`);
}

// BlogPost 데이터 번역
async function translateBlogPosts() {
  console.log('🔄 BlogPost 데이터 번역 시작...');
  
  const posts = await BlogPost.find({});
  console.log(`총 ${posts.length}개의 블로그 게시물을 찾았습니다.`);
  
  let translated = 0;
  let skipped = 0;
  
  for (const post of posts) {
    try {
      // 이미 한글 필드가 있으면 스킵
      if ((post as any).title_ko) {
        skipped++;
        continue;
      }
      
      // 카테고리 번역
      const categoryKo = categoryTranslations[(post as any).category] || (post as any).category;
      
      // 태그 번역
      const tagsKo = (post as any).tags?.map((tag: string) => tagTranslations[tag] || tag) || [];
      
      // 업데이트
      await BlogPost.findByIdAndUpdate((post as any)._id, {
        $set: {
          category_ko: categoryKo,
          tags_ko: tagsKo,
          // title_ko, excerpt_ko, content_ko는 Google Translate API로 번역 필요
        }
      });
      
      translated++;
    } catch (error) {
      console.error(`BlogPost ${(post as any)._id} 번역 실패:`, error);
    }
  }
  
  console.log(`✅ BlogPost 번역 완료: ${translated}개 번역됨, ${skipped}개 스킵됨`);
}

// NewsPost 데이터 번역
async function translateNewsPosts() {
  console.log('🔄 NewsPost 데이터 번역 시작...');
  
  const posts = await NewsPost.find({});
  console.log(`총 ${posts.length}개의 뉴스 게시물을 찾았습니다.`);
  
  let translated = 0;
  let skipped = 0;
  
  for (const post of posts) {
    try {
      // 이미 한글 필드가 있으면 스킵
      if ((post as any).title_ko) {
        skipped++;
        continue;
      }
      
      // 카테고리 번역
      const categoryKo = categoryTranslations[(post as any).category] || (post as any).category;
      
      // 태그 번역
      const tagsKo = (post as any).tags?.map((tag: string) => tagTranslations[tag] || tag) || [];
      
      // 업데이트
      await NewsPost.findByIdAndUpdate((post as any)._id, {
        $set: {
          category_ko: categoryKo,
          tags_ko: tagsKo,
          // title_ko, excerpt_ko, content_ko는 Google Translate API로 번역 필요
        }
      });
      
      translated++;
    } catch (error) {
      console.error(`NewsPost ${(post as any)._id} 번역 실패:`, error);
    }
  }
  
  console.log(`✅ NewsPost 번역 완료: ${translated}개 번역됨, ${skipped}개 스킵됨`);
}

// 메인 실행 함수
async function main() {
  console.log('🚀 데이터 번역 마이그레이션 시작...\n');
  
  try {
    await connectDB();
    console.log('✅ MongoDB 연결 성공\n');
    
    await translateTools();
    console.log('');
    
    await translateBlogPosts();
    console.log('');
    
    await translateNewsPosts();
    console.log('');
    
    console.log('🎉 모든 번역 작업 완료!');
    console.log('\n⚠️  주의: name, title, description, content 필드는 수동 번역 또는 Google Translate API 연동이 필요합니다.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 번역 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { translateTools, translateBlogPosts, translateNewsPosts };

