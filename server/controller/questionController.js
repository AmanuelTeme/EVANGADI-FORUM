const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../config/dbConfig");
const crypto = require("crypto");

// post questions / ask questions
async function postQuestion(req, res) {
  const { userid, title, description, tag } = req.body;
  // Create a new date object
  const currentTimestamp = new Date();

  // Adjust the time by UTC+3 hours
  const adjustedDate = new Date(
    currentTimestamp.getTime() + 3 * 60 * 60 * 1000
  );

  // Format the date as 'YYYY-MM-DD HH:mm:ss'
  const formattedTimestamp = adjustedDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  if (!userid || !title || !description) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }
  const questionid = crypto.randomBytes(10).toString("hex");
  try {
    await dbConnection.query(
      "insert into questions (questionid, userid, title, description, tag,createdAt) values ( ?, ?, ?, ?, ?,?)",
      [questionid, userid, title, description, tag, formattedTimestamp]
    );
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "question posted successfully" });
  } catch (err) {
    console.error(err); // Use console.error for errors
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR) // Use StatusCodes for consistency
      .json({ message: "Something went wrong, please try again later" });
  }
}

// get all questions -- CORRECTED FUNCTION
async function getAllQuestions(req, res) {
  try {
    const [questions] = await dbConnection.query(`SELECT
        q.questionid,
        q.title,
        q.description,
        q.createdAt,
        u.username
      FROM questions q
      INNER JOIN users u ON q.userid = u.userid
      ORDER BY q.createdAt DESC`); // Removed extra spaces/invisible characters
    return res.status(StatusCodes.OK).json({
      message: questions,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// get single question and answers (updated to fetch q.userid and solution_answer_id)
async function getQuestionAndAnswer(req, res) {
  const questionid = req.params.questionId;

  try {
    const [questionRows] = await dbConnection.query(
      `SELECT
          q.questionid,
          q.userid AS qtn_userid, -- Fetch the question owner's ID
          q.title,
          q.description,
          q.createdAt AS qtn_createdAt,
          u.username AS qtn_username,
          q.solution_answer_id -- Fetch the solution answer ID
        FROM questions q
        INNER JOIN users u ON q.userid = u.userid
        WHERE q.questionid = ?`,
      [questionid]
    );

    if (questionRows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Question not found" });
    }

    const questionDetails = questionRows[0];

    const [answersRows] = await dbConnection.query(
      `SELECT
          a.answerid,
          a.userid,
          a.answer,
          a.createdAt,
          a.rating_count,
          u.username AS answer_username
        FROM answers a
        INNER JOIN users u ON a.userid = u.userid
        WHERE a.questionid = ?
        ORDER BY a.createdAt DESC`,
      [questionid]
    );
    // questionDetails.answers = answersRows;

    questionDetails.answers = answersRows.map((answer) => ({
      answerid: answer.answerid,
      userid: answer.userid,
      username: answer.answer_username,
      answer: answer.answer,
      createdAt: answer.createdAt,
      rating_count: answer.rating_count,
    }));

    res.status(StatusCodes.OK).json(questionDetails);
  } catch (error) {
    console.error("Error fetching question details:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching question details. Please try again later.",
    });
  }
}

// NEW FUNCTION: Mark an answer as a solution
async function markAnswerAsSolution(req, res) {
  const { questionId } = req.params;
  const { solutionAnswerId } = req.body;
  const loggedInUserId = req.user.userid; // User ID from authMiddleware

  if (!solutionAnswerId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Solution answer ID is required." });
  }

  try {
    // 1. Verify if the logged-in user is the owner of the question
    const [questionRows] = await dbConnection.query(
      `SELECT userid FROM questions WHERE questionid = ?`,
      [questionId]
    );

    if (questionRows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Question not found." });
    }

    const questionOwnerId = questionRows[0].userid;

    if (questionOwnerId !== loggedInUserId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "You are not authorized to mark a solution for this question.",
      });
    }

    // 2. Verify if the solutionAnswerId belongs to an answer for this question
    const [answerRows] = await dbConnection.query(
      `SELECT answerid FROM answers WHERE questionid = ? AND answerid = ?`,
      [questionId, solutionAnswerId]
    );

    if (answerRows.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "The provided answer ID is not valid for this question.",
      });
    }

    // 3. Update the questions table to mark the solution
    await dbConnection.query(
      `UPDATE questions SET solution_answer_id = ? WHERE questionid = ?`,
      [solutionAnswerId, questionId]
    );

    res
      .status(StatusCodes.OK)
      .json({ msg: "Answer marked as solution successfully." });
  } catch (error) {
    console.error("Error marking answer as solution:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to mark answer as solution. Please try again later.",
    });
  }
}

module.exports = {
  postQuestion,
  getAllQuestions,
  getQuestionAndAnswer,
  markAnswerAsSolution,
};
