// file: rateLimiter.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";


// globalLimiter: general request throttling per IP
// -------------------- GLOBAL LIMITER --------------------
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ message: "Too many requests from this IP, please try again later." }),
});
