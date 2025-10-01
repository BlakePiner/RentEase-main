// file: app.js
// ------------------------------
// Main Express Application Setup
// ------------------------------

import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from './routes/authRoutes.js'
import landlordRoutes from './routes/landlordRoutes.js'
import { globalLimiter } from "./middlewares/requestRateLimiter.js";
import cookieParser from "cookie-parser";

const app = express();

// ------------------------------
// Middlewares
// ------------------------------

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // use value from .env
  credentials: true,                // allow cookies (important for JWT)
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse incoming JSON requests automatically
app.use(morgan("dev")); // HTTP request logger (dev = concise colorful logs)
app.use(globalLimiter); //Apply global limiter to all routes
app.use(cookieParser()); // Parse cookies
// ------------------------------
// Routes
// ------------------------------

app.use("/api/auth", authRoutes); // Auth routes
app.use("/api/landlord/", landlordRoutes); // Auth routes


// Default route (health check / welcome route)
app.get("/", (req, res) => {
  res.status(200).json({ message: "✅ Welcome to the API root route" });
});





// ------------------------------
// Export app instance
// ------------------------------
// This app will be used in server.js to start listening on a port
export default app;
