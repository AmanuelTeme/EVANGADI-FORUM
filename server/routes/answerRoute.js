const express = require("express");
const router = express.Router();
// Import all functions from the combined controller/service file
const {
  getAnswer,
  postAnswer,
  rateAnswer,
} = require("../controller/answerController");
const authMiddleware = require("../middleware/authMiddleware"); // Assuming this is your auth middleware

// Get Answers for a Question
router.get("/answer/:question_id", getAnswer);

// Post Answers for a Question
router.post("/answer", authMiddleware, postAnswer); // Assuming postAnswer also requires authentication

// NEW ROUTE FOR RATING
router.post("/answer/rate", authMiddleware, rateAnswer); // Protected by authMiddleware

module.exports = router;
