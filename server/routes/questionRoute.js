const express = require("express");
const router = express.Router();

const {
  postQuestion,
  getAllQuestions,
  getQuestionAndAnswer,
  markAnswerAsSolution, // Import the new function
} = require("../controller/questionController");
const authMiddleware = require("../middleware/authMiddleware"); // Import it here

// get all questions
router.get("/questions", authMiddleware, getAllQuestions);

// get single question and its answers
router.get("/question/:questionId", getQuestionAndAnswer);

// post a question
router.post("/question", authMiddleware, postQuestion);

// NEW ROUTE: Mark an answer as a solution
router.patch(
  "/question/:questionId/mark-solution",
  authMiddleware,
  markAnswerAsSolution
);

module.exports = router;
