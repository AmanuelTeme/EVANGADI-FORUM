require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../config/dbConfig"); // Import your database connection

// Use a currently supported model. 'gemini-1.5-flash' is a good balance of speed and capability.
// If you need more advanced reasoning, try 'gemini-1.5-pro' (check availability for your API key).
const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// --- Backend Initialization Logs ---
console.log("Backend Init: MODEL_NAME set to:", MODEL_NAME);
console.log(
  "Backend Init: API_KEY present (first 5 chars):",
  API_KEY ? API_KEY.substring(0, 5) + "..." : "NOT SET"
);
// --- End Backend Initialization Logs ---

if (!API_KEY) {
  console.error(
    "GEMINI_API_KEY is not set in environment variables. Please check your .env file and server restart."
  );
  // It's good practice to prevent the server from starting if a crucial API key is missing
  throw new Error("Missing GEMINI_API_KEY. Server cannot start without it.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function saveMessageToDb(sessionId, userId, role, content) {
  try {
    // Ensure userId is explicitly null if it's undefined from the request body
    const actualUserId = userId === undefined ? null : userId;
    const [result] = await dbConnection.execute(
      `INSERT INTO chat_history (session_id, userid, role, content) VALUES (?, ?, ?, ?)`,
      [sessionId, actualUserId, role, content]
    );
    console.log(`Saved ${role} message to DB, ID: ${result.insertId}`);
  } catch (dbError) {
    console.error("Error saving message to database:", dbError);
    // Log the error but don't prevent the AI response from being sent
  }
}

async function loadHistoryFromDb(sessionId) {
  try {
    const [rows] = await dbConnection.execute(
      `SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC`,
      [sessionId]
    );
    // The Gemini SDK expects history to be an array of objects like { role: 'user', parts: [{ text: '...' }] }
    return rows.map((row) => ({
      role: row.role,
      parts: [{ text: row.content }],
    }));
  } catch (dbError) {
    console.error("Error loading chat history from database:", dbError);
    return []; // Return empty history on error
  }
}

async function chatWithAI(req, res) {
  const { message, sessionId, userId } = req.body; // `userId` might be undefined

  // --- Chatbot Request Logging ---
  console.log("--- Chatbot Request Received ---");
  console.log("Session ID:", sessionId);
  console.log("User ID:", userId); // This will show 'undefined' if not sent from frontend
  console.log("Incoming Message:", message);
  // --- End Chatbot Request Logging ---

  if (!message) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Message is required." });
  }
  if (!sessionId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Session ID is required for chat memory." });
  }

  try {
    // 1. Save user's message to DB immediately
    await saveMessageToDb(sessionId, userId, "user", message);

    // 2. Load full conversation history from DB for the Gemini API call
    // This provides context for the AI to understand the ongoing conversation
    const loadedHistory = await loadHistoryFromDb(sessionId);

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Start a chat with the loaded history as context
    const chat = model.startChat({
      history: loadedHistory,
      generationConfig: {
        maxOutputTokens: 200, // Limit AI response length
      },
    });

    // Send the new user message to the AI
    const result = await chat.sendMessage([{ text: message }]);
    const response = await result.response;
    const aiText = response.text();

    // 3. Save AI's response to DB
    await saveMessageToDb(sessionId, userId, "model", aiText);

    console.log("AI Reply received successfully.");

    res.status(StatusCodes.OK).json({ reply: aiText });
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to get response from AI. Please try again later.",
      error: error.message,
    });
  }
}

async function getChatHistory(req, res) {
  const { sessionId } = req.query; // Assuming sessionId comes as a query parameter

  if (!sessionId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Session ID is required to fetch history." });
  }

  try {
    const [rows] = await dbConnection.execute(
      `SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC`,
      [sessionId]
    );
    // Frontend expects { role: 'user', parts: '...' } format
    const historyForFrontend = rows.map((row) => ({
      role: row.role,
      parts: row.content, // Send content as string back to frontend
    }));
    res.status(StatusCodes.OK).json({ history: historyForFrontend });
  } catch (error) {
    console.error("Error fetching chat history from DB:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to fetch chat history.",
      error: error.message,
    });
  }
}

async function getAllChatSessions(req, res) {
  // If you have authenticated users, you'd typically get userId from req.user.id (from middleware)
  // For now, it lists all unique sessions.
  // Uncomment and adjust if you implement user-specific session filtering:
  // const { userId } = req.query;

  try {
    let query = `
      SELECT
        session_id,
        MAX(timestamp) AS last_updated_at,
        SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN role = 'user' THEN content END ORDER BY timestamp ASC), ',', 1) AS first_user_message
      FROM chat_history
      -- WHERE user_id = ? -- Uncomment and add params.push(userId) if filtering by user
      GROUP BY session_id
      ORDER BY last_updated_at DESC
    `;
    let params = [];

    // If you plan to filter by user:
    // if (userId) {
    //   query = `
    //     SELECT
    //       session_id,
    //       MAX(timestamp) AS last_updated_at,
    //       SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN role = 'user' THEN content END ORDER BY timestamp ASC), ',', 1) AS first_user_message
    //     FROM chat_history
    //     WHERE user_id = ?
    //     GROUP BY session_id
    //     ORDER BY last_updated_at DESC
    //   `;
    //   params = [userId];
    // }

    const [rows] = await dbConnection.execute(query, params);

    const sessions = rows.map((row) => ({
      id: row.session_id,
      // Attempt to use the first user message as the name, or a default
      name: row.first_user_message
        ? row.first_user_message.substring(0, 50) +
          (row.first_user_message.length > 50 ? "..." : "")
        : `Chat Session: ${row.session_id.substring(0, 8)}...`,
      last_updated: new Date(row.last_updated_at).toLocaleString(),
    }));

    res.status(StatusCodes.OK).json({ sessions });
  } catch (error) {
    console.error("Error fetching all chat sessions from DB:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to fetch chat sessions.",
      error: error.message,
    });
  }
}

module.exports = { chatWithAI, getChatHistory, getAllChatSessions };
