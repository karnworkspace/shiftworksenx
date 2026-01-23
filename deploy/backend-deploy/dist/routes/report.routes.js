"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/reports/deduction?projectId=xxx&year=2567&month=1
router.get('/deduction', report_controller_1.getMonthlyDeductionReport);
// GET /api/reports/cost-sharing?year=2567&month=1
router.get('/cost-sharing', report_controller_1.getCostSharingReport);
// GET /api/reports/financial-overview?year=2567&month=1
router.get('/financial-overview', report_controller_1.getFinancialOverview);
// GET /api/reports/export?projectId=xxx&year=2567&month=1
router.get('/export', report_controller_1.exportReportCSV);
exports.default = router;
//# sourceMappingURL=report.routes.js.map