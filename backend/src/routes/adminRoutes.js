// file: adminRoutes.js
import { Router } from "express";
import { requireAuthentication } from "../middlewares/requireAuthentication.js";
import { 
  getAdminDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getSystemAnalytics,
  getPropertyRequests,
  updatePropertyRequestStatus
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

export default router;
