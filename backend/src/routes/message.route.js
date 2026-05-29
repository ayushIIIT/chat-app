import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
import { moderationMiddleware } from "../middleware/moderation.Middleware.js";
import { sendAIMessage } from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

// Normal message route — goes through moderation first
router.post("/send/:id", protectRoute, moderationMiddleware, sendMessage);

// AI chatbot route — skips moderation, handled separately
// POST /api/messages/ai/:id  (id = receiverId, needed to save message in correct conversation)
router.post("/ai/:id", protectRoute, sendAIMessage);

export default router;