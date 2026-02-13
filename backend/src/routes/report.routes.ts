import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import {
  getMonthlyDeductionReport,
  getFinancialOverview,
  exportReportCSV,
} from '../controllers/report.controller';

const router = Router();
router.use(authenticate);

// GET /api/reports/deduction?projectId=xxx&year=2567&month=1
router.get('/deduction', requirePermission('reports'), getMonthlyDeductionReport);

// GET /api/reports/financial-overview?year=2567&month=1
router.get('/financial-overview', requirePermission('reports'), getFinancialOverview);

// GET /api/reports/export?projectId=xxx&year=2567&month=1
router.get('/export', requirePermission('reports'), exportReportCSV);

export default router;
