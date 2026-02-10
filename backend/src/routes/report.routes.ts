import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMonthlyDeductionReport,
  getFinancialOverview,
  exportReportCSV,
} from '../controllers/report.controller';

const router = Router();
router.use(authenticate);

// GET /api/reports/deduction?projectId=xxx&year=2567&month=1
router.get('/deduction', getMonthlyDeductionReport);

// GET /api/reports/financial-overview?year=2567&month=1
router.get('/financial-overview', getFinancialOverview);

// GET /api/reports/export?projectId=xxx&year=2567&month=1
router.get('/export', exportReportCSV);

export default router;
