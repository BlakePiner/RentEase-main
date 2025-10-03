import { createNotification } from "../controllers/notificationController.js";

// ---------------------------------------------- NOTIFICATION SERVICE ----------------------------------------------

/**
 * Create a payment notification
 */
export const createPaymentNotification = async (userId, paymentData) => {
  const { amount, status, timingStatus, lease } = paymentData;
  
  let message = "";
  let type = "PAYMENT";
  
  if (status === "PAID") {
    if (timingStatus === "ONTIME") {
      message = `Payment of $${amount} received on time from ${lease?.tenant?.firstName || 'tenant'}`;
    } else if (timingStatus === "LATE") {
      message = `Late payment of $${amount} received from ${lease?.tenant?.firstName || 'tenant'}`;
    } else {
      message = `Payment of $${amount} received from ${lease?.tenant?.firstName || 'tenant'}`;
    }
  } else if (status === "PENDING") {
    message = `Payment of $${amount} is pending from ${lease?.tenant?.firstName || 'tenant'}`;
  }
  
  if (message) {
    await createNotification(userId, type, message);
  }
};

/**
 * Create a lease notification
 */
export const createLeaseNotification = async (userId, leaseData, action) => {
  const { leaseNickname, tenant, unit } = leaseData;
  const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown tenant';
  const unitLabel = unit ? unit.label : 'Unknown unit';
  
  let message = "";
  let type = "LEASE";
  
  switch (action) {
    case "CREATED":
      message = `New lease created: ${leaseNickname || 'Unnamed lease'} for ${tenantName} in ${unitLabel}`;
      break;
    case "UPDATED":
      message = `Lease updated: ${leaseNickname || 'Unnamed lease'} for ${tenantName}`;
      break;
    case "EXPIRED":
      message = `Lease expired: ${leaseNickname || 'Unnamed lease'} for ${tenantName}`;
      break;
    case "RENEWED":
      message = `Lease renewed: ${leaseNickname || 'Unnamed lease'} for ${tenantName}`;
      break;
    default:
      message = `Lease ${action.toLowerCase()}: ${leaseNickname || 'Unnamed lease'}`;
  }
  
  await createNotification(userId, type, message);
};

/**
 * Create a maintenance notification
 */
export const createMaintenanceNotification = async (userId, maintenanceData, action) => {
  const { title, description, unit, property } = maintenanceData;
  const unitLabel = unit ? unit.label : 'Unknown unit';
  const propertyTitle = property ? property.title : 'Unknown property';
  
  let message = "";
  let type = "MAINTENANCE";
  
  switch (action) {
    case "CREATED":
      message = `New maintenance request: ${title} in ${unitLabel} at ${propertyTitle}`;
      break;
    case "UPDATED":
      message = `Maintenance request updated: ${title} in ${unitLabel}`;
      break;
    case "COMPLETED":
      message = `Maintenance completed: ${title} in ${unitLabel}`;
      break;
    case "CANCELLED":
      message = `Maintenance cancelled: ${title} in ${unitLabel}`;
      break;
    default:
      message = `Maintenance ${action.toLowerCase()}: ${title}`;
  }
  
  await createNotification(userId, type, message);
};

/**
 * Create a message notification
 */
export const createMessageNotification = async (userId, messageData) => {
  const { sender, content, conversation } = messageData;
  const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown sender';
  
  // Don't include message content in notification to protect privacy
  // This prevents deleted messages from being visible in notifications
  const message = `New message from ${senderName}`;
  const type = "MESSAGE";
  
  await createNotification(userId, type, message);
};

/**
 * Create a tenant notification
 */
export const createTenantNotification = async (userId, tenantData, action) => {
  const { firstName, lastName, email } = tenantData;
  const tenantName = `${firstName || ''} ${lastName || ''}`.trim() || email || 'Unknown tenant';
  
  let message = "";
  let type = "TENANT";
  
  switch (action) {
    case "REGISTERED":
      message = `New tenant registered: ${tenantName}`;
      break;
    case "UPDATED":
      message = `Tenant profile updated: ${tenantName}`;
      break;
    case "DELETED":
      message = `Tenant removed: ${tenantName}`;
      break;
    default:
      message = `Tenant ${action.toLowerCase()}: ${tenantName}`;
  }
  
  await createNotification(userId, type, message);
};

/**
 * Create a property notification
 */
export const createPropertyNotification = async (userId, propertyData, action) => {
  const { title, type: propertyType } = propertyData;
  
  let message = "";
  let type = "PROPERTY";
  
  switch (action) {
    case "CREATED":
      message = `New property added: ${title} (${propertyType})`;
      break;
    case "UPDATED":
      message = `Property updated: ${title}`;
      break;
    case "DELETED":
      message = `Property removed: ${title}`;
      break;
    default:
      message = `Property ${action.toLowerCase()}: ${title}`;
  }
  
  await createNotification(userId, type, message);
};

/**
 * Create a system notification
 */
export const createSystemNotification = async (userId, systemMessage) => {
  const message = systemMessage;
  const type = "SYSTEM";
  
  await createNotification(userId, type, message);
};

/**
 * Create notifications for multiple users (e.g., all landlords for system-wide events)
 */
export const createBulkNotification = async (userIds, type, message) => {
  const promises = userIds.map(userId => createNotification(userId, type, message));
  await Promise.all(promises);
};
