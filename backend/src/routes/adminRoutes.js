// file: adminRoutes.js
import { Router } from "express";
import { requireAuthentication } from "../middlewares/requireAuthentication.js";
import { 
  getAdminDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getSystemAnalytics,
  getPropertyRequests,
  updatePropertyRequestStatus,
  getAllProperties,
  getAllPayments,
  getPaymentAnalytics,
  getSystemLogs,
  getSystemLogsAnalytics
} from "../controllers/admin/adminController.js";

const router = Router();

// ---------------------------- Dashboard
router.get("/dashboard/stats", requireAuthentication(["ADMIN"]), getAdminDashboardStats);     // get admin dashboard statistics
router.get("/analytics", requireAuthentication(["ADMIN"]), getSystemAnalytics);               // get system analytics

// ---------------------------- User Management
router.get("/users", requireAuthentication(["ADMIN"]), getAllUsers);                          // get all users with pagination and filters
router.patch("/users/:userId/toggle-status", requireAuthentication(["ADMIN"]), toggleUserStatus); // enable/disable user

// ---------------------------- Property Requests
router.get("/property-requests", requireAuthentication(["ADMIN"]), getPropertyRequests);      // get all property listing requests
router.patch("/property-requests/:listingId", requireAuthentication(["ADMIN"]), updatePropertyRequestStatus); // approve/reject listing request

// ---------------------------- Properties
router.get("/properties", requireAuthentication(["ADMIN"]), getAllProperties);               // get all properties created by landlords

// ---------------------------- Financial
router.get("/payments", requireAuthentication(["ADMIN"]), getAllPayments);                   // get all payments with filters
router.get("/payments/analytics", requireAuthentication(["ADMIN"]), getPaymentAnalytics);   // get payment analytics and statistics

// ---------------------------- System
router.get("/system-logs", requireAuthentication(["ADMIN"]), getSystemLogs);                // get system logs (user activity)
router.get("/system-logs/analytics", requireAuthentication(["ADMIN"]), getSystemLogsAnalytics); // get system logs analytics

export default router;
