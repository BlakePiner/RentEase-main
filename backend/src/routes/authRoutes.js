// file: authRoutes.js
import { Router } from "express";
import { checkAuthStatus, forgotPassword, getUserInfo, login, logout, onboarding, refresh, register, resendVerification, resetPassword, updateProfile, verifyEmail } from "../controllers/authController.js";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../controllers/notificationController.js";
import { requireAuthentication } from "../middlewares/requireAuthentication.js";

const router = Router();

// Auth routes
router.post("/register", register);                  // Register user
router.post("/verify-email", verifyEmail);               // Verify email
router.post("/resend-verification", resendVerification);       // Resend verification email

router.post("/forgot-password", forgotPassword);           // Send reset email
router.post("/reset-password", resetPassword);            // Reset password

router.post("/login", login);                     // Login, set JWT cookies
router.post("/refresh", refresh);                       // Refresh tokens (public, uses refresh token cookie)

router.get("/status", checkAuthStatus); // <-- public route to check login + role

router.get("/me", requireAuthentication(["ANY_ROLE"]), getUserInfo);                         // Get current user (protected)
router.put("/onboarding", requireAuthentication(["ANY_ROLE"]), onboarding)                  // Onboarding User (protected)
router.put("/update-profile", requireAuthentication(["ANY_ROLE"]), updateProfile)                  // Update User (protected)

// Notification routes
router.get("/notifications", requireAuthentication(["ANY_ROLE"]), getUserNotifications);     // Get user notifications
router.put("/notifications/:notificationId/read", requireAuthentication(["ANY_ROLE"]), markNotificationAsRead); // Mark notification as read
router.put("/notifications/read-all", requireAuthentication(["ANY_ROLE"]), markAllNotificationsAsRead); // Mark all notifications as read
router.delete("/notifications/:notificationId", requireAuthentication(["ANY_ROLE"]), deleteNotification); // Delete notification

router.post("/logout", logout);                    // Logout, clear cookies

export default router;
