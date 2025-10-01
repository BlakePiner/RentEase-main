// file: tenantRoutes.js
import { Router } from "express";
import { requireAuthentication } from "../middlewares/requireAuthentication.js";
import { 
  getTenantDashboardData,
  getTenantLeaseDetails,
  getTenantPayments,
  getTenantMaintenanceRequests
} from "../controllers/tenant/tenantController.js";

const router = Router();

// ---------------------------- Dashboard
router.get("/dashboard", requireAuthentication(["TENANT"]), getTenantDashboardData);

// ---------------------------- Lease
router.get("/lease", requireAuthentication(["TENANT"]), getTenantLeaseDetails);

// ---------------------------- Payments
router.get("/payments", requireAuthentication(["TENANT"]), getTenantPayments);

// ---------------------------- Maintenance
router.get("/maintenance-requests", requireAuthentication(["TENANT"]), getTenantMaintenanceRequests);

export default router;
