# MySQL 마이그레이션 가이드

## ✅ 완료된 작업

1. ✅ Sequelize ORM 설치 (`npm install sequelize mysql2`)
2. ✅ MySQL 연결 설정 생성 (`src/db/mysql-connection.ts`)
3. ✅ Tool 모델 Sequelize 버전 생성 (`src/db/models-mysql/Tool.ts`)

---

## 📋 남은 작업 (대략 2-3일 소요)

### Phase 1: 데이터베이스 모델 변환 (8-10시간)

나머지 13개 모델을 Sequelize로 변환:

- [ ] BlogPost.ts
- [ ] NewsPost.ts
- [ ] User.ts
- [ ] Review.ts
- [ ] ToolSubmission.ts
- [ ] SalesInquiry.ts
- [ ] NewsletterSubscription.ts
- [ ] SiteConfig.ts
- [ ] Sponsorship.ts
- [ ] Subscription.ts
- [ ] AdvertisingPlan.ts
- [ ] AdvertisingPurchase.ts
- [ ] PaymentSettings.ts

### Phase 2: API 엔드포인트 수정 (10-12시간)

모든 API 파일의 쿼리를 Sequelize로 변환:

- [ ] src/api/tools.ts (가장 복잡, 500+ 줄)
- [ ] src/api/blog.ts
- [ ] src/api/news.ts
- [ ] src/api/users.ts
- [ ] src/api/reviews.ts
- [ ] src/api/toolSubmissions.ts
- [ ] src/api/salesInquiries.ts
- [ ] src/api/newsletter.ts
- [ ] src/api/config.ts
- [ ] src/api/payments.ts
- [ ] src/api/paymentSettings.ts
- [ ] src/api/sponsorships.ts
- [ ] src/api/advertisingPlans.ts
- [ ] src/api/webhooks.ts

### Phase 3: cPanel 배포 설정 (2-3시간)

- [ ] cPanel에서 MySQL 데이터베이스 생성
- [ ] cPanel Node.js 앱 설정
- [ ] 환경 변수 설정
- [ ] PM2 또는 Forever 설정
- [ ] 프론트엔드 빌드 및 업로드
- [ ] .htaccess 설정
- [ ] SSL 인증서 설정

### Phase 4: 데이터 마이그레이션 (3-4시간)

- [ ] MongoDB 데이터 Export
- [ ] MySQL 스키마 생성
- [ ] 데이터 변환 스크립트 작성
- [ ] MySQL로 Import
- [ ] 데이터 검증

### Phase 5: 테스트 및 디버깅 (4-6시간)

- [ ] 모든 API 엔드포인트 테스트
- [ ] CRUD 기능 테스트
- [ ] 인증 및 권한 테스트
- [ ] 성능 테스트
- [ ] 버그 수정

---

## 🚀 빠른 시작 옵션

### 옵션 A: 현재 MongoDB + Vercel 환경 유지 (권장)

**장점:**
- ✅ 이미 90% 작동 중
- ✅ CORS 문제만 해결하면 완료
- ✅ 한글화 45% 완료
- ✅ 즉시 사용 가능

**다음 단계:**
- CORS 문제 해결 (5분)
- 한글화 완성 (2-3시간)
- 프로덕션 Clerk 키로 전환 (10분)

### 옵션 B: MySQL 전환 (2-3일 소요)

**필요한 시간:**
- 모델 변환: 8-10시간
- API 수정: 10-12시간
- 배포 설정: 2-3시간
- 마이그레이션: 3-4시간
- 테스트: 4-6시간

**총 예상: 27-35시간 (3-4일)**

### 옵션 C: 하이브리드 (단계적 전환)

1. 현재 환경으로 먼저 완성
2. 사용하면서 백그라운드에서 MySQL 버전 개발
3. 준비되면 전환

---

## 💡 추천

**지금 즉시:** MongoDB + Vercel 환경의 CORS 문제만 해결하면 5분 안에 완전히 작동합니다!

**그 후:** 천천히 MySQL 버전을 개발하여 나중에 이전

어떻게 진행하시겠습니까? 🤔

