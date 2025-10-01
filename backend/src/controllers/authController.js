// file: authController.js
import prisma, { resetPrismaConnection } from "../libs/prismaClient.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { emailVerificationTemplate } from "../services/email/templates/emailVerification.js";
import { registrationWelcomeTemplate } from "../services/email/templates/registrationWelcome.js";
import { resetPasswordTemplate } from "../services/email/templates/resetPassword.js"
import { sendEmail } from "../services/email/emailSender.js";
import redis from "../libs/redisClient.js";
import jwt from "jsonwebtoken";

// Helper function to retry database operations
const retryDbOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      // Check for prepared statement conflicts or connection issues
      const isPreparedStatementError = error.message && (
        error.message.includes('prepared statement') ||
        error.message.includes('already exists') ||
        error.code === '42P05'
      );
      
      if (isPreparedStatementError && i < maxRetries - 1) {
        console.log(`Database operation failed due to prepared statement conflict, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        // Reset the connection if it's a prepared statement error
        await resetPrismaConnection();
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}; 
import supabase from "../libs/supabaseClient.js";

// authentication 
const ACCESS_TOKEN_TTL = "1h";              // JWT access token: 1 hour
const REFRESH_TOKEN_TTL = "5h";             // JWT refresh token: 5 hours

const ACCESS_COOKIE_TTL_MS = 60 * 60 * 1000; // 1 hour (in ms)
const REFRESH_COOKIE_TTL_MS = 5 * 60 * 60 * 1000; // 5 hours (in ms)

const SESSION_TTL_SECONDS = 60 * 60 * 5;    // 5 hours (in seconds, for Redis)


// email verification
const OTP_TTL = 10 * 60; // 10 minutes
const MAX_OTP_ATTEMPTS = 8; // maximum OTP verification attempts
const MAX_RESEND_ATTEMTPS = 1; // maximum resend verification attempts

// reset password
const RESET_PASSWORD_TTL = 10 * 60 ; // 10 minutes 

// ---------------------------------------------- REGISTER ----------------------------------------------
// Handles new user registration, generates OTP, and sends verification email
export const register = async (req, res) => {
  try {
    // Destructure request body
    let { email, password, confirmPassword, role } = req.body;

    // Validate required fields
    if (!email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Trim inputs
    email = email.trim();
    password = password.trim();
    confirmPassword = confirmPassword.trim();
    role = role.trim().toUpperCase();

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must have at least 8 characters including uppercase, lowercase, number, and symbol"
      });
    }

    // Validate role
    if (!["LANDLORD", "TENANT"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    await prisma.user.create({ data: { email, passwordHash, role } });

    // Generate OTP and token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(16).toString("hex");
    const key = `verify_email:${token}`;

    // Store OTP and token in Redis (attempts and resends initialized as strings)
    await redis.hset(key, { email, otp, attempts: "0", resends: "0",  context: "register" });
    await redis.expire(key, OTP_TTL);

    // Send verification email
    await sendEmail({
      to: email,
      subject: "RentEase Email Verification",
      html: emailVerificationTemplate(email, otp)
    });

    return res.status(201).json({
      message: "Success! Check your email for the OTP code.",
      token
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// ---------------------------------------------- VERIFY EMAIL ----------------------------------------------
export const verifyEmail = async (req, res) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({ message: "Token and OTP are required" });
    }

    const key = `verify_email:${token}`;
    const data = await redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    let attempts = Number(data.attempts);

    if (attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        message: "Maximum OTP attempts reached. Try again later.",
      });
    }

    if (String(otp) !== String(data.otp)) {
      attempts += 1;
      await redis.hset(key, { attempts: attempts.toString() });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP correct → verify user
    await prisma.user.update({
      where: { email: data.email },
      data: { isVerified: true },
    });

    await sendEmail({
      to: data.email,
      subject: "Welcome to RentEase!",
      html: registrationWelcomeTemplate(data.email),
    });

    await redis.del(key);

    // ✅ Context-based response
    if (data.context === "login") {
      return res.status(200).json({
        message: "Email verified successfully",
        context: "login",
      });
    }

    // Default (registration flow)
    return res.status(200).json({
      message: "Email verified successfully",
      context: "register",
    });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



// ---------------------------------------------- RESEND VERIFICATION ----------------------------------------------
// Handles OTP resending with safety checks for max resends and attempts
export const resendVerification = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const key = `verify_email:${token}`;
        const data = await redis.hgetall(key);

        // token not found or expired
        if (!data) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const attempts = Number(data.attempts); // convert string to number
        let resends = Number(data.resends);     // convert string to number

        // block if max attempts reached
        if (attempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ message: "Maximum OTP attempts reached. Cannot resend." });
        }

        // block if max resend reached
        if (resends >= MAX_RESEND_ATTEMTPS) {
            return res.status(429).json({ message: "OTP has already been resent. Cannot resend again." });
        }

        // increment resends
        resends += 1;

        // generate new OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // update only otp and resends safely
        await redis.hset(key, { otp: newOtp, resends: resends.toString() });
        await redis.expire(key, OTP_TTL);

        // send verification email
        await sendEmail({
            to: data.email,
            subject: "RentEase Email Verification (Resent)",
            html: emailVerificationTemplate(data.email, newOtp)
        });

        return res.status(200).json({ message: "Verification email resent successfully" });

    } catch (err) {
        console.error("Resend verification error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// ---------------------------------------------- FORGOT PASSWORD ----------------------------------------------
// Handles sending password reset email with token
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    // Invalid if user not found or soft-deleted
    if (!user) {
      return res.status(404).json({ message: "Invalid email" });
    }

    // Block if disabled
    if (user.isDisabled) {
      return res
        .status(403)
        .json({ message: "Account is disabled due to violations" });  
    }

    // ✅ Check last password change (3-day restriction)
    if (user.lastPasswordChange) {
      const now = new Date();
      const diffMs = now - user.lastPasswordChange;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays < 3) {
        return res.status(429).json({
          message:
            "You can only change your password once every 3 days. Please try again later.",
        });
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(16).toString("hex");
    const key = `reset_password:${token}`;

    // Store reset request in Redis (expires in 10 minutes)
    await redis.hset(key, { email: user.email });
    await redis.expire(key, RESET_PASSWORD_TTL); // 10 minutes

    // Build reset URL (frontend route)
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: "Reset your RentEase password",
      html: resetPasswordTemplate(user.email, resetUrl),
    });

    return res.status(200).json({ message: "Password reset instructions sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------------------------------------- RESET PASSWORD ----------------------------------------------
// Handles resetting the user's password using token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Token, new password, and confirm password are required" });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // ✅ Password strength validation
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPolicy.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    // Look up Redis token
    const key = `reset_password:${token}`;
    const data = await redis.hgetall(key);

    if (!data || !data.email) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(404).json({ message: "Invalid account" });
    }
   

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update user password and lastPasswordChange
    await prisma.user.update({
      where: { email: user.email },
      data: {
        passwordHash: hashed,
        lastPasswordChange: new Date(),
      },
    });

    // Invalidate token
    await redis.del(key);

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// ---------------------------------------------- LOGIN ----------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userIp = req.ip;

    console.log('Login attempt for email:', email, 'from IP:', userIp);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user with retry mechanism
    const user = await retryDbOperation(async () => {
      return await prisma.user.findUnique({ where: { email } });
    });
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" });
    }


    if (user.isDisabled) {
      return res.status(403).json({
        code: "ACCOUNT_DISABLED",
        message: "Account is disabled due to violations",
      });
    }

    // -------------------------------- PASSWORD CHECK --------------------------------
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ----------------- One session per IP -----------------
    const sessionId = crypto.randomBytes(16).toString("hex");
    const sessionKey = `session:${user.id}:${userIp}`;
    await redis.setex(sessionKey, SESSION_TTL_SECONDS, sessionId); // 7 days TTL

    // Access token (short-lived)
    const accessToken = jwt.sign(
      { userId: user.id, sid: sessionId, ip: userIp },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId: user.id, sid: sessionId, ip: userIp },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Send cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: ACCESS_COOKIE_TTL_MS,
      path: "/", // make sure it's sent everywhere
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: REFRESH_COOKIE_TTL_MS,
      path: "/", // make sure it's sent everywhere
    });

    // -------------------------------- EMAIL VERIFICATION FLOW --------------------------------
    if (!user.isVerified) {
      // Clear old verification tokens for this email
      const existingKeys = await redis.keys("verify_email:*");
      for (const key of existingKeys) {
        const data = await redis.hgetall(key);
        if (data.email === user.email) {
          await redis.del(key);
        }
      }

      // Issue a new OTP token
      const token = crypto.randomBytes(16).toString("hex");
      const key = `verify_email:${token}`;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await redis.hset(key, {
        email: user.email,
        otp,
        attempts: "0",
        resends: "0",
        context: "login",
      });
      await redis.expire(key, OTP_TTL);

      await sendEmail({
        to: user.email,
        subject: "RentEase Email Verification",
        html: emailVerificationTemplate(user.email, otp),
      });

      return res.status(200).json({
        message: "Login pending verification",
        verified: false,
        token, // pass this to verification page
      });
    }

    // If verified → normal login success
    return res.status(200).json({
      message: "Login successful",
      verified: true,
    });
  } catch (err) {
    console.error("Login error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------------------------------------- REFRESH ----------------------------------------------
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    const userIp = req.ip;

    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    // Verify refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const { userId, sid } = payload;

    // Validate session in Redis
    const sessionKey = `session:${userId}:${userIp}`;
    const storedSessionId = await redis.get(sessionKey);

    if (!storedSessionId || storedSessionId !== sid) {
      return res.status(403).json({ message: "Session invalid or expired" });
    }

    // ----------------- ROTATE TOKENS -----------------

    // 1. Access token (short-lived)
    const newAccessToken = jwt.sign(
      { userId, sid, ip: userIp },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // 2. Refresh token (reset TTL back to full 7d)
    const newRefreshToken = jwt.sign(
      { userId, sid, ip: userIp },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL }
    );

    // 3. Reset Redis session TTL to keep session alive
    await redis.expire(sessionKey, SESSION_TTL_SECONDS);

    // ----------------- SET COOKIES -----------------
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: ACCESS_COOKIE_TTL_MS,
      path: "/",
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: REFRESH_COOKIE_TTL_MS,
      path: "/",
    });

    return res.status(200).json({ message: "Token refreshed" });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------------------------------------- LOGOUT ----------------------------------------------
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    const userIp = req.ip;

    if (token) {
      try {
        // Decode token without throwing if invalid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userId } = decoded;

        if (userId) {
          // Remove session from Redis
          await redis.del(`session:${userId}:${userIp}`);
          console.log(`Session cleared for user ${userId} at IP ${userIp}`);
        }
      } catch (err) {
        console.warn("Invalid or expired token, skipping Redis session cleanup");
      }
    }

    // Clear access token cookie regardless of login state
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------------------------------------- GET USER INFO (/me) ----------------------------------------------
export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id; // attached by requireAuthentication

    // Fetch user info from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,

        firstName: true,
        middleName: true,
        lastName: true,
        avatarUrl: true,
        birthdate: true,
        gender: true,
        bio: true,
        
        phoneNumber: true,
        messengerUrl: true,
        facebookUrl: true,
        whatsappUrl: true,
        isVerified: true,
        isDisabled: true,
        lastLogin: true,
        lastPasswordChange: true,
        hasSeenOnboarding: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format dates as ISO strings
    const formattedUser = {
      ...user,
      birthdate: user.birthdate?.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      lastPasswordChange: user.lastPasswordChange?.toISOString(),
    };

    return res.status(200).json({ user: formattedUser });
  } catch (err) {
    console.error("Get user info error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------------------------------------- UPDATE PROFILE ----------------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      middleName,
      lastName,
      avatarUrl, // may be new uploaded URL or null if removed
      birthdate,
      gender,
      bio,
      phoneNumber,
      messengerUrl,
      facebookUrl,
      whatsappUrl,
    } = req.body;

    // ✅ Fetch current user (to check for old avatar)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // ✅ If new avatar uploaded (not null), delete old one
    if (
      avatarUrl && // new image provided
      currentUser?.avatarUrl &&
      currentUser.avatarUrl !== avatarUrl
    ) {
      try {
        // Example: https://...supabase.co/storage/v1/object/public/rentease-images/avatars/uuid.jpg
        const baseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/rentease-images/`;
        if (currentUser.avatarUrl.startsWith(baseUrl)) {
          const oldPath = currentUser.avatarUrl.replace(baseUrl, ""); // gives "avatars/uuid.jpg"

          if (oldPath) {
            const { error } = await supabase.storage
              .from("rentease-images")
              .remove([oldPath]);

            if (error) {
              console.warn("⚠️ Supabase delete error:", error.message);
            } else {
              console.log(`✅ Old avatar deleted: ${oldPath}`);
            }
          }
        }
      } catch (delErr) {
        console.warn("⚠️ Failed to delete old avatar:", delErr.message);
      }
    }

    // ✅ Build dynamic update object
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (middleName !== undefined) updateData.middleName = middleName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl; // can be new URL or null
    if (birthdate !== undefined)
      updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (messengerUrl !== undefined) updateData.messengerUrl = messengerUrl;
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (whatsappUrl !== undefined) updateData.whatsappUrl = whatsappUrl;

    // ✅ Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// ---------------------------------------------- COMPLETE USER ONBOARDING ----------------------------------------------
export const onboarding = async (req, res) => {
  try {
    const userId = req.user.id; // from requireAuthentication
    const {
      firstName,
      middleName,
      lastName,
      avatarUrl,
      birthdate,
      gender,
      bio,
      phoneNumber,
      messengerUrl,
      facebookUrl,
      whatsappUrl,
    } = req.body;

    // Prevent re-onboarding
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasSeenOnboarding: true },
    });

    if (existingUser?.hasSeenOnboarding) {
      return res.status(422).json({ message: "Onboarding already completed" });
    }

    console.log(req.body);

    // Build update object dynamically to avoid overwriting existing fields
    const updateData = { hasSeenOnboarding: true };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (middleName !== undefined) updateData.middleName = middleName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (messengerUrl !== undefined) updateData.messengerUrl = messengerUrl;
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (whatsappUrl !== undefined) updateData.whatsappUrl = whatsappUrl;

    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return res.status(200).json({ message: "Profile successfully updated" });
  } catch (err) {
    console.error("Complete onboarding error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------------------------------------- CHECK AUTH STATUS ----------------------------------------------
export const checkAuthStatus = async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      // No token → not authenticated
      return res.status(401).json({ message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Token invalid or expired
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const { userId } = decoded;

    const user = await retryDbOperation(async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
    });

    if (!user) {
      // User not found
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Authenticated → return role
    return res.status(200).json({ role: user.role });
  } catch (err) {
    console.error("Check auth status error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
