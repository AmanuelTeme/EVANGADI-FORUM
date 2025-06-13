const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./config/dbConfig");
const initializeDatabase = require("./config/TableSchema");
const authMiddleware = require("./middleware/authMiddleware");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
// Public route
app.get("/", (req, res) => {
  res.send("Hello, world! This is a public route.");
});

// Login simulation route to issue JWT token (for testing)
app.post("/login", (req, res) => {
  const { username, userid } = req.body;
  if (!username || !userid) {
    return res.status(400).json({ msg: "username and userid required" });
  }

  const token = jwt.sign({ username, userid }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.json({ token });
});

// Protected route using authMiddleware
app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    msg: "You accessed a protected route!",
    user: req.user,
  });
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
  },
});
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

(async () => {
  try {
    await initializeDatabase();
    console.log("Database initialized successfully on app startup.");
  } catch (err) {
    console.error("Failed to initialize database on startup:", err);
    process.exit(1);
  }
})();

// ==============================================
// In-memory store for currently active users (based on connection AND activity)
const activeUsers = {}; // { userId: { userId, username, avatar_url, sid, lastActivity, currentRoomId } }
const ACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
let lastKnownActiveUsersCount = 0;

// Define the public chat room ID
const PUBLIC_CHAT_ROOM_ID = "stackoverflow_lobby";
// ==============================================

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log(
    "App.js authenticateToken: Received Authorization Header:",
    authHeader
  );
  console.log(
    "App.js authenticateToken: Extracted Token:",
    token ? "Exists" : "Null/Undefined"
  );
  console.log("App.js authenticateToken: Using JWT_SECRET:", JWT_SECRET);

  if (!token) {
    console.error("App.js authenticateToken: No token provided. Sending 401.");
    return res
      .status(401)
      .json({ msg: "No token provided, authorization denied." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error(
        "App.js authenticateToken: Token verification failed:",
        err.message
      );
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ msg: "Token expired." });
      }
      return res.status(403).json({ msg: "Invalid token." });
    }
    req.user = user;
    console.log(
      "App.js authenticateToken: Token successfully verified. Decoded user:",
      req.user
    );
    next();
  });
};

const userRoutes = require("./routes/userRoutes");
app.use("/api/v1/user", userRoutes);

app.get("/api/check-user", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT userid, username, email, avatar_url FROM users WHERE userid = ?",
      [req.user.userid]
    );

    if (users.length === 0) {
      console.error(
        `User with ID ${req.user.userid} not found in DB after token verification.`
      );
      return res.status(404).json({ msg: "User not found in database." });
    }

    const authenticatedUserData = users[0];

    res.status(200).json({
      message: "Token is valid",
      user: {
        userid: authenticatedUserData.userid,
        username: authenticatedUserData.username,
        email: authenticatedUserData.email,
        avatar_url: authenticatedUserData.avatar_url,
      },
    });
    console.log("/api/check-user: Sent back authenticated user data.");
  } catch (error) {
    console.error("Error fetching user data in /api/check-user:", error);
    res.status(500).json({ msg: "Internal server error while checking user." });
  }
});

const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);
const questionRoutes = require("./routes/questionRoute");
app.use("/api/v1", questionRoutes);
const answerRoutes = require("./routes/answerRoute");
app.use("/api/v1", answerRoutes);

// Endpoint to fetch chat history for a room (optional, primarily for initial load)
app.get("/api/chat/history/:roomId", authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { type, targetUserId } = req.query; // Add query params for message type and target user
  const userId = req.user.userid; // Current authenticated user

  try {
    let query;
    let params;

    if (type === "private" && targetUserId) {
      const dmRoomId = getPrivateChatRoomId(userId, targetUserId);
      query = `
        SELECT message_id, user_id, username, message_text, room_id, message_type, recipient_id, created_at, edited_at, is_deleted, reactions, file_data, file_name, file_type
        FROM chat_messages
        WHERE room_id = ? AND message_type = 'private'
        ORDER BY created_at ASC LIMIT 200;
      `;
      params = [dmRoomId];
    } else {
      // Default to public if type is not private or targetUserId is missing
      query = `
        SELECT message_id, user_id, username, message_text, room_id, message_type, recipient_id, created_at, edited_at, is_deleted, reactions, file_data, file_name, file_type
        FROM chat_messages
        WHERE room_id = ? AND message_type = 'public'
        ORDER BY created_at ASC LIMIT 200;`;
      params = [roomId];
    }

    const [messages] = await db.query(query, params);
    const formattedMessages = messages.map((msg) => {
      return {
        ...msg,
        reactions: parseReactionsSafely(msg.reactions, msg.message_id), // Use the helper function here
        file_data: msg.file_data || null,
        file_name: msg.file_name || null,
        file_type: msg.file_type || null,
      };
    });
    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching chat history via HTTP:", error);
    res.status(500).json({ message: "Server error fetching chat history" });
  }
});

// Helper function to generate a consistent private chat room ID
// Ensures that DM between User A and User B always has the same room ID (e.g., "1-2" not "2-1")
function getPrivateChatRoomId(user1Id, user2Id) {
  const sortedIds = [user1Id, user2Id].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
}

// Helper function for robust JSON parsing of reactions
function parseReactionsSafely(reactionsString, messageId = "unknown") {
  if (
    typeof reactionsString === "string" &&
    reactionsString.trim().length > 0 &&
    reactionsString !== "[object Object]"
  ) {
    try {
      return JSON.parse(reactionsString);
    } catch (e) {
      console.error(
        `Error parsing reactions for message ID ${messageId}: ${e.message}. Raw reactions: '${reactionsString}'`
      );
      // Fallback to empty array if parsing fails
      return [];
    }
  } else if (reactionsString === "[object Object]") {
    // Handle the case where "[object Object]" string was stored
    console.warn(
      `Malformed reaction data "[object Object]" found for message ID ${messageId}. Initializing reactions to empty.`
    );
    return [];
  }
  return []; // Default for null, undefined, empty string, or non-string types
}
// ==============================================
// Socket.IO event handling
// ==============================================

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Emitted by frontend when a user joins the chat
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
    // Update user's current room tracking in activeUsers if available
    for (const userId in activeUsers) {
      if (activeUsers[userId].sid === socket.id) {
        activeUsers[userId].currentRoomId = roomId;
        console.log(
          `User ${activeUsers[userId].username} (ID: ${userId}) updated to room ${roomId}`
        );
        break;
      }
    }
    // Broadcast updated online users as their room status might change (though not explicitly displayed in public chat)
    io.emit(
      "online_users",
      Object.values(activeUsers).map((u) => ({
        userId: u.userId,
        username: u.username,
        avatar_url: u.avatar_url,
      }))
    );
  });

  // Emitted by frontend to fetch chat history (both public and private)
  socket.on("fetch_chat_history", async (data) => {
    const { userId, targetUserId } = data; // userId is the current logged-in user's ID
    let query;
    let params;

    if (targetUserId) {
      // It's a private chat
      const dmRoomId = getPrivateChatRoomId(userId, targetUserId);
      query = `
        SELECT message_id, user_id, username, message_text, room_id, message_type, recipient_id, created_at, edited_at, is_deleted, reactions, file_data, file_name, file_type
        FROM chat_messages
        WHERE room_id = ? AND message_type = 'private'
        ORDER BY created_at ASC LIMIT 200;
      `;
      params = [dmRoomId];
      console.log(`Fetching private chat history for room: ${dmRoomId}`);
    } else {
      // It's a public chat
      const roomId = PUBLIC_CHAT_ROOM_ID; // Ensure public room ID is used
      query = `
        SELECT message_id, user_id, username, message_text, room_id, message_type, recipient_id, created_at, edited_at, is_deleted, reactions, file_data, file_name, file_type
        FROM chat_messages
        WHERE room_id = ? AND message_type = 'public'
        ORDER BY created_at ASC LIMIT 200;
      `;
      params = [roomId];
      console.log(`Fetching public chat history for room: ${roomId}`);
    }

    try {
      const [messages] = await db.query(query, params);

      const formattedMessages = messages.map((msg) => {
        return {
          ...msg,
          reactions: parseReactionsSafely(msg.reactions, msg.message_id), // Use the helper function here
          file_data: msg.file_data || null,
          file_name: msg.file_name || null,
          file_type: msg.file_type || null,
        };
      });
      socket.emit("chat_history", formattedMessages);
      console.log(
        `Socket ${socket.id}: Sent chat history for User ${userId} (Target: ${
          targetUserId || "public"
        })`
      );
    } catch (error) {
      console.error(`Socket ${socket.id}: Error fetching chat history:`, error);
      socket.emit("error", "Failed to fetch chat history via socket.");
    }
  });

  // ==========================================================
  // Active User Tracking Logic
  // ==========================================================

  // Registers a user as online and updates their activity timestamp
  socket.on("user_online", async (data) => {
    const userId = data.userId;
    if (userId) {
      activeUsers[userId] = {
        userId: userId,
        username: data.username || "Anonymous",
        avatar_url: data.avatar_url,
        sid: socket.id, // Store session ID to associate with disconnects
        lastActivity: Date.now(), // Set initial activity timestamp
        currentRoomId: PUBLIC_CHAT_ROOM_ID, // Assume public lobby on initial connect
      };
      console.log(
        `User ${activeUsers[userId].username} (ID: ${userId}) marked online/active. SID: ${socket.id}`
      );
      // Broadcast the updated list of active users to all clients immediately
      io.emit(
        "online_users",
        Object.values(activeUsers).map((u) => ({
          userId: u.userId,
          username: u.username,
          avatar_url: u.avatar_url,
        }))
      );
    } else {
      console.warn(
        `Socket ${socket.id}: user_online event received with missing userId.`
      );
    }
  });

  // Handles incoming chat messages (public, private, or file)
  socket.on("chat message", async (msg) => {
    const {
      text,
      userId,
      username,
      avatar_url,
      message_type,
      recipient_id,
      file_data,
      file_name,
      file_type,
    } = msg;

    let actualRoomId;
    if (message_type === "private" && recipient_id) {
      actualRoomId = getPrivateChatRoomId(userId, recipient_id);
    } else {
      actualRoomId = PUBLIC_CHAT_ROOM_ID; // Default to public room
    }

    const reactionsJson = JSON.stringify([]); // New messages start with empty reactions

    try {
      const now = new Date();
      const insertQuery = `
          INSERT INTO chat_messages (user_id, username, message_text, room_id, message_type, recipient_id, created_at, reactions, file_data, file_name, file_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
      const [result] = await db.query(insertQuery, [
        userId,
        username,
        text,
        actualRoomId, // Use the derived actualRoomId
        message_type || "public",
        recipient_id || null,
        now,
        reactionsJson,
        file_data || null,
        file_name || null,
        file_type || null,
      ]);
      const messageId = result.insertId;
      const newMessage = {
        message_id: messageId,
        user_id: userId,
        username: username,
        message_text: text,
        room_id: actualRoomId, // Use the derived actualRoomId
        message_type: message_type || "public",
        recipient_id: recipient_id || null,
        created_at: now.toISOString(),
        edited_at: null,
        is_deleted: false,
        reactions: [], // Always initialize to an empty array for new messages
        file_data: file_data || null,
        file_name: file_name || null,
        file_type: file_type || null,
      };

      // Update lastActivity for the user who sent the message
      if (activeUsers[userId]) {
        activeUsers[userId].lastActivity = Date.now();
      } else {
        activeUsers[userId] = {
          userId: userId,
          username: username || "Anonymous",
          avatar_url: avatar_url,
          sid: socket.id,
          lastActivity: Date.now(),
          currentRoomId: actualRoomId, // Set their current room
        };
      }
      console.log(
        `User ${username} (ID: ${userId}) activity updated after sending message.`
      );

      // Emit the new message to relevant clients
      if (newMessage.message_type === "private" && newMessage.recipient_id) {
        // For private messages, ensure both sender and recipient are joined to the actualRoomId
        // and emit to that specific room.
        // It's crucial that both sender and recipient join this `actualRoomId` on the frontend
        // when initiating or switching to a private chat.
        io.to(actualRoomId).emit("message", newMessage);
        console.log(
          `Private message sent from ${username} to ${newMessage.recipient_id}. Room: ${actualRoomId}`
        );
      } else {
        io.to(actualRoomId).emit("message", newMessage); // For public chat or if recipient_id is null/missing
        console.log(`Public message sent to ${actualRoomId}.`);
      }

      // Broadcast the updated list of active users to all clients immediately
      io.emit(
        "online_users",
        Object.values(activeUsers).map((u) => ({
          userId: u.userId,
          username: u.username,
          avatar_url: u.avatar_url,
        }))
      );
    } catch (error) {
      console.error("Error saving chat message:", error);
      socket.emit("error", "Failed to send message: " + error.message);
    }
  });

  // Handle message editing
  socket.on("edit_message", async (data) => {
    const { messageId, newText, userId, file_data, file_name, file_type } =
      data;
    try {
      const [originalMsgRows] = await db.query(
        "SELECT user_id, is_deleted, message_type, room_id, recipient_id FROM chat_messages WHERE message_id = ?",
        [messageId]
      );
      if (originalMsgRows.length === 0) {
        socket.emit("error", "Message not found.");
        return;
      }
      const originalMessage = originalMsgRows[0];

      if (originalMessage.user_id !== userId) {
        socket.emit("error", "You are not authorized to edit this message.");
        return;
      }
      if (originalMessage.is_deleted) {
        socket.emit("error", "Cannot edit a deleted message.");
        return;
      }

      const now = new Date();
      await db.query(
        "UPDATE chat_messages SET message_text = ?, edited_at = ?, file_data = ?, file_name = ?, file_type = ? WHERE message_id = ?",
        [
          newText,
          now,
          file_data || null,
          file_name || null,
          file_type || null,
          messageId,
        ]
      );

      const [updatedMsgRows] = await db.query(
        `SELECT message_id, user_id, username, message_text, room_id, message_type, recipient_id, created_at, edited_at, is_deleted, reactions, file_data, file_name, file_type
           FROM chat_messages
           WHERE message_id = ?`,
        [messageId]
      );

      const updatedMessage = {
        ...updatedMsgRows[0],
        reactions: parseReactionsSafely(
          updatedMsgRows[0].reactions,
          updatedMsgRows[0].message_id
        ), // Use the helper function here
        file_data: updatedMsgRows[0].file_data || null,
        file_name: updatedMsgRows[0].file_name || null,
        file_type: updatedMsgRows[0].file_type || null,
      };

      // Determine the room to emit to
      const roomToEmit =
        updatedMessage.message_type === "private" && updatedMessage.recipient_id
          ? getPrivateChatRoomId(userId, updatedMessage.recipient_id)
          : updatedMessage.room_id; // For public, use original room_id

      io.to(roomToEmit).emit("message_updated", updatedMessage);
      console.log(`Message ${messageId} edited by user ${userId}.`);

      if (activeUsers[userId]) {
        activeUsers[userId].lastActivity = Date.now();
      }
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", "Failed to edit message.");
    }
  });

  // Handle message deletion
  socket.on("delete_message", async (data) => {
    const { messageId, userId } = data;
    try {
      const [originalMsgRows] = await db.query(
        "SELECT user_id, message_type, room_id, recipient_id FROM chat_messages WHERE message_id = ?",
        [messageId]
      );
      if (originalMsgRows.length === 0) {
        socket.emit("error", "Message not found.");
        return;
      }
      const originalMessage = originalMsgRows[0];

      if (originalMessage.user_id !== userId) {
        socket.emit("error", "You are not authorized to delete this message.");
        return;
      }

      await db.query(
        "UPDATE chat_messages SET is_deleted = TRUE, message_text = 'This message has been deleted.', file_data = NULL, file_name = NULL, file_type = NULL, reactions = '[]' WHERE message_id = ?",
        [messageId]
      );

      const [updatedMsgRows] = await db.query(
        `SELECT message_id, user_id, username, message_text, room_id, message_type, recipient_id, created_at, edited_at, is_deleted, reactions, file_data, file_name, file_type
           FROM chat_messages
           WHERE message_id = ?`,
        [messageId]
      );

      const updatedMessage = {
        ...updatedMsgRows[0],
        reactions: parseReactionsSafely(
          updatedMsgRows[0].reactions,
          updatedMsgRows[0].message_id
        ), // Use the helper function here
        file_data: updatedMsgRows[0].file_data || null,
        file_name: updatedMsgRows[0].file_name || null,
        file_type: updatedMsgRows[0].file_type || null,
      };

      // Determine the room to emit to
      const roomToEmit =
        updatedMessage.message_type === "private" && updatedMessage.recipient_id
          ? getPrivateChatRoomId(userId, updatedMessage.recipient_id)
          : updatedMessage.room_id;

      io.to(roomToEmit).emit("message_updated", updatedMessage);
      console.log(`Message ${messageId} deleted by user ${userId}.`);

      if (activeUsers[userId]) {
        activeUsers[userId].lastActivity = Date.now();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", "Failed to delete message.");
    }
  });

  // Handles message reactions
  socket.on("react_message", async (data) => {
    const { messageId, userId, username, emoji } = data;
    if (!messageId || !userId || !username || !emoji) {
      console.warn("Invalid reaction data:", data);
      return;
    }

    try {
      const [messages] = await db.query(
        "SELECT reactions, file_data, file_name, file_type, message_type, room_id, recipient_id, is_deleted FROM chat_messages WHERE message_id = ?",
        [messageId]
      );

      if (messages.length === 0) {
        socket.emit("error", "Message not found for reaction.");
        return;
      }

      const message = messages[0];
      if (message.is_deleted) {
        socket.emit("error", "Cannot react to a deleted message.");
        return;
      }

      // --- START: MODIFIED SECTION FOR REACT_MESSAGE ---
      let currentReactions = parseReactionsSafely(message.reactions, messageId);
      // --- END: MODIFIED SECTION FOR REACT_MESSAGE ---

      const reactionIndex = currentReactions.findIndex(
        (r) => r.emoji === emoji
      );
      if (reactionIndex !== -1) {
        const userIdx = currentReactions[reactionIndex].userIds.indexOf(userId);
        if (userIdx !== -1) {
          currentReactions[reactionIndex].userIds.splice(userIdx, 1);
          currentReactions[reactionIndex].usernames.splice(userIdx, 1);
          if (currentReactions[reactionIndex].userIds.length === 0) {
            currentReactions.splice(reactionIndex, 1);
          }
        } else {
          currentReactions[reactionIndex].userIds.push(userId);
          currentReactions[reactionIndex].usernames.push(username);
        }
      } else {
        currentReactions.push({
          emoji: emoji,
          userIds: [userId],
          usernames: [username],
        });
      }

      await db.query(
        "UPDATE chat_messages SET reactions = ? WHERE message_id = ?",
        [JSON.stringify(currentReactions), messageId]
      );

      const updatedMessage = {
        ...message,
        reactions: currentReactions, // Send the parsed object to the client
      };

      const roomToEmit =
        message.message_type === "private" && message.recipient_id
          ? getPrivateChatRoomId(userId, message.recipient_id)
          : message.room_id;

      io.to(roomToEmit).emit("message_updated", updatedMessage);
      console.log(
        `Reaction '${emoji}' processed for message ${messageId} by user ${userId}`
      );

      if (activeUsers[userId]) {
        activeUsers[userId].lastActivity = Date.now();
      }
    } catch (error) {
      console.error("Error reacting to message:", error);
      socket.emit("error", "Failed to react to message.");
    }
  });

  // Handles user typing indicator
  socket.on("typing", (data) => {
    // Broadcast to others in the room that someone is typing, exclude sender
    const roomToSend =
      data.message_type === "private" && data.recipient_id
        ? getPrivateChatRoomId(data.userId, data.recipient_id)
        : data.roomId || PUBLIC_CHAT_ROOM_ID;

    socket
      .to(roomToSend)
      .emit("typing", { userId: data.userId, username: data.username });
    if (activeUsers[data.userId]) {
      activeUsers[data.userId].lastActivity = Date.now();
    }
  });

  socket.on("stop_typing", (data) => {
    const roomToSend =
      data.message_type === "private" && data.recipient_id
        ? getPrivateChatRoomId(data.userId, data.recipient_id)
        : data.roomId || PUBLIC_CHAT_ROOM_ID;
    socket.to(roomToSend).emit("stop_typing", { userId: data.userId });
  });

  // Handles client disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    let disconnectedUserId = null;
    for (const userId in activeUsers) {
      if (activeUsers[userId].sid === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      delete activeUsers[disconnectedUserId];
      console.log(
        `User ${disconnectedUserId} removed from active users due to disconnect.`
      );
      io.emit(
        "online_users",
        Object.values(activeUsers).map((u) => ({
          userId: u.userId,
          username: u.username,
          avatar_url: u.avatar_url,
        }))
      );
    }
  });
});

// ==========================================================
// Periodically clean up inactive users and broadcast the active list
// ==========================================================
setInterval(() => {
  const fiveMinutesAgo = Date.now() - ACTIVITY_TIMEOUT_MS;
  let usersRemovedThisCycle = 0;
  for (const userId in activeUsers) {
    if (activeUsers[userId].lastActivity < fiveMinutesAgo) {
      console.log(
        `User ${activeUsers[userId].username} (ID: ${userId}) removed due to inactivity.`
      );
      delete activeUsers[userId];
      usersRemovedThisCycle++;
    }
  }

  const currentActiveUsersCount = Object.keys(activeUsers).length;
  if (
    usersRemovedThisCycle > 0 ||
    currentActiveUsersCount !== lastKnownActiveUsersCount
  ) {
    console.log(
      `Broadcasting updated online users after inactivity check. Current count: ${currentActiveUsersCount}`
    );
    io.emit(
      "online_users",
      Object.values(activeUsers).map((u) => ({
        userId: u.userId,
        username: u.username,
        avatar_url: u.avatar_url,
      }))
    );
    lastKnownActiveUsersCount = currentActiveUsersCount;
  }
}, 30 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running and listening on port ${PORT}`);
});
