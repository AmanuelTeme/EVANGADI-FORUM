// routes/aiRoutes.js

const express = require("express");
const router = express.Router();
// Import all three functions
const {
  chatWithAI,
  getChatHistory,
  getAllChatSessions,
} = require("../controller/aiController");

router.post("/chat", chatWithAI);
router.get("/history", getChatHistory);

router.get("/sessions", getAllChatSessions);
module.exports = router;
