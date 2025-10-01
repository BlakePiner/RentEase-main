import { Router } from "express";
import { handleChatbotMessage } from "../controllers/chatbotController.js";

const router = Router();

// Chatbot endpoint
router.post("/", handleChatbotMessage);

export default router;
