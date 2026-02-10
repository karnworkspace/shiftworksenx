# ๐ข เธฃเธฐเธเธเธเธฑเธ”เธเธฒเธฃเน€เธงเธฃเธเธเธดเธเธฑเธ•เธดเธเธฒเธเนเธฅเธฐเธเธฃเธดเธซเธฒเธฃเธเนเธฒเนเธเนเธเนเธฒเธข - SENX Juristic

เธฃเธฐเธเธ Web Application เธชเธณเธซเธฃเธฑเธเธเธฑเธ”เธเธฒเธฃเธ•เธฒเธฃเธฒเธเน€เธงเธฃ (Roster) เนเธฅเธฐเธเธฃเธดเธซเธฒเธฃเธเธฑเธ”เธเธฒเธฃเธ•เนเธเธ—เธธเธเธชเธณเธซเธฃเธฑเธเธเธดเธ•เธดเธเธธเธเธเธฅเธญเธฒเธเธฒเธฃเธเธธเธ” (Condo) เนเธฅเธฐเธซเธกเธนเนเธเนเธฒเธเธเธฑเธ”เธชเธฃเธฃ

## ๐€ Quick Start

### 1. เธ•เธดเธ”เธ•เธฑเนเธ Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. เธ•เธฑเนเธเธเนเธฒ Environment

```bash
# Backend
cd backend
cp .env.example .env
# เนเธเนเนเธ DATABASE_URL เนเธฅเธฐ JWT secrets

# Frontend
cd ../frontend
cp .env.example .env
```

### 3. Setup Database

```bash
cd backend
npm run db:push
npm run db:seed
```

### 4. เธฃเธฑเธเนเธเธฃเน€เธเธ

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **Login**: admin@senx.com / admin123

## ๐“ เนเธเธฃเธเธชเธฃเนเธฒเธเนเธเธฃเน€เธเธ

```
Shift Work SENX Juristic/
โ”โ”€โ”€ backend/                 # Express + TypeScript API
โ”   โ”โ”€โ”€ src/
โ”   โ”   โ”โ”€โ”€ controllers/     # Request handlers
โ”   โ”   โ”โ”€โ”€ routes/          # API routes
โ”   โ”   โ”โ”€โ”€ middleware/      # Auth middleware
โ”   โ”   โ”โ”€โ”€ utils/           # JWT utilities
โ”   โ”   โ””โ”€โ”€ types/           # TypeScript types
โ”   โ”โ”€โ”€ prisma/              # Database schema
โ”   โ””โ”€โ”€ package.json
โ”
โ”โ”€โ”€ frontend/                # React + Vite + TypeScript
โ”   โ”โ”€โ”€ src/
โ”   โ”   โ”โ”€โ”€ components/      # React components
โ”   โ”   โ”โ”€โ”€ pages/           # Page components
โ”   โ”   โ”โ”€โ”€ services/        # API services
โ”   โ”   โ”โ”€โ”€ stores/          # Zustand stores
โ”   โ”   โ””โ”€โ”€ types/           # TypeScript types
โ”   โ””โ”€โ”€ package.json
โ”
โ””โ”€โ”€ old-nextjs-backup/       # เนเธเนเธ” Next.js เน€เธ”เธดเธก (เธชเธณเธฃเธญเธ)
```

## ๐  เน€เธ—เธเนเธเนเธฅเธขเธตเธ—เธตเนเนเธเน

### Frontend
- **React** + **Vite** + TypeScript
- **Ant Design 6.x** - UI Library
- **React Query (TanStack Query)** - State Management
- **Axios** - HTTP Client
- **Zustand** - Global State
- **React Router** - Routing

### Backend
- **Node.js** + **Express** + TypeScript
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** (Access + Refresh Token) - Authentication
- **Bcrypt** - Password Hashing

## ๐”‘ Authentication Flow

เธฃเธฐเธเธเนเธเน **JWT Authentication** เนเธเธ Access Token + Refresh Token:

1. **Access Token**: เน€เธเนเธเนเธ localStorage, เธญเธฒเธขเธธ 15 เธเธฒเธ—เธต
2. **Refresh Token**: เน€เธเนเธเนเธ httpOnly cookie, เธญเธฒเธขเธธ 7 เธงเธฑเธ
3. Auto-refresh เน€เธกเธทเนเธญ Access Token เธซเธกเธ”เธญเธฒเธขเธธ

## ๐“ API Endpoints

### Authentication
- `POST /api/auth/login` - เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ
- `POST /api/auth/refresh` - เธฃเธตเน€เธเธฃเธ Access Token
- `POST /api/auth/logout` - เธญเธญเธเธเธฒเธเธฃเธฐเธเธ
- `GET /api/auth/me` - เธเนเธญเธกเธนเธฅเธเธนเนเนเธเนเธเธฑเธเธเธธเธเธฑเธ

### Projects
- `GET /api/projects` - เธฃเธฒเธขเธเธฒเธฃเนเธเธฃเธเธเธฒเธฃ
- `GET /api/projects/:id` - เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธเธฃเธเธเธฒเธฃ
- `POST /api/projects` - เธชเธฃเนเธฒเธเนเธเธฃเธเธเธฒเธฃ
- `PUT /api/projects/:id` - เนเธเนเนเธเนเธเธฃเธเธเธฒเธฃ
- `DELETE /api/projects/:id` - เธฅเธเนเธเธฃเธเธเธฒเธฃ (soft delete)

### Staff, Rosters, Reports
- API endpoints เธญเธขเธนเนเธฃเธฐเธซเธงเนเธฒเธเธเธฒเธฃเธเธฑเธ’เธเธฒ

## ๐จ Features

- โ… JWT Authentication (Access + Refresh Token)
- โ… Protected Routes
- โ… Auto Token Refresh
- โ… Ant Design UI Components
- โ… TypeScript Type Safety
- โ… API Client with Interceptors
- ๐ง Project Management (In Progress)
- ๐ง Staff Management (Coming Soon)
- ๐ง Roster Management (Coming Soon)
- ๐ง Reports & Export (Coming Soon)

## ๐“ เธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธญเธเธฃเธฐเธเธ

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** เธซเธฃเธทเธญ **yarn**

## ๐”ง Development Scripts

### Backend
```bash
npm run dev          # เธฃเธฑเธ development server
npm run build        # Build TypeScript
npm run start        # เธฃเธฑเธ production server
npm run db:push      # Push Prisma schema
npm run db:studio    # เน€เธเธดเธ” Prisma Studio
npm run db:seed      # Seed เธเนเธญเธกเธนเธฅเธ•เธฑเธงเธญเธขเนเธฒเธ
```

### Frontend
```bash
npm run dev          # เธฃเธฑเธ development server
npm run build        # Build เธชเธณเธซเธฃเธฑเธ production
npm run preview      # Preview production build
npm run lint         # เธฃเธฑเธ ESLint
```

## ๐“ เน€เธญเธเธชเธฒเธฃเน€เธเธดเนเธกเน€เธ•เธดเธก

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - เธเธนเนเธกเธทเธญเธเธฒเธฃเธ•เธดเธ”เธ•เธฑเนเธเธญเธขเนเธฒเธเธฅเธฐเน€เธญเธตเธขเธ”
- [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) - เธเธฑเนเธเธ•เธญเธ Deploy (Frontend + Backend) เนเธฅเธฐเนเธเธฅเน zip เธชเธณเธซเธฃเธฑเธเธญเธฑเธเนเธซเธฅเธ”
- [GITHUB_SETUP_GUIDE.md](GITHUB_SETUP_GUIDE.md) - เธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ GitHub เนเธฅเธฐ CI/CD เธ”เนเธงเธข GitHub Actions
- [Prisma Schema](backend/prisma/schema.prisma) - Database schema

## ๐ Known Issues

- Staff, Roster, เนเธฅเธฐ Report APIs เธขเธฑเธเน€เธเนเธ placeholder
- เธขเธฑเธเนเธกเนเธกเธต Unit Tests
- UI เธขเธฑเธเน€เธเนเธ basic version

## ๐“ License

MIT

---

**เธชเธฃเนเธฒเธเนเธ”เธข:** SENX Development Team  
**เธญเธฑเธเน€เธ”เธ—เธฅเนเธฒเธชเธธเธ”:** January 19, 2026

โ”   โ”   โ”โ”€โ”€ staff/              # Staff Management
โ”   โ”   โ”โ”€โ”€ rosters/            # Roster Management
โ”   โ”   โ””โ”€โ”€ reports/            # Reports
โ”   โ”โ”€โ”€ dashboard/              # Dashboard Pages
โ”   โ”   โ”โ”€โ”€ projects/           # Projects Page
โ”   โ”   โ”โ”€โ”€ staff/              # Staff Page
โ”   โ”   โ”โ”€โ”€ roster/             # Roster Page
โ”   โ”   โ””โ”€โ”€ reports/            # Reports Page
โ”   โ”โ”€โ”€ login/                  # Login Page
โ”   โ”โ”€โ”€ layout.tsx              # Root Layout
โ”   โ”โ”€โ”€ page.tsx                # Home Page (Redirect)
โ”   โ””โ”€โ”€ globals.css             # Global Styles
โ”โ”€โ”€ lib/
โ”   โ”โ”€โ”€ prisma.ts               # Prisma Client
โ”   โ”โ”€โ”€ auth.ts                 # Authentication Utils
โ”   โ”โ”€โ”€ utils.ts                # Utility Functions
โ”โ”€โ”€ prisma/
โ”   โ”โ”€โ”€ schema.prisma           # Database Schema
โ”   โ””โ”€โ”€ seed.ts                 # Seed Data
โ”โ”€โ”€ public/                     # Static Assets
โ”โ”€โ”€ .env                        # Environment Variables
โ”โ”€โ”€ .env.example                # Example Environment
โ”โ”€โ”€ package.json                # Dependencies
โ”โ”€โ”€ tsconfig.json               # TypeScript Config
โ”โ”€โ”€ tailwind.config.ts          # Tailwind Config
โ””โ”€โ”€ README.md                   # Documentation
```

## ๐ฎ เธเธฒเธฃเนเธเนเธเธฒเธ

### 1. เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ

เนเธเธ—เธตเนเธซเธเนเธฒ Login เนเธฅเธฐเนเธเนเธเนเธญเธกเธนเธฅเธ—เธตเนเนเธ”เนเธเธฒเธ Seed:
- Email: `admin@senx.com`
- Password: `admin123`

### 2. Dashboard

เธซเธเนเธฒเนเธฃเธเธซเธฅเธฑเธเธเธฒเธ Login เธเธฐเนเธชเธ”เธ:
- เธชเธ–เธดเธ•เธดเธ เธฒเธเธฃเธงเธกเนเธเธฃเธเธเธฒเธฃเนเธฅเธฐเธเธเธฑเธเธเธฒเธ
- เธฃเธฒเธขเธเธฒเธฃเนเธเธฃเธเธเธฒเธฃเธ—เธฑเนเธเธซเธกเธ”
- Quick Access เนเธเธขเธฑเธเธ•เธฒเธฃเธฒเธเน€เธงเธฃเนเธฅเธฐเธฃเธฒเธขเธเธฒเธเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ

### 3. เธเธฑเธ”เธเธฒเธฃเนเธเธฃเธเธเธฒเธฃ

**เน€เธเธดเนเธกเนเธเธฃเธเธเธฒเธฃ:**
1. เนเธเธ—เธตเน "เธเธฑเธ”เธเธฒเธฃเนเธเธฃเธเธเธฒเธฃ"
2. เธเธฅเธดเธ "เน€เธเธดเนเธกเนเธเธฃเธเธเธฒเธฃ"
3. เธเธฃเธญเธเธเธทเนเธญ, เธชเธ–เธฒเธเธ—เธตเน, เธชเธตเธเธตเธก

- เธชเธฒเธกเธฒเธฃเธ–เธฃเธฐเธเธธเนเธ”เนเธงเนเธฒเนเธเธฃเธเธเธฒเธฃเธเธตเนเธเธฐเนเธเธฃเนเธเนเธฒเนเธเนเธเนเธฒเธขเนเธเธ—เธตเนเนเธเธฃเธเธเธฒเธฃเนเธซเธเธเนเธฒเธ
- เธเธณเธซเธเธ”เธชเธฑเธ”เธชเนเธงเธ % เธชเธณเธซเธฃเธฑเธเนเธ•เนเธฅเธฐเนเธเธฃเธเธเธฒเธฃเธเธฅเธฒเธขเธ—เธฒเธ
- เธฃเธฐเธเธเธเธฐเธเธณเธเธงเธ“เนเธฅเธฐเนเธชเธ”เธเนเธเธฃเธฒเธขเธเธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด

### 4. เธเธฑเธ”เธเธฒเธฃเธเธเธฑเธเธเธฒเธ

**เน€เธเธดเนเธกเธเธเธฑเธเธเธฒเธ:**
1. เนเธเธ—เธตเน "เธเธฑเธ”เธเธฒเธฃเธเธเธฑเธเธเธฒเธ"
2. เธเธฅเธดเธ "เน€เธเธดเนเธกเธเธเธฑเธเธเธฒเธ"
3. เธเธฃเธญเธเธเนเธญเธกเธนเธฅ: เธเธทเนเธญ, เธ•เธณเนเธซเธเนเธ, เธเนเธฒเนเธฃเธ/เธงเธฑเธ, เธเธฃเธฐเน€เธ เธ— (เธเธฃเธฐเธเธณ/เธชเนเธเธฃเน)
4. เน€เธฅเธทเธญเธเนเธเธฃเธเธเธฒเธฃเธ—เธตเนเธชเธฑเธเธเธฑเธ”

**เน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐ Active/Inactive:**
- เธเธฅเธดเธเธ—เธตเน Badge เธชเธ–เธฒเธเธฐ (เธ—เธณเธเธฒเธ/เนเธกเนเธ—เธณเธเธฒเธ)
- เธเธเธฑเธเธเธฒเธ Inactive เธเธฐเนเธกเนเนเธชเธ”เธเนเธเธ•เธฒเธฃเธฒเธเน€เธงเธฃเนเธซเธกเน เนเธ•เนเน€เธเนเธเธเธฃเธฐเธงเธฑเธ•เธดเนเธ”เน

### 5. เธเธฑเธ”เธ•เธฒเธฃเธฒเธเน€เธงเธฃ

1. เน€เธฅเธทเธญเธเนเธเธฃเธเธเธฒเธฃ, เธเธต, เน€เธ”เธทเธญเธเธเธฒเธ Dashboard
2. เนเธเนเนเธเธเธฐเธเธญเธเธเธเธฑเธเธเธฒเธเนเธ•เนเธฅเธฐเธงเธฑเธ (เธเธฅเธดเธเธ—เธตเน dropdown)
3. เธฃเธฐเธเธเธเธฐเนเธชเธ”เธเธชเธตเธ•เธฒเธกเธเธฃเธฐเน€เธ เธ—เธเธฐ
4. เธเธฅเธดเธ "เธเธฑเธเธ—เธถเธ" เน€เธกเธทเนเธญเนเธเนเนเธเน€เธชเธฃเนเธ

**เธฃเธซเธฑเธชเธเธฐ:**
- **1, 2, 3** - เธเธฐเน€เธเนเธฒ, เธเนเธฒเธข, เธ”เธถเธ
- **เธ”เธถเธ** - เธเธฐเธ”เธถเธ
- **OFF** - เธงเธฑเธเธซเธขเธธเธ”
- **เธ** - เธเธฒเธ”เธเธฒเธ
- **เธ** - เธฅเธฒเธเนเธงเธข
- **เธ** - เธฅเธฒเธเธดเธ
- **เธ** - เธเธฑเธเธฃเนเธญเธ

### 6. เธ”เธนเธฃเธฒเธขเธเธฒเธ

**เธฃเธฒเธขเธเธฒเธเธชเธฃเธธเธเธเธฒเธฃเธ—เธณเธเธฒเธ:**
- เนเธชเธ”เธเธเธณเธเธงเธเธงเธฑเธเธ—เธณเธเธฒเธ, เธเธฒเธ”, เธฅเธฒ
- เธเธณเธเธงเธ“เธขเธญเธ”เธซเธฑเธเน€เธเธดเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด

- เนเธชเธ”เธเธ•เนเธเธ—เธธเธเน€เธ”เธดเธกเธเธญเธเนเธ•เนเธฅเธฐเนเธเธฃเธเธเธฒเธฃ
- เนเธชเธ”เธเธขเธญเธ”เธ—เธตเนเนเธเธฃเนเธญเธญเธ (Shared Out)
- เนเธชเธ”เธเธขเธญเธ”เธ—เธตเนเนเธ”เนเธฃเธฑเธ (Shared In)
- เธเธณเธเธงเธ“เธ•เนเธเธ—เธธเธเธชเธธเธ—เธเธด (Net Cost)

## ๐”ง เธเธฒเธฃเธเธฑเธ’เธเธฒเนเธฅเธฐเนเธเนเนเธ

### Database Management

```bash
# เธ”เธน Database เธเนเธฒเธ Prisma Studio
npm run db:studio

# Generate Prisma Client เธซเธฅเธฑเธเนเธเน Schema
npm run db:generate

# Push Schema เนเธเธขเธฑเธ Database
npm run db:push
```

### Build เธชเธณเธซเธฃเธฑเธ Production

```bash
npm run build
npm run start
```

## ๐ Troubleshooting

### เธเธฑเธเธซเธฒ: Database Connection Failed
**เนเธเนเนเธ:** เธ•เธฃเธงเธเธชเธญเธ `DATABASE_URL` เนเธ `.env` เนเธซเนเธ–เธนเธเธ•เนเธญเธ

### เธเธฑเธเธซเธฒ: Login เนเธกเนเธเนเธฒเธ
**เนเธเนเนเธ:** เธ•เธฃเธงเธเธชเธญเธเธงเนเธฒเนเธ”เนเธฃเธฑเธ `npm run db:seed` เนเธฅเนเธงเธซเธฃเธทเธญเธขเธฑเธ

### เธเธฑเธเธซเธฒ: Prisma Client Error
**เนเธเนเนเธ:** เธฃเธฑเธ `npm run db:generate` เนเธซเธกเน

## ๐“ License

MIT License - เธชเธฒเธกเธฒเธฃเธ–เธเธณเนเธเนเธเนเธเธฒเธเนเธฅเธฐเนเธเนเนเธเนเธ”เนเธ•เธฒเธกเธ•เนเธญเธเธเธฒเธฃ

## ๐‘จโ€๐’ป Developer

SENX Development Team

---

**๐ เธเธญเธเธเธธเธ“เธ—เธตเนเนเธเนเธเธฒเธเธฃเธฐเธเธเธเธฑเธ”เธเธฒเธฃเน€เธงเธฃเธเธเธดเธเธฑเธ•เธดเธเธฒเธ SENX Juristic!**
