// file: tenantRoutes.js
import { Router } from "express";
import { requireAuthentication } from "../middlewares/requireAuthentication.js";
import { uploadMaintenanceImage, handleMaintenanceImageUploadError } from "../middlewares/maintenanceImageUpload.js";
import { 
  getTenantDashboardData,
  getTenantLeaseDetails,
  getTenantPayments,
  getTenantMaintenanceRequests,
  clearMaintenanceRequest,
  submitMaintenanceRequest,
  browseApprovedProperties,
  getPropertyDetailsForTenant,
  submitTenantApplication,
  getTenantApplications,
  getTenantConversations,
  getTenantConversationMessages,
  sendTenantMessage,
  createOrGetTenantConversation,
  deleteTenantMessage,
  deleteTenantConversation,
  getTenantMessageStats,
  downloadLeasePDF
} from "../controllers/tenant/tenantController.js";

const router = Router();

// ---------------------------- Dashboard
router.get("/dashboard", requireAuthentication(["TENANT"]), getTenantDashboardData);

// ---------------------------- Lease
router.get("/lease", requireAuthentication(["TENANT"]), getTenantLeaseDetails);
router.get("/lease/:leaseId/pdf", requireAuthentication(["TENANT"]), downloadLeasePDF);

// ---------------------------- Payments
router.get("/payments", requireAuthentication(["TENANT"]), getTenantPayments);

// ---------------------------- Maintenance
router.get("/maintenance-requests", requireAuthentication(["TENANT"]), getTenantMaintenanceRequests);
router.post("/maintenance-requests", 
  requireAuthentication(["TENANT"]), 
  uploadMaintenanceImage, 
  handleMaintenanceImageUploadError,
  submitMaintenanceRequest
);
router.patch("/maintenance-requests/:requestId/clear", requireAuthentication(["TENANT"]), clearMaintenanceRequest);

// ---------------------------- Browse Properties
router.get("/browse-properties", requireAuthentication(["TENANT"]), browseApprovedProperties);
router.get("/properties/:propertyId", requireAuthentication(["TENANT"]), getPropertyDetailsForTenant);

// ---------------------------- Applications
router.post("/applications/:unitId", requireAuthentication(["TENANT"]), submitTenantApplication);
router.get("/applications", requireAuthentication(["TENANT"]), getTenantApplications);

// ---------------------------- Messages
router.get("/messages", requireAuthentication(["TENANT"]), getTenantConversations);                    // get all conversations
router.get("/messages/stats", requireAuthentication(["TENANT"]), getTenantMessageStats);              // get message statistics
router.get("/messages/:conversationId", requireAuthentication(["TENANT"]), getTenantConversationMessages); // get conversation messages
router.post("/messages", requireAuthentication(["TENANT"]), sendTenantMessage);                       // send a message
router.post("/messages/conversation", requireAuthentication(["TENANT"]), createOrGetTenantConversation); // create or get conversation
router.delete("/messages/:messageId", requireAuthentication(["TENANT"]), deleteTenantMessage);         // delete a message
router.delete("/messages/conversation/:conversationId", requireAuthentication(["TENANT"]), deleteTenantConversation); // delete a conversation

export default router;
