# cPanel 공유 호스팅 배포 가이드

## 🎯 준비 사항

### 필요한 것:
- ✅ cPanel 계정
- ✅ Node.js 지원 (cPanel Node.js Selector)
- ✅ MySQL 데이터베이스
- ✅ SSH 접근 (선택사항, PM2 사용 시)
- ✅ FTP/파일 관리자 접근

---

## 📦 Step 1: MySQL 데이터베이스 생성

### cPanel에서:

1. **MySQL® Databases** 클릭
2. **Create New Database**
   ```
   Database Name: ai_tool_finder
   ```
3. **Create User**
   ```
   Username: aitools_user
   Password: [강력한 비밀번호]
   ```
4. **Add User to Database**
   - User: aitools_user
   - Database: ai_tool_finder
   - Privileges: ALL PRIVILEGES 체크

5. **연결 정보 기록:**
   ```
   Host: localhost (또는 cPanel 제공 호스트)
   Port: 3306
   Database: cpanel사용자명_ai_tool_finder
   Username: cpanel사용자명_aitools_user
   Password: [비밀번호]
   ```

---

## 🔧 Step 2: 백엔드 업로드

### 방법 A: FTP/파일 관리자

1. **파일 준비 (로컬에서):**
   ```bash
   cd Ai-Tool-Finder-Backend
   npm install
   npm run build
   ```

2. **업로드할 파일:**
   ```
   ✅ dist/ (빌드된 파일)
   ✅ node_modules/ (또는 서버에서 npm install)
   ✅ package.json
   ✅ package-lock.json
   ✅ .env (환경 변수)
   ```

3. **업로드 위치:**
   ```
   /home/cpanel사용자명/ai-tool-backend/
   ```

### 방법 B: SSH (권장)

```bash
# 서버에 SSH 접속
ssh cpanel사용자명@서버주소

# 디렉토리 생성
mkdir -p ~/ai-tool-backend
cd ~/ai-tool-backend

# Git에서 클론
git clone https://github.com/mrblackfree/owlai_admin.git .

# 의존성 설치
npm install

# 빌드
npm run build
```

---

## 📝 Step 3: 환경 변수 설정

### .env 파일 생성:

```bash
# 서버에서
nano ~/ai-tool-backend/.env
```

**내용:**
```env
# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=cpanel사용자명_aitools_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=cpanel사용자명_ai_tool_finder

# 서버
PORT=3005
NODE_ENV=production

# Clerk
CLERK_SECRET_KEY=sk_test_ZzzU6cSJixsBjcxh36gTYZQ6kYTt9nzs0AEpp91aEY

# 프론트엔드
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# 로깅
LOG_LEVEL=info
ENABLE_RATE_LIMIT=true
```

---

## 🚀 Step 4: Node.js 앱 설정 (cPanel)

### cPanel Node.js Selector:

1. **Setup Node.js App** 클릭

2. **설정:**
   ```
   Node.js version: 18.x 또는 20.x
   Application mode: Production
   Application root: ai-tool-backend
   Application URL: api.yourdomain.com (또는 서브도메인)
   Application startup file: dist/index.js
   ```

3. **Environment Variables 추가:**
   - .env 파일 내용을 하나씩 추가

4. **NPM Install** 버튼 클릭

5. **Start App** 버튼 클릭

---

## 🌐 Step 5: 프론트엔드 배포

### 로컬에서 빌드:

```bash
cd Ai-Tool-Finder-Frontend
npm install
npm run build
```

### 업로드:

1. **빌드 파일 위치:**
   ```
   Ai-Tool-Finder-Frontend/dist/
   ```

2. **cPanel 파일 관리자:**
   ```
   /home/cpanel사용자명/public_html/
   ```

3. **dist/ 폴더 내용을 public_html/에 업로드**
   - index.html
   - assets/
   - 기타 파일들

---

## 🔗 Step 6: .htaccess 설정 (React Router용)

### public_html/.htaccess 생성:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Gzip 압축
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# 브라우저 캐싱
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

---

## 🔒 Step 7: SSL 인증서 설정

### cPanel Let's Encrypt:

1. **SSL/TLS Status** 클릭
2. 도메인 선택
3. **Run AutoSSL** 클릭

또는

1. **Let's Encrypt™ SSL** 클릭
2. 도메인 입력
3. **Issue** 클릭

---

## 🧪 Step 8: 테스트

### 백엔드 테스트:

```
https://api.yourdomain.com/health
```

**예상 응답:**
```json
{"status":"ok"}
```

### 프론트엔드 테스트:

```
https://yourdomain.com
```

- ✅ 페이지 로딩
- ✅ API 연결
- ✅ 한글 표시

---

## 📊 MySQL 스키마 생성

### 서버에서 실행:

```bash
cd ~/ai-tool-backend
node -e "require('./dist/db/mysql-connection.js').connectMySQL().then(() => process.exit())"
```

이 명령어로 자동으로 모든 테이블이 생성됩니다!

---

## 🔄 서버 재시작

### cPanel Node.js App:
- **Restart** 버튼 클릭

### SSH (PM2 사용 시):
```bash
pm2 restart all
```

---

## 📋 체크리스트

- [ ] MySQL 데이터베이스 생성
- [ ] 백엔드 파일 업로드
- [ ] .env 파일 설정
- [ ] cPanel Node.js 앱 설정
- [ ] 프론트엔드 빌드 및 업로드
- [ ] .htaccess 설정
- [ ] SSL 인증서 설정
- [ ] 테스트
- [ ] MySQL 테이블 자동 생성
- [ ] 데이터 마이그레이션

---

## ⚠️ 주의사항

### 포트 설정:
- cPanel 공유 호스팅은 일반적으로 포트를 직접 열 수 없음
- cPanel Node.js Selector가 자동으로 프록시 설정

### 메모리 제한:
- 공유 호스팅은 메모리 제한 있음
- 큰 파일 업로드/처리 시 주의

### 보안:
- .env 파일을 public_html 외부에 저장
- 민감한 정보 노출 방지

