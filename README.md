# AI Tool Finder - Backend

The backend server for AI Tool Finder, a modern platform for discovering and managing AI tools. Built with Node.js, Express, TypeScript, and MongoDB.

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Programming language
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **Clerk** - Authentication and user management
- **Zod** - Data validation
- **Jest** - Testing framework

## ✨ Features

- 🔒 **Secure Authentication** - JWT-based authentication with Clerk
- 📊 **RESTful API** - Well-structured API endpoints
- 🛡️ **Security** - Includes helmet, CORS protection, and rate limiting
- 🚀 **Performance** - Compression for faster response times
- 📘 **Type Safety** - Full TypeScript implementation
- 📝 **Data Validation** - Request validation with Zod
- 🧪 **Testing** - Comprehensive testing setup

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn
- Clerk account for authentication

## 🚀 Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/WebBuddy-Marketplace/Ai-Tool-Finder-Backend.git
   cd Ai-Tool-Finder-Backend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Setup environment variables
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your specific configuration values.

### Running the Application

#### Development Mode
```bash
npm run dev
# or
yarn dev
```

#### Production Build
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 🏗️ Project Structure

```
src/
  ├── api/           # API routes and controllers
  ├── db/            # Database models and connection
  ├── server/        # Server configuration
  ├── scripts/       # Utility scripts
  └── index.ts       # Entry point
```

## 📝 API Documentation

### Base URL
`http://localhost:8080/api` (local development)

### Endpoints

- `/api/tools` - AI tools CRUD operations
- `/api/users` - User management
- `/api/auth` - Authentication endpoints
- `/api/categories` - Tool categories
- `/api/submissions` - Tool submissions

## 🧪 Testing

Run tests with:

```bash
npm test
# or
yarn test
```

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is proprietary and confidential. Unauthorized copying, transferring or reproduction of the contents of this repository, via any medium is strictly prohibited.

## 📞 Support

For support, please contact us at hey@webbuddy.agency.

---

Built with ❤️ by [WebBuddy](https://webbuddy.agency) 