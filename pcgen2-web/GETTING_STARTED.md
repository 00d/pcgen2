# PCGen2 MERN Stack - Getting Started Guide

## Phase 1 Implementation Complete ✓

This document outlines what has been implemented in Phase 1 and how to get started with the PCGen2 MERN migration.

## What's Been Built

### Backend (Express.js + TypeScript + MongoDB + Redis)

**Core Features:**
- ✅ User authentication with JWT tokens
- ✅ MongoDB database with models for Users, Characters, and GameRules
- ✅ Redis caching for game rules (races, classes, feats, spells, equipment)
- ✅ RESTful API endpoints for authentication and character management
- ✅ Game data seeding with 7 core races and 11 core Pathfinder classes
- ✅ Character service with calculation engine for:
  - Ability score modifiers
  - Hit points calculation
  - Armor class
  - Saving throws
  - Base attack bonus and combat maneuver calculations

**API Endpoints (Phase 1):**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/game-rules/races` - List all races (cached)
- `GET /api/game-rules/races/:id` - Get specific race
- `GET /api/game-rules/classes` - List all classes (cached)
- `GET /api/game-rules/classes/:id` - Get specific class
- `GET /api/characters` - List user's characters
- `POST /api/characters` - Create new character
- `GET /api/characters/:id` - Get character details
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character
- `POST /api/characters/:id/set-race` - Apply race to character
- `POST /api/characters/:id/add-class` - Add class to character

**File Structure:**
```
backend/
├── src/
│   ├── server.ts                 # Main entry point
│   ├── config/
│   │   ├── database.ts           # MongoDB connection
│   │   └── redis.ts              # Redis client & cache helpers
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification & token generation
│   │   └── errorHandler.ts       # Global error handling
│   ├── models/
│   │   ├── User.ts               # Mongoose schema for users
│   │   ├── Character.ts          # Character schema
│   │   └── GameRule.ts           # Game rules schema
│   ├── services/
│   │   ├── authService.ts        # User registration & login
│   │   ├── characterService.ts   # Character CRUD & calculations
│   │   └── gameDataService.ts    # Game rules management & caching
│   ├── routes/
│   │   ├── auth.ts               # Authentication routes
│   │   ├── characters.ts         # Character management routes
│   │   └── gameRules.ts          # Game rules routes
│   ├── types/
│   │   ├── character.ts          # Character TypeScript types
│   │   └── gameRules.ts          # Game rules types
│   └── utils/
│       └── logger.ts              # Winston logger
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── migratePathfinderData.ts  # (TODO) LST → JSON conversion
│   └── seedDatabase.ts           # (TODO) Database seeding
├── package.json
├── tsconfig.json
├── jest.config.js
└── .eslintrc.json
```

### Frontend (Next.js 14 + React + Redux + TailwindCSS)

**Core Features:**
- ✅ User authentication (register, login, logout)
- ✅ Dashboard with character list
- ✅ Character creation flow (3 steps: name → race → class)
- ✅ Race selection with detailed information display
- ✅ Class selection with ability comparisons
- ✅ Redux store with async thunks
- ✅ API client with automatic JWT token injection
- ✅ PWA support (next-pwa configured)
- ✅ TailwindCSS styling

**Pages:**
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Character list
- `/create` - Character name input
- `/create/race/[id]` - Race selection
- `/create/class/[id]` - Class selection

**File Structure:**
```
frontend/
├── app/
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # Redux provider & layout wrapper
│   ├── page.tsx                  # Home page
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Registration page
│   ├── dashboard/page.tsx        # Character list
│   ├── create/
│   │   ├── page.tsx              # Character name input
│   │   ├── race/[id]/page.tsx   # Race selection
│   │   └── class/[id]/page.tsx  # Class selection
├── components/
│   └── Layout.tsx                # Navigation & layout
├── redux/
│   ├── store.ts                  # Redux store
│   ├── hooks.ts                  # Typed useDispatch & useSelector
│   └── slices/
│       ├── authSlice.ts          # Auth state & async thunks
│       ├── characterSlice.ts     # Character state & async thunks
│       └── gameDataSlice.ts      # Game data state & async thunks
├── types/
│   ├── auth.ts                   # Auth TypeScript types
│   ├── character.ts              # Character types
│   └── gameRules.ts              # Game rules types
├── lib/
│   └── api.ts                    # API client with axios
├── styles/
│   └── globals.css               # TailwindCSS styles
├── public/
│   └── manifest.json             # PWA manifest
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── jest.config.js
```

## Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (recommended)
- MongoDB Atlas account (or local MongoDB via Docker)

### Setup Instructions

#### 1. Clone and Navigate

```bash
cd /Users/nose/work/mca/model_b/pcgen2-web
```

#### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

#### 3. Start Docker Services (Optional but Recommended)

```bash
docker-compose up -d
```

This starts:
- MongoDB on localhost:27017 (user: pcgen, password: pcgen_dev)
- Redis on localhost:6379

#### 4. Configure Environment Variables

**Backend (`backend/.env`):**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://pcgen:pcgen_dev@localhost:27017/pcgen2?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### 5. Seed Game Data

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Seed data (in a new terminal)
curl -X POST http://localhost:5000/api/game-rules/seed
```

This will insert 7 races and 11 classes into MongoDB.

#### 6. Start Development Servers

**Option A: Run both in one command**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Access the app at `http://localhost:3000`

## Testing the Application

### Create an Account

1. Go to http://localhost:3000
2. Click "Register"
3. Fill in email, username, password (min 8 characters)
4. Click "Register"

### Create Your First Character

1. From dashboard, click "Create New Character"
2. Enter a character name (e.g., "Aragorn")
3. Click "Next: Select Race"
4. Choose a race (e.g., "Human") - see details on the card
5. Click "Next: Select Class"
6. Choose a class (e.g., "Fighter")
7. Click "Create Character"
8. Character will appear on dashboard

### View Character

- Click on a character card to view details
- See race, classes, and automatically calculated stats

## Development Tips

### Backend Development

**Run tests:**
```bash
cd backend
npm test
```

**Lint code:**
```bash
cd backend
npm run lint
npm run lint:fix
```

**Check database:**
```bash
# MongoDB
mongodb://pcgen:pcgen_dev@localhost:27017/pcgen2

# Use MongoDB Compass or mongosh
mongosh --username pcgen --password pcgen_dev
```

### Frontend Development

**Run tests:**
```bash
cd frontend
npm test
```

**Lint code:**
```bash
cd frontend
npm run lint
```

**Build for production:**
```bash
cd frontend
npm run build
npm run start
```

## Project Architecture

### Authentication Flow

1. User registers/logs in via `/login` or `/register`
2. Backend validates credentials and returns JWT token
3. Frontend stores token in localStorage
4. API client automatically adds token to request headers
5. Backend middleware (authMiddleware) verifies token on protected routes

### Character Creation Flow

1. **Step 1: Name** - User enters character name, creates character in DB
2. **Step 2: Race** - User selects race, backend applies race modifiers to ability scores
3. **Step 3: Class** - User selects class, backend calculates hit points and other stats
4. Character appears on dashboard

### State Management (Redux)

**authSlice:**
- `user` - Current logged-in user
- `token` - JWT token
- `isLoading` - Loading state
- `error` - Error messages

**characterSlice:**
- `characters` - User's characters list
- `currentCharacter` - Character being created/edited
- `step` - Current creation step
- `isLoading` - Loading state
- `error` - Error messages

**gameDataSlice:**
- `races` - List of available races (cached)
- `classes` - List of available classes (cached)
- `isLoading` - Loading state
- `error` - Error messages

### Database Schema

**Users Collection:**
```javascript
{
  email: String (unique),
  username: String (unique),
  passwordHash: String (bcrypt hashed),
  preferences: {
    theme: 'light' | 'dark',
    language: String,
    pdfTemplate: 'standard' | 'compact'
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Characters Collection:**
- Large nested document with race, classes, ability scores, skills, equipment, spells
- See `backend/src/models/Character.ts` for full schema

**GameRules Collection:**
- Polymorphic collection for races, classes, feats, spells, equipment
- Cached in Redis for fast retrieval

## Next Steps (Phase 2-4)

### Phase 2: Full Character Builder (3-4 weeks)
- Ability score assignment (point buy system)
- Feat selection with prerequisites
- Skill allocation
- Equipment selection
- Spell selection (for spellcasters)

### Phase 3: Character Management & Printing (2 weeks)
- Character editing
- Print-friendly HTML sheets
- PDF export
- Character deletion

### Phase 4: Polish & PWA (2 weeks)
- PDF generation
- Offline support via PWA
- Performance optimization
- Comprehensive testing

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Error

- Ensure MongoDB is running: `docker ps`
- Check connection string in `.env`
- Verify credentials

### Redis Connection Error

- Ensure Redis is running: `docker ps`
- Check Redis URL in `.env`

### API Request Fails

- Check backend is running: `curl http://localhost:5000/health`
- Check browser console for errors
- Check backend logs for detailed error messages

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## Support

For issues or questions, check:
1. Browser console (frontend errors)
2. Backend logs (`npm run dev` output)
3. MongoDB/Redis logs (`docker logs`)
4. This guide's Troubleshooting section

---

**Implementation Status:** Phase 1 Complete ✓
**Next Phase:** Phase 2 (Ability Scores, Feats, Skills, Equipment, Spells)
**Estimated Timeline:** 3-4 weeks
