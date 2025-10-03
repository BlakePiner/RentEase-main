// file: routes/landlordPropertyRoutes.js
import { Router } from "express";
import { requireAuthentication } from "../middlewares/requireAuthentication.js";
import { uploadLeaseDocument, handleFileUploadError } from "../middlewares/fileUpload.js";
import { 
  createProperty, 
  updateProperty,
  deleteProperty,
  createUnit, 
  updateUnit,
  deleteUnit,
  getAmenities, 
  getCitiesAndMunicipalities, 
  getLandlordProperties, 
  getPropertyDetails, 
  getPropertyUnits,
  getUnitDetails,   // ✅ import our new controller
  getDashboardStats, // ✅ import dashboard stats controller
} from "../controllers/landlord/propertyController.js";
import { getUnitsListingStatus, requestListing } from "../controllers/landlord/unitListingController.js";
import { 
  getLandlordLeases, 
  getLeaseDetails, 
  createLease, 
  updateLease, 
  deleteLease, 
  getLeaseStats,
  getTenants,
  activateLease
} from "../controllers/landlord/leaseController.js";
import { 
  getLandlordMaintenanceRequests, 
  getMaintenanceRequestDetails, 
  updateMaintenanceRequestStatus, 
  getMaintenanceStats, 
  deleteMaintenanceRequest 
} from "../controllers/landlord/maintenanceController.js";
import { 
  getLandlordTenants, 
  getTenantDetails, 
  runTenantScreening, 
  getScreeningResults, 
  generateBehaviorReport, 
  getTenantStats,
  updateTenantApplicationStatus,
  removeTenant,
  getAvailableLeasesForTenant,
  assignLeaseToTenant,
  getTenantsWithPendingApplications,
  removeApprovedTenant
} from "../controllers/landlord/tenantController.js";
import { 
  getLandlordConversations, 
  getConversationMessages, 
  sendMessage, 
  createOrGetConversation, 
  deleteConversation, 
  deleteMessage,
  getMessageStats 
} from "../controllers/landlord/messageController.js";
import { 
  getLandlordPayments, 
  getPaymentDetails, 
  updatePaymentStatus, 
  getPaymentStats, 
  getLeasePaymentHistory, 
  sendPaymentReminder
} from "../controllers/landlord/paymentController.js";
import { 
  getFinancialOverview, 
  getFinancialAnalytics, 
  addIncome, 
  addExpense, 
  getIncomeRecords, 
  getExpenseRecords, 
  deleteIncomeRecord, 
  deleteExpenseRecord 
} from "../controllers/landlord/financialController.js";
import { 
  getPropertyPerformanceReport, 
  getFinancialTrendsReport, 
  getTenantAnalyticsReport, 
  getOccupancyAnalyticsReport 
} from "../controllers/landlord/reportsController.js";

const router = Router();

// ---------------------------- Dashboard
router.get("/dashboard/stats", requireAuthentication(["LANDLORD"]), getDashboardStats);                        // get dashboard statistics

// ---------------------------- Property
// Lookup data
router.get("/property/amenities", requireAuthentication(["LANDLORD"]), getAmenities);                          // get all amenities 
router.get("/property/city-municipality", requireAuthentication(["LANDLORD"]), getCitiesAndMunicipalities);    // get all municipality and city

// Property CRUD
router.post("/property/create", requireAuthentication(["LANDLORD"]), createProperty);                          // create a new property
router.put("/property/:propertyId", requireAuthentication(["LANDLORD"]), updateProperty);                      // update a property
router.delete("/property/:propertyId", requireAuthentication(["LANDLORD"]), deleteProperty);                   // delete a property
router.get("/property/properties", requireAuthentication(["LANDLORD"]), getLandlordProperties);                // get all properties of the landlord
router.get("/property/:propertyId", requireAuthentication(["LANDLORD"]), getPropertyDetails);                  // get specific property details


// ---------------------------- Unit ----------------------------
router.get("/property/:propertyId/units/listing-status", requireAuthentication(["LANDLORD"]), getUnitsListingStatus); // landlord get all the unit status request in listing
router.get("/property/:propertyId/units", requireAuthentication(["LANDLORD"]), getPropertyUnits);              // get all unit of that property
router.get("/property/:propertyId/units/:unitId", requireAuthentication(["LANDLORD"]), getUnitDetails);        // get specific unit details 
router.post("/property/:propertyId/units", requireAuthentication(["LANDLORD"]), createUnit);                   // create a new unit
router.put("/property/:propertyId/units/:unitId", requireAuthentication(["LANDLORD"]), updateUnit);            // update a unit
router.delete("/property/:propertyId/units/:unitId", requireAuthentication(["LANDLORD"]), deleteUnit);         // delete a unit


// ---------------------------- Listing
router.post("/property/:propertyId/units/:unitId/request-listing",  requireAuthentication(["LANDLORD"]), requestListing); // landlord attempt to make a listing request

// ---------------------------- Leases
router.get("/leases", requireAuthentication(["LANDLORD"]), getLandlordLeases);                                    // get all leases of the landlord
router.get("/leases/stats", requireAuthentication(["LANDLORD"]), getLeaseStats);                                 // get lease statistics
router.get("/leases/:leaseId", requireAuthentication(["LANDLORD"]), getLeaseDetails);                           // get specific lease details
router.post("/leases", requireAuthentication(["LANDLORD"]), uploadLeaseDocument, handleFileUploadError, createLease);                                        // create a new lease
router.put("/leases/:leaseId", requireAuthentication(["LANDLORD"]), uploadLeaseDocument, handleFileUploadError, updateLease);                               // update a lease
router.delete("/leases/:leaseId", requireAuthentication(["LANDLORD"]), deleteLease);                            // delete a lease
router.patch("/leases/:leaseId/activate", requireAuthentication(["LANDLORD"]), activateLease);                     // activate a lease

// ---------------------------- Tenants (for lease creation)
router.get("/tenants/available", requireAuthentication(["LANDLORD"]), getTenants);                               // get all available tenants for lease creation

// ---------------------------- Maintenance
router.get("/maintenance", requireAuthentication(["LANDLORD"]), getLandlordMaintenanceRequests);                 // get all maintenance requests
router.get("/maintenance/stats", requireAuthentication(["LANDLORD"]), getMaintenanceStats);                      // get maintenance statistics
router.get("/maintenance/:requestId", requireAuthentication(["LANDLORD"]), getMaintenanceRequestDetails);        // get specific maintenance request details
router.put("/maintenance/:requestId/status", requireAuthentication(["LANDLORD"]), updateMaintenanceRequestStatus); // update maintenance request status
router.delete("/maintenance/:requestId", requireAuthentication(["LANDLORD"]), deleteMaintenanceRequest);         // delete maintenance request

// ---------------------------- Tenant Management & Screening
router.get("/tenants", requireAuthentication(["LANDLORD"]), getLandlordTenants);                                 // get all tenants with behavior analysis
router.get("/tenants/stats", requireAuthentication(["LANDLORD"]), getTenantStats);                               // get tenant statistics
router.get("/tenants/:tenantId", requireAuthentication(["LANDLORD"]), getTenantDetails);                         // get specific tenant details
router.post("/tenants/screening", requireAuthentication(["LANDLORD"]), runTenantScreening);                      // run automated tenant screening
router.get("/tenants/:tenantId/screening", requireAuthentication(["LANDLORD"]), getScreeningResults);            // get screening results for tenant
router.get("/tenants/:tenantId/behavior-report", requireAuthentication(["LANDLORD"]), generateBehaviorReport);   // generate behavior analysis report
router.patch("/tenants/applications/:applicationId", requireAuthentication(["LANDLORD"]), updateTenantApplicationStatus); // approve/reject tenant application
router.delete("/tenants/:tenantId", requireAuthentication(["LANDLORD"]), removeTenant);                             // remove/delete tenant
router.delete("/tenants/approved/:applicationId", requireAuthentication(["LANDLORD"]), removeApprovedTenant);       // remove approved tenant from history
router.get("/tenants/:tenantId/units/:unitId/available-leases", requireAuthentication(["LANDLORD"]), getAvailableLeasesForTenant); // get available leases for tenant
router.post("/tenants/applications/:applicationId/assign-lease", requireAuthentication(["LANDLORD"]), assignLeaseToTenant);        // assign lease to approved tenant
router.get("/tenants/pending-applications", requireAuthentication(["LANDLORD"]), getTenantsWithPendingApplications);              // get tenants with pending applications

// ---------------------------- Messages
router.get("/messages", requireAuthentication(["LANDLORD"]), getLandlordConversations);                          // get all conversations
router.get("/messages/stats", requireAuthentication(["LANDLORD"]), getMessageStats);                             // get message statistics
router.get("/messages/:conversationId", requireAuthentication(["LANDLORD"]), getConversationMessages);           // get conversation messages
router.post("/messages", requireAuthentication(["LANDLORD"]), sendMessage);                                      // send a message
router.post("/messages/conversation", requireAuthentication(["LANDLORD"]), createOrGetConversation);             // create or get conversation
router.delete("/messages/:conversationId", requireAuthentication(["LANDLORD"]), deleteConversation);             // delete conversation
router.delete("/messages/message/:messageId", requireAuthentication(["LANDLORD"]), deleteMessage);               // delete a message

// ---------------------------- Payments
router.get("/payments", requireAuthentication(["LANDLORD"]), getLandlordPayments);                               // get all payments
router.get("/payments/stats", requireAuthentication(["LANDLORD"]), getPaymentStats);                             // get payment statistics
router.get("/payments/:paymentId", requireAuthentication(["LANDLORD"]), getPaymentDetails);                      // get specific payment details
router.put("/payments/:paymentId/status", requireAuthentication(["LANDLORD"]), updatePaymentStatus);             // update payment status
router.get("/leases/:leaseId/payments", requireAuthentication(["LANDLORD"]), getLeasePaymentHistory);            // get payment history for a lease
router.post("/leases/:leaseId/reminder", requireAuthentication(["LANDLORD"]), sendPaymentReminder);              // send payment reminder

// ---------------------------- Financial Management
router.get("/financial/overview", requireAuthentication(["LANDLORD"]), getFinancialOverview);                    // get financial overview
router.get("/financial/analytics", requireAuthentication(["LANDLORD"]), getFinancialAnalytics);                  // get financial analytics and trends
router.get("/financial/income", requireAuthentication(["LANDLORD"]), getIncomeRecords);                          // get income records
router.get("/financial/expenses", requireAuthentication(["LANDLORD"]), getExpenseRecords);                       // get expense records
router.post("/financial/income", requireAuthentication(["LANDLORD"]), addIncome);                                // add income record
router.post("/financial/expenses", requireAuthentication(["LANDLORD"]), addExpense);                             // add expense record
router.delete("/financial/income/:incomeId", requireAuthentication(["LANDLORD"]), deleteIncomeRecord);           // delete income record
router.delete("/financial/expenses/:expenseId", requireAuthentication(["LANDLORD"]), deleteExpenseRecord);       // delete expense record

// ---------------------------- Reports & Analytics
router.get("/reports/property-performance", requireAuthentication(["LANDLORD"]), getPropertyPerformanceReport);   // get property performance report
router.get("/reports/financial-trends", requireAuthentication(["LANDLORD"]), getFinancialTrendsReport);           // get financial trends report
router.get("/reports/tenant-analytics", requireAuthentication(["LANDLORD"]), getTenantAnalyticsReport);           // get tenant analytics report
router.get("/reports/occupancy-analytics", requireAuthentication(["LANDLORD"]), getOccupancyAnalyticsReport);     // get occupancy analytics report

export default router;
