const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../config/dbConfig"); // Your DB connection

// Get Answers for a Question
async function getAnswer(req, res) {
  const questionid = req.params.question_id;
  try {
    const [rows] = await dbConnection.query(
      `SELECT
    a.answerid,
    a.userid AS answer_userid,
    a.answer,
    a.created_at AS createdAt,
    a.rating_count,
    u.username
FROM
    answers a
INNER JOIN users u ON a.userid = u.userid
WHERE
    a.questionid = ?
ORDER BY a.created_at DESC`, // Order by creation date to show latest first
      [questionid]
    );
    return res.status(StatusCodes.OK).json({ rows });
  } catch (err) {
    console.error("Error in getAnswer:", err); // Use console.error
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Post Answers for a Question
async function postAnswer(req, res) {
  const { userid, answer, questionid } = req.body;

  // Create a new date object and adjust to UTC+3 hours
  const currentTimestamp = new Date();
  const adjustedDate = new Date(
    currentTimestamp.getTime() + 3 * 60 * 60 * 1000
  );
  const formattedTimestamp = adjustedDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  if (!userid || !answer || !questionid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  try {
    // When inserting, also set rating_count to 0 initially
    await dbConnection.query(
      "INSERT INTO answers (userid, answer, questionid, createdAt, rating_count) VALUES (?, ?, ?, ?, ?)",
      [userid, answer, questionid, formattedTimestamp, 0] // Initialize rating_count to 0
    );
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "Answer posted successfully" });
  } catch (err) {
    console.error("Error in postAnswer:", err); // Use console.error
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// NEW FUNCTION: rateAnswer (Controller + Service Logic Combined)
async function rateAnswer(req, res) {
  const { answerId, ratingType } = req.body;
  // Assuming authMiddleware attaches user info to req.user
  const { userid } = req.user; // Ensure this is `userid` from auth middleware

  if (!answerId || !ratingType || !userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Missing required rating information." });
  }

  if (ratingType !== "upvote" && ratingType !== "downvote") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Invalid rating type. Must be 'upvote' or 'downvote'." });
  }

  let connection; // Declare connection outside try-catch for finally block access
  try {
    connection = await dbConnection.getConnection();
    await connection.beginTransaction(); // Start a transaction for atomicity

    const newRatingValue = ratingType === "upvote" ? 1 : -1; // Value to store in DB
    let currentRatingChange = 0; // The change to apply to answer.rating_count

    // 1. Check if the user has already rated this answer
    // Corrected column names: `ratingid`, `answerid`, `userid`, `vote_type`
    const [existingRating] = await connection.query(
      "SELECT ratingid, vote_type FROM answer_ratings WHERE answerid = ? AND userid = ?",
      [answerId, userid]
    );

    if (existingRating.length > 0) {
      // User has already rated this answer
      const oldVoteType = existingRating[0].vote_type; // This will be 1 or -1
      const existingRatingId = existingRating[0].ratingid; // Corrected column name

      if (oldVoteType === newRatingValue) {
        // User clicked the same rating type again (toggle off/undo existing vote)
        await connection.query(
          "DELETE FROM answer_ratings WHERE ratingid = ?", // Corrected column name
          [existingRatingId]
        );
        currentRatingChange = -oldVoteType; // Reverse the effect of the previous vote
      } else {
        // User changed their rating (e.g., from upvote (1) to downvote (-1) or vice-versa)
        await connection.query(
          "UPDATE answer_ratings SET vote_type = ? WHERE ratingid = ?", // Corrected column names
          [newRatingValue, existingRatingId] // Store the numeric value (1 or -1)
        );
        currentRatingChange = newRatingValue - oldVoteType; // Calculate the difference
      }
    } else {
      // User is rating for the first time
      // Corrected column names: `answerid`, `userid`, `vote_type`
      await connection.query(
        "INSERT INTO answer_ratings (answerid, userid, vote_type) VALUES (?, ?, ?)",
        [answerId, userid, newRatingValue] // Store the numeric value (1 or -1)
      );
      currentRatingChange = newRatingValue; // Add the new vote's value
    }

    // 2. Update the total rating count in the 'answers' table
    await connection.query(
      "UPDATE answers SET rating_count = rating_count + ? WHERE answerid = ?",
      [currentRatingChange, answerId]
    );

    // 3. Get the new total rating for the answer to send back to the frontend
    const [updatedAnswer] = await connection.query(
      "SELECT rating_count FROM answers WHERE answerid = ?",
      [answerId]
    );

    await connection.commit(); // Commit all changes if everything succeeded

    res.status(StatusCodes.OK).json({
      msg: "Rating updated successfully",
      newTotalRating: updatedAnswer[0].rating_count,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback(); // Rollback changes if any error occurs
    }
    console.error("Error in rateAnswer:", error.message); // Log the specific error
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: error.message || "Failed to update rating. Please try again.",
    });
  } finally {
    if (connection) {
      connection.release(); // Always release the connection
    }
  }
}

// Export all the functions that will be used as route handlers
module.exports = {
  getAnswer,
  postAnswer,
  rateAnswer, // Export the new rating function
};
