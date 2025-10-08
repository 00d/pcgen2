# PCGen2 MERN Stack Migration

A modern web-based recreation of PCGen (character generator for tabletop RPGs) using the MERN stack (MongoDB, Express.js, React, Node.js) with Next.js.

## Overview

This project migrates the desktop-based PCGen application to a modern web platform, starting with Pathfinder 1st Edition character creation and management.

## Project Structure

```
pcgen2-web/
├── frontend/          # Next.js + React application
├── backend/           # Express.js API server
├── data/              # Game data (LST files from PCGen)
├── scripts/           # Data migration scripts
├── docs/              # Documentation
└── docker-compose.yml # Local development environment
```

## Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (recommended for local dev)
- MongoDB Atlas account (or local MongoDB via Docker)
- Redis (or via Docker)

### Local Development Setup

**Option 1: Using Docker (Recommended)**

```bash
# Start MongoDB and Redis
docker-compose up -d

# Install dependencies
npm install

# Start both frontend and backend
npm run dev
```

**Option 2: Manual Setup**

```bash
# Terminal 1: Frontend
cd frontend
npm install
npm run dev
# Frontend will be at http://localhost:3000

# Terminal 2: Backend
cd backend
npm install
npm run dev
# Backend will be at http://localhost:5000
```

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```
NODE_ENV=development
MONGODB_URI=mongodb://pcgen:pcgen_dev@localhost:27017/pcgen2?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d
PORT=5000
```

## Phase 1: Character Creation (Race/Class Selection)

### Goals
- User authentication (JWT)
- Basic character creation (race + class selection)
- Game rules loading and caching
- Character persistence

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

**Game Rules:**
- `GET /api/game-rules/races` - List races
- `GET /api/game-rules/races/:id` - Get race details
- `GET /api/game-rules/classes` - List classes
- `GET /api/game-rules/classes/:id` - Get class details

**Characters:**
- `POST /api/characters` - Create character
- `GET /api/characters` - List user's characters
- `GET /api/characters/:id` - Get character details

## Development

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Backend Development

```bash
cd backend

# Run development server with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Migrate Pathfinder data from LST
npm run migrate:pathfinder
```

## Database Schema

See `docs/DATABASE.md` for detailed MongoDB schema documentation.

## API Documentation

See `docs/API.md` for complete API reference.

## Architecture

See `docs/ARCHITECTURE.md` for system architecture details.

## Migration Guide

See `docs/MIGRATION.md` for migration details from the Java-based PCGen.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

## License

This project is a modern recreation of PCGen. See the original PCGen repository for license information.

## Roadmap

- [ ] Phase 1: Character Creation (Race/Class)
- [ ] Phase 2: Full Character Builder (Feats, Spells, Equipment)
- [ ] Phase 3: Character Management & Printing
- [ ] Phase 4: Exports & PWA

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
