# 공유 호스팅 업로드 가이드 (cPanel + MySQL + Node.js)

## 📋 준비 사항

### 호스팅 요구사항:
- ✅ cPanel 계정
- ✅ Node.js 18.x 이상 지원
- ✅ MySQL 데이터베이스
- ✅ SSH 접근 (권장, PM2 설정용)
- ✅ 최소 512MB RAM

---

## 🗄️ Step 1: MySQL 데이터베이스 생성

### cPanel → MySQL Databases

1. **Create New Database**
   ```
   Database Name: ai_tool_finder
   → 실제 이름: cpanel사용자명_ai_tool_finder
   ```

2. **Create Database User**
   ```
   Username: aitools_admin
   Password: [강력한 비밀번호 생성]
   → 실제 이름: cpanel사용자명_aitools_admin
   ```

3. **Add User To Database**
   - User: cpanel사용자명_aitools_admin
   - Database: cpanel사용자명_ai_tool_finder
   - Privileges: **ALL PRIVILEGES** 체크

4. **연결 정보 기록:**
   ```
   Host: localhost
   Port: 3306
   Database: cpanel사용자명_ai_tool_finder
   Username: cpanel사용자명_aitools_admin
   Password: [생성한 비밀번호]
   ```

---

## 📦 Step 2: 백엔드 파일 준비

### 로컬 컴퓨터에서:

```bash
cd c:\Apps\owlai\Ai-Tool-Finder-Backend

# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 필요한 파일만 압축
# (node_modules는 서버에서 설치)
```

### 업로드할 파일 목록:
```
✅ src/ (소스 코드)
✅ dist/ (빌드된 JavaScript)
✅ package.json
✅ package-lock.json
✅ .env (환경 변수 - 서버에서 생성)
❌ node_modules/ (서버에서 설치)
❌ .git/
❌ *.log
```

---

## 🚀 Step 3: 파일 업로드

### 방법 A: FTP (FileZilla 등)

1. **FTP 접속 정보 (cPanel에서 확인):**
   ```
   Host: ftp.yourdomain.com
   Username: cpanel사용자명
   Password: cPanel 비밀번호
   Port: 21 (또는 22 for SFTP)
   ```

2. **업로드 위치:**
   ```
   /home/cpanel사용자명/ai-backend/
   ```

3. **FileZilla로 업로드:**
   - src/ 폴더 전체
   - dist/ 폴더 전체
   - package.json
   - package-lock.json

### 방법 B: SSH (권장)

```bash
# 로컬에서 압축
cd c:\Apps\owlai\Ai-Tool-Finder-Backend
tar -czf backend.tar.gz src dist package.json package-lock.json

# SCP로 업로드
scp backend.tar.gz cpanel사용자명@서버주소:~/

# 서버에 SSH 접속
ssh cpanel사용자명@서버주소

# 압축 해제
mkdir -p ~/ai-backend
cd ~/ai-backend
tar -xzf ~/backend.tar.gz

# 의존성 설치
npm install --production
```

---

## ⚙️ Step 4: 환경 변수 설정

### 서버에서 .env 파일 생성:

```bash
cd ~/ai-backend
nano .env
```

**내용 (복사-붙여넣기):**
```env
# MySQL 데이터베이스
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=cpanel사용자명_aitools_admin
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=cpanel사용자명_ai_tool_finder

# 서버 설정
PORT=3005
NODE_ENV=production

# Clerk 인증
CLERK_SECRET_KEY=sk_test_ZzzU6cSJixsBjcxh36gTYZQ6kYTt9nzs0AEpp91aEY

# 프론트엔드 URL (CORS)
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# 로깅
LOG_LEVEL=info
ENABLE_RATE_LIMIT=true

# Cloudinary (선택사항)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe (선택사항)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**저장:** Ctrl+X → Y → Enter

---

## 🔧 Step 5: cPanel Node.js 앱 설정

### cPanel → Setup Node.js App

1. **Create Application** 클릭

2. **설정:**
   ```
   Node.js version: 18.x (또는 20.x)
   
   Application mode: Production
   
   Application root: ai-backend
   
   Application URL: api (또는 원하는 서브도메인)
   
   Application startup file: dist/index.js
   
   Passenger log file: logs/passenger.log
   ```

3. **Environment Variables 추가:**
   - .env 파일 내용을 하나씩 수동으로 추가
   - 또는 "Paste from .env" 옵션 사용

4. **NPM Install 버튼 클릭**
   - 의존성 자동 설치

5. **MySQL 테이블 생성:**
   ```bash
   # SSH 또는 cPanel Terminal
   cd ~/ai-backend
   npm run mysql:setup
   ```

6. **앱 시작:**
   - **Start App** 버튼 클릭
   - 또는 **Restart** 버튼

---

## 🌐 Step 6: 프론트엔드 빌드 및 업로드

### 로컬에서 빌드:

```bash
cd c:\Apps\owlai\Ai-Tool-Finder-Frontend

# 환경 변수 설정 (.env.production 생성)
VITE_API_URL=https://api.yourdomain.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/
VITE_CLERK_AFTER_SIGN_UP_URL=/

# 프로덕션 빌드
npm run build
```

### 업로드:

1. **빌드 파일 위치:**
   ```
   Ai-Tool-Finder-Frontend/dist/
   ```

2. **cPanel 파일 관리자:**
   - `public_html/` 폴더로 이동
   - 기존 파일 백업 (선택사항)
   - `dist/` 폴더의 **모든 내용**을 `public_html/`에 업로드
   
3. **업로드해야 할 파일:**
   ```
   ✅ index.html
   ✅ assets/ (폴더)
   ✅ vite.svg (및 기타 정적 파일들)
   ```

---

## 🔗 Step 7: .htaccess 설정 (React Router)

### public_html/.htaccess 생성/수정:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # React Router - 모든 요청을 index.html로
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Gzip 압축
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml
  AddOutputFilterByType DEFLATE text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# 브라우저 캐싱
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# CORS (백엔드 서브도메인과 통신)
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "https://api.yourdomain.com"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

---

## 🔐 Step 8: SSL 인증서 설정

### cPanel → SSL/TLS Status

1. **AutoSSL 활성화:**
   - 메인 도메인과 서브도메인(api) 모두 체크
   - **Run AutoSSL** 클릭

2. **또는 Let's Encrypt:**
   - cPanel → SSL/TLS
   - Let's Encrypt™ SSL
   - 도메인 입력 후 **Issue** 클릭

---

## 🧪 Step 9: 테스트

### 백엔드 API 테스트:

```
https://api.yourdomain.com/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T..."
}
```

### 프론트엔드 테스트:

```
https://yourdomain.com
```

- ✅ 페이지 로딩
- ✅ API 연결
- ✅ 한글 표시
- ✅ 언어 전환 (🌐)

---

## 🔄 서버 관리

### 앱 재시작:
```bash
# cPanel Node.js App
→ Restart 버튼

# SSH
cd ~/ai-backend
touch tmp/restart.txt
```

### 로그 확인:
```bash
# cPanel
→ Node.js App → View Logs

# SSH
tail -f ~/ai-backend/logs/passenger.log
```

### 업데이트:
```bash
# SSH
cd ~/ai-backend
git pull origin main
npm install
npm run build
touch tmp/restart.txt
```

---

## ⚡ 성능 최적화

### PM2 사용 (SSH 필요):

```bash
# PM2 설치
npm install -g pm2

# 앱 시작
pm2 start dist/index.js --name ai-backend

# 자동 재시작 설정
pm2 startup
pm2 save

# 모니터링
pm2 status
pm2 logs
```

---

## 🐛 문제 해결

### 500 Internal Server Error:
```bash
# 로그 확인
tail -f logs/passenger.log

# 환경 변수 확인
cat .env

# MySQL 연결 테스트
npm run mysql:setup
```

### Permission Denied:
```bash
chmod -R 755 ~/ai-backend
chmod 644 ~/ai-backend/.env
```

### Module Not Found:
```bash
cd ~/ai-backend
rm -rf node_modules
npm install --production
npm run build
```

---

## ✅ 완료 체크리스트

- [ ] MySQL 데이터베이스 생성 및 사용자 추가
- [ ] 백엔드 파일 업로드
- [ ] .env 파일 설정 (MySQL 연결 정보)
- [ ] cPanel Node.js 앱 생성 및 설정
- [ ] npm install 실행
- [ ] MySQL 테이블 생성 (`npm run mysql:setup`)
- [ ] Node.js 앱 시작
- [ ] 백엔드 Health Check 테스트
- [ ] 프론트엔드 빌드 (`npm run build`)
- [ ] dist/ 파일을 public_html/에 업로드
- [ ] .htaccess 설정
- [ ] SSL 인증서 설정
- [ ] 프론트엔드 사이트 테스트
- [ ] 한글화 및 기능 테스트

---

## 🎉 완료 후

**백엔드:**
```
https://api.yourdomain.com
```

**프론트엔드:**
```
https://yourdomain.com
```

**모두 정상 작동!** 🚀

