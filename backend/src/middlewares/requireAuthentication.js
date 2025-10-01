// file: requireAuthentication.js
import jwt from "jsonwebtoken";
import prisma from "../libs/prismaClient.js";
import redis from "../libs/redisClient.js";

// Middleware for role-based authentication
// Use "ANY_ROLE" to allow any logged-in user
export const requireAuthentication = (allowedRoles = ["ANY_ROLE"]) => {
  return async (req, res, next) => {
    try {
      // 1. Read JWT from cookie
      const token = req.cookies?.accessToken;
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // 2. Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { userId, sid, ip: tokenIp } = decoded;

      if (!userId || !sid || !tokenIp) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const currentIp = req.ip;

      // 3. Validate session in Redis per IP
      const redisKey = `session:${userId}:${currentIp}`;
      let storedSessionId;
      
      try {
        storedSessionId = await redis.get(redisKey);
      } catch (redisError) {
        console.error("Redis connection error:", redisError.message);
        // If Redis is down, skip session validation for now
        console.log("⚠️ Redis unavailable, skipping session validation");
        storedSessionId = sid; // Assume session is valid if Redis is down
      }

      if (!storedSessionId || storedSessionId !== sid || currentIp !== tokenIp) {
        return res.status(401).json({ message: "Session expired or invalid" });
      }

      // 4. Query user for latest role & status
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isDisabled: true }
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.isDisabled) {
        return res.status(403).json({ message: "Account is disabled" });
      }

      // 5. Role-based access
      if (!(allowedRoles.includes("ANY_ROLE") || allowedRoles.includes(user.role))) {
        return res.status(403).json({ message: "Forbidden: Insufficient role" });
      }

      // 6. Attach user info
      req.user = { id: user.id, role: user.role, sid };

      return next();
    } catch (err) {
      console.error("Auth error:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};
