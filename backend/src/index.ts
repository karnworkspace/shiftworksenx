import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import staffRoutes from './routes/staff.routes';
import rosterRoutes from './routes/roster.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import shiftRoutes from './routes/shift.routes';
import positionRoutes from './routes/position.routes';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (for Nginx/Cloud reverse proxy)
// ตั้งค่าเสมอเพื่อให้ rate limit ใช้ IP จริงของ client ไม่ใช่ IP ของ proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting - general API
// trust proxy: 1 ตั้งไว้แล้ว → req.ip คือ client IP จริง ไม่ต้อง keyGenerator เอง
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 3000 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Rate limiting - auth routes (login/refresh) เฉพาะกัน brute force
// เพิ่มจาก 100 → 300 เพื่อรองรับ office/corporate NAT ที่หลายคนใช้ IP เดียวกัน
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/positions', positionRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;
