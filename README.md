That's a solid list of fundamental features for a question and answer (Q&A) community platform! To truly make it engaging, scalable, and robust, here are some additional enhancements to consider, categorized for clarity:

---

### **I. User Engagement & Community Building**

1.  **Commenting/Discussion Threads:**

    - Allow users to add comments to questions and answers. This fosters deeper discussions and clarifications without needing to create new answers.
    - Implement nested comments for organized sub-discussions.

2.  **Reputation System/Badges:**

    - Beyond upvoting, introduce a more granular reputation system (e.g., points for asking questions, answering, getting answers marked as solutions, receiving upvotes).
    - Award badges for specific achievements (e.g., "First Answer," "Top Contributor," "Problem Solver," "Community Guru"). This gamifies the experience and encourages participation.

3.  **Following/Subscribing:**

    - **Follow Users:** Users can follow other users to see their activity (questions asked, answers given).
    - **Subscribe to Questions/Topics:** Users can subscribe to specific questions or topics to receive notifications about new answers or comments.

4.  **Mentions/Notifications:**

    - **@Mentions:** Allow users to mention other users in comments or answers (e.g., `@username`), triggering a notification for the mentioned user.
    - **Comprehensive Notification System:** Beyond mentions, notify users about:
      - New answers to their questions.
      - New comments on their questions/answers.
      - Their answer being marked as a solution.
      - Upvotes on their content.
      - Content they follow/subscribe to.
      - (In-app notifications, email digests, push notifications if applicable).

5.  **Activity Feed:**

    - A personalized feed showing recent activities relevant to the user (e.g., new questions in their followed topics, updates from users they follow).

6.  **"Ask a Question" Wizard/Guidelines:**
    - Guide users through the question-asking process to ensure clarity and completeness (e.g., suggesting tags, checking for similar questions, providing best practices).

---

### **II. Content Organization & Discoverability**

7.  **Tagging/Categories:**

    - Allow questions to be tagged with relevant keywords.
    - Implement hierarchical categories or nested tags for better organization.
    - Enable tag filtering and searching.

8.  **Search Functionality (Advanced):**

    - Implement powerful search capabilities including:
      - Full-text search across questions and answers.
      - Filtering by tags, users, date, number of upvotes, or solution status.
      - Auto-suggestion for search terms.
      - Fuzzy search (handling typos).

9.  **Related Questions/Answers:**

    - Suggest related questions based on tags, keywords, or user behavior when a user is asking a question or viewing an answer. This helps prevent duplicate questions and guides users to existing solutions.

10. **Content Editing/Version History:**

    - Allow users to edit their own questions and answers.
    - Implement a version history for edits, especially for answers, so changes can be tracked or even rolled back (useful for moderation and transparency).

11. **Best Answers/Featured Answers:**
    - Beyond marking as solution, allow community moderators or highly reputable users to highlight particularly well-explained or comprehensive answers as "best answers."

---

### **III. Moderation & Platform Health**

12. **Moderation Tools:**

    - **Dashboard for Moderators:** A dedicated interface for moderators to review reported content, manage users (ban, suspend), and oversee platform health.
    - **Automated Content Filtering:** Implement basic filters for profanity or spam keywords to automatically flag or prevent certain content.
    - **User Suspension/Banning:** Tools for moderators to enforce community guidelines.

13. **Spam Prevention:**
    - CAPTCHA or reCAPTCHA for new user registration and question submission.
    - Rate limiting for submissions.
    - Honeypot fields in forms.

---

### **IV. User Experience & Accessibility**

14. **Rich Text Editor:**

    - Provide a robust editor for questions and answers, allowing formatting (bold, italics, lists), code blocks, images, and possibly even file attachments.

15. **Markdown Support:**

    - For technical communities, allowing Markdown for questions and answers is often preferred.

16. **Responsive Design:**

    - Ensure the platform is fully optimized and user-friendly on all devices (desktop, tablet, mobile).

17. **Accessibility (A11y):**

    - Ensure the platform meets accessibility standards (WCAG) for users with disabilities (e.g., proper ARIA attributes, keyboard navigation, sufficient color contrast).

18. **Multi-language Support (i18n):**
    - If targeting a global audience, enable the platform to be translated into different languages.

---

### **V. Monetization & Advanced Features (Optional)**

19. **Premium Features/Subscriptions:**

    - If applicable, offer premium features like advanced analytics for top contributors, ad-free experience, or custom profile options.

20. **Analytics Dashboard (for Admins/Moderators):**

    - Provide insights into platform usage, popular questions, active users, moderation queues, etc.

21. **API for Integrations:**
    - Allow third-party applications to integrate with your Q&A platform (e.g., posting questions from other tools).

import React, { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import styles from "./PublicChat.module.css"; // Import the CSS module
import { UserState } from "../../App.jsx"; // Assuming UserState is defined here
import {
FiSend,
FiSmile,
FiImage,
FiX,
FiEdit,
FiTrash2,
FiDownload,
FiUsers,
FiMessageCircle,
} from "react-icons/fi"; // Added more icons
import EmojiPicker from "emoji-picker-react";
import Loader from "../Loader/Loader.jsx"; // Assuming you have a loader component
import Swal from "sweetalert2"; // For confirmations

const SOCKET_SERVER_URL = "http://localhost:5000"; // IMPORTANT: Ensure your Socket.IO server is running on this URL
const PUBLIC_CHAT_ROOM_ID = "stackoverflow_lobby"; // Unique ID for the public chat room

// Define common reaction emojis
const COMMON_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉"];

const PublicChat = () => {
// Access user information from context
const { user } = useContext(UserState);

// State variables for chat functionality
const [socket, setSocket] = useState(null);
const [messages, setMessages] = useState([]);
const [input, setInput] = useState("");
const [loadingHistory, setLoadingHistory] = useState(true);
const [isTyping, setIsTyping] = useState(false);
const [onlineUsers, setOnlineUsers] = useState([]); // State to hold list of online users
const [showReactionMenuForMessageId, setShowReactionMenuForMessageId] =
useState(null); // Stores message_id if mini palette is open
const [showFullReactionEmojiPicker, setShowFullReactionEmojiPicker] =
useState(null); // Stores message_id if full picker is open
const [selectedImage, setSelectedImage] = useState(null); // State to hold selected image Base64 data
const [selectedFile, setSelectedFile] = useState(null); // State for general file data {data: Base64, name: string, type: string}
const fileInputRef = useRef(null); // Ref for the hidden file input (for images and general files)

const [chatMode, setChatMode] = useState("public"); // 'public' or 'private'
const [currentDmRecipient, setCurrentDmRecipient] = useState(null); // {userId, username}
const [editingMessageId, setEditingMessageId] = useState(null); // ID of the message being edited
const [editingMessageText, setEditingMessageText] = useState(""); // Text of the message being edited

// Refs for managing DOM elements and timeouts
const typingTimeoutRef = useRef(null);
const messagesEndRef = useRef(null); // Ref to scroll to the latest message
const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false); // Renamed for clarity
const inputEmojiPickerRef = useRef(null);
const inputEmojiButtonRef = useRef(null);
const messageBubbleRefs = useRef({}); // To store refs for each message bubble

// Effect hook for connecting to Socket.IO and setting up event listeners
useEffect(() => {
const newSocket = io(SOCKET_SERVER_URL, {
transports: ["websocket", "polling"],
});
setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server.");
      // Send join_room event based on current chat mode
      if (chatMode === "public") {
        newSocket.emit("join_room", PUBLIC_CHAT_ROOM_ID);
        newSocket.emit("fetch_chat_history", {
          roomId: PUBLIC_CHAT_ROOM_ID,
          userId: user?.userid,
        });
      } else if (chatMode === "private" && currentDmRecipient) {
        // For private chats, the 'room' can be based on the sorted user IDs
        const dmRoomId = [user.userid, currentDmRecipient.userId]
          .sort()
          .join("-");
        newSocket.emit("join_room", dmRoomId);
        newSocket.emit("fetch_chat_history", {
          roomId: dmRoomId,
          userId: user?.userid,
          targetUserId: currentDmRecipient.userId,
        });
      }

      if (user?.userid && user?.username) {
        newSocket.emit("user_online", {
          userId: user.userid,
          username: user.username,
          avatar_url: user.avatar_url,
        });
      }
    });

    newSocket.on("message", (message) => {
      console.log("New message received:", message);
      // Only add message if it belongs to the currently active chat mode/recipient
      const isForCurrentPublicChat =
        message.message_type === "public" &&
        message.room_id === PUBLIC_CHAT_ROOM_ID &&
        chatMode === "public";
      const isForCurrentPrivateChat =
        message.message_type === "private" &&
        chatMode === "private" &&
        currentDmRecipient &&
        ((message.user_id === user?.userid &&
          message.recipient_id === currentDmRecipient.userId) ||
          (message.user_id === currentDmRecipient.userId &&
            message.recipient_id === user?.userid));

      if (isForCurrentPublicChat || isForCurrentPrivateChat) {
        setMessages((prev) => [...prev, message]);
      }
      setIsTyping(false);
    });

    newSocket.on("chat_history", (history) => {
      console.log("Chat history received:", history);
      setMessages(
        history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      );
      setLoadingHistory(false);
    });

    newSocket.on("online_users", (users) => {
      console.log("Online users updated:", users);
      setOnlineUsers(users);
    });

    // Listener for message updates (e.g., when a message is reacted to, edited, or deleted)
    newSocket.on("message_updated", (updatedMessage) => {
      console.log("Message updated from server:", updatedMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === updatedMessage.message_id ? updatedMessage : msg
        )
      );
    });

    newSocket.on("typing", (data) => {
      if (data.userId !== user?.userid) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    });

    newSocket.on("stop_typing", (data) => {
      if (data.userId !== user?.userid) {
        clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server.");
      setSocket(null);
      if (user?.userid) {
        newSocket.emit("user_offline", { userId: user.userid });
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    newSocket.on("error", (errorMessage) => {
      Swal.fire({
        icon: "error",
        title: "Chat Error",
        text: errorMessage,
      });
    });

    return () => {
      newSocket.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };

}, [user, chatMode, currentDmRecipient]); // Reconnect when chat mode or DM recipient changes

// Effect hook to scroll to the bottom of the messages container
useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [
messages,
isTyping,
showReactionMenuForMessageId,
showFullReactionEmojiPicker,
editingMessageId,
]);

// Effect hook to close emoji pickers when clicking outside
useEffect(() => {
const handleClickOutside = (event) => {
// Close input emoji picker
if (
inputEmojiPickerRef.current &&
!inputEmojiPickerRef.current.contains(event.target) &&
inputEmojiButtonRef.current &&
!inputEmojiButtonRef.current.contains(event.target)
) {
setShowInputEmojiPicker(false);
}

      // Close reaction menu or full reaction picker
      if (
        showReactionMenuForMessageId !== null ||
        showFullReactionEmojiPicker !== null
      ) {
        const isClickInsideReactionMenu = event.target.closest(
          `.${styles.reactionMenu}`
        );
        const isClickInsideFullReactionPicker = event.target.closest(
          `.${styles.reactionEmojiPicker}`
        );
        const isClickOnReactButton = event.target.closest(
          `.${styles.reactButton}`
        );

        if (
          !isClickInsideReactionMenu &&
          !isClickInsideFullReactionPicker &&
          !isClickOnReactButton
        ) {
          setShowReactionMenuForMessageId(null);
          setShowFullReactionEmojiPicker(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

}, [
showInputEmojiPicker,
showReactionMenuForMessageId,
showFullReactionEmojiPicker,
]);

const handleInputChange = (e) => {
setInput(e.target.value);
if (socket) {
if (e.target.value.trim().length > 0) {
socket.emit("typing", {
userId: user?.userid,
username: user?.username,
roomId:
chatMode === "public"
? PUBLIC_CHAT_ROOM_ID
: [user.userid, currentDmRecipient.userId].sort().join("-"),
});
} else {
socket.emit("stop_typing", {
userId: user?.userid,
roomId:
chatMode === "public"
? PUBLIC_CHAT_ROOM_ID
: [user.userid, currentDmRecipient.userId].sort().join("-"),
});
}
}
clearTimeout(typingTimeoutRef.current);
typingTimeoutRef.current = setTimeout(() => {
if (socket)
socket.emit("stop_typing", {
userId: user?.userid,
roomId:
chatMode === "public"
? PUBLIC_CHAT_ROOM_ID
: [user.userid, currentDmRecipient.userId].sort().join("-"),
});
}, 1000);
};

const sendMessage = (e) => {
e.preventDefault();
const messageText = input.trim();

    if (editingMessageId) {
      handleEditMessageConfirm();
      return;
    }

    if ((messageText || selectedImage || selectedFile) && socket) {
      const messagePayload = {
        roomId: PUBLIC_CHAT_ROOM_ID, // Default for public messages, but will be overwritten for private
        text: messageText,
        userId: user?.userid || null,
        username: user?.username || "Anonymous",
        avatar_url: user?.avatar_url || null,
        message_type: chatMode, // 'public' or 'private'
        recipient_id:
          chatMode === "private" && currentDmRecipient
            ? currentDmRecipient.userId
            : null,
        reactions: [],
        file_data: selectedFile ? selectedFile.data : selectedImage, // Use file_data for any file
        file_name: selectedFile
          ? selectedFile.name
          : selectedImage
          ? "image.png"
          : null, // Generic name for images, actual for other files
        file_type: selectedFile
          ? selectedFile.type
          : selectedImage
          ? "image/png"
          : null, // Generic type for images, actual for other files
      };

      console.log("Sending message:", messagePayload);
      socket.emit("chat message", messagePayload);

      setInput("");
      setSelectedImage(null); // Clear selected image
      setSelectedFile(null); // Clear selected file
      setShowInputEmojiPicker(false);
      clearTimeout(typingTimeoutRef.current);
      socket.emit("stop_typing", {
        userId: user?.userid,
        roomId:
          chatMode === "public"
            ? PUBLIC_CHAT_ROOM_ID
            : [user.userid, currentDmRecipient.userId].sort().join("-"),
      });
    }

};

const onInputEmojiClick = (emojiObject) => {
setInput((prev) => prev + emojiObject.emoji);
setShowInputEmojiPicker(false); // Close after selection
};

const handleReaction = (messageId, emoji) => {
if (!user?.userid) {
Swal.fire({
icon: "warning",
title: "Login Required",
text: "You must be logged in to react to messages.",
});
return;
}
if (!socket) {
Swal.fire({
icon: "error",
title: "Connection Error",
text: "Not connected to chat server.",
});
return;
}

    socket.emit("react_message", {
      messageId,
      userId: user.userid,
      username: user.username,
      emoji: emoji,
    });

    // Close reaction menus after interaction
    setShowReactionMenuForMessageId(null);
    setShowFullReactionEmojiPicker(null);

};

const formatTimestamp = (timestamp) => {
const date = new Date(timestamp);
return date.toLocaleString(undefined, {
year: "numeric",
month: "short",
day: "numeric",
hour: "2-digit",
minute: "2-digit",
});
};

const getUserInitial = (username) => {
return username ? username.charAt(0).toUpperCase() : "?";
};

const openFullReactionPicker = (messageId) => {
setShowFullReactionEmojiPicker(messageId);
setShowReactionMenuForMessageId(null); // Close mini menu
};

// Handle any file selection (image or otherwise)
const handleFileSelect = (event) => {
const file = event.target.files[0];
if (file) {
if (file.size > 5 _ 1024 _ 1024) {
// Limit to 5MB for Base64 transfer
Swal.fire({
icon: "warning",
title: "File Too Large",
text: "File size exceeds 5MB. Please choose a smaller file.",
});
return;
}

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          data: reader.result, // Base64 string
          name: file.name,
          type: file.type,
        });
        setSelectedImage(null); // Clear image if a general file is selected
        setInput(""); // Clear text input
      };
      reader.readAsDataURL(file);
    }

};

// Trigger hidden file input click
const triggerFileInput = () => {
fileInputRef.current.click();
};

// Function to download Base64 file
const downloadFile = (fileData, fileName, fileType) => {
if (!fileData) {
Swal.fire({
icon: "error",
title: "Download Error",
text: "No file data available.",
});
return;
}
try {
const link = document.createElement("a");
link.href = fileData;
link.download = fileName || "downloaded_file"; // Use provided name or generic
link.target = "\_blank"; // Open in new tab
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
} catch (error) {
console.error("Error during file download:", error);
Swal.fire({
icon: "error",
title: "Download Failed",
text: "Could not download the file.",
});
}
};

// Function to start editing a message
const startEditingMessage = (message) => {
setEditingMessageId(message.message_id);
setEditingMessageText(message.message_text);
setInput(message.message_text); // Pre-fill input with message text
setSelectedImage(null); // Clear image/file selection when editing text
setSelectedFile(null);
setShowInputEmojiPicker(false); // Close emoji picker
};

// Function to confirm and send edited message
const handleEditMessageConfirm = () => {
if (editingMessageId && editingMessageText.trim() && socket) {
socket.emit("edit_message", {
messageId: editingMessageId,
newText: editingMessageText.trim(),
userId: user?.userid,
});
setEditingMessageId(null); // Clear editing state
setEditingMessageText("");
setInput(""); // Clear input field
} else {
Swal.fire({
icon: "warning",
title: "Empty Message",
text: "Edited message cannot be empty.",
});
}
};

// Function to cancel editing
const cancelEditing = () => {
setEditingMessageId(null);
setEditingMessageText("");
setInput(""); // Clear input field
setSelectedImage(null); // Re-enable normal sending
setSelectedFile(null);
};

// Function to delete a message
const handleDeleteMessage = async (messageId) => {
if (!user?.userid) {
Swal.fire({
icon: "warning",
title: "Login Required",
text: "You must be logged in to delete messages.",
});
return;
}
if (!socket) {
Swal.fire({
icon: "error",
title: "Connection Error",
text: "Not connected to chat server.",
});
return;
}

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this message!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      socket.emit("delete_message", {
        messageId,
        userId: user.userid,
      });
    }

};

// Function to switch chat mode (Public/Private)
const switchChatMode = (mode, recipient = null) => {
if (!user?.userid && mode === "private") {
Swal.fire({
icon: "warning",
title: "Login Required",
text: "You must be logged in to start private chats.",
});
return;
}
setChatMode(mode);
setCurrentDmRecipient(recipient);
setMessages([]); // Clear messages when switching mode
setLoadingHistory(true); // Re-fetch history
setInput("");
setSelectedImage(null);
setSelectedFile(null);
setEditingMessageId(null);
setEditingMessageText("");
// Re-establish socket connection to join correct room and fetch history
if (socket) {
socket.disconnect(); // Disconnect current socket
setSocket(null); // Force useEffect to re-initialize
}
};

return (
<div className={styles.publicChatContainer}>
<header className={styles.chatHeader}>
<h2 className={styles.chatTitle}>
{chatMode === "public"
? "Evangadi Public Chat"
: `DM with ${currentDmRecipient?.username || "Unknown User"}`}
</h2>
<div className={styles.headerControls}>
<button
className={`${styles.chatModeButton} ${
              chatMode === "public" ? styles.activeMode : ""
            }`}
onClick={() => switchChatMode("public")}
title="Switch to Public Chat" >
<FiUsers className={styles.chatModeIcon} /> Public
</button>
<button
className={`${styles.chatModeButton} ${
              chatMode === "private" ? styles.activeMode : ""
            }`}
onClick={() => switchChatMode("private", currentDmRecipient)} // Allow switching to private (retains current recipient if exists)
disabled={!user?.userid}
title="Switch to Private Chat" >
<FiMessageCircle className={styles.chatModeIcon} /> Private
</button>

          <div className={styles.onlineUsersButtonWrapper}>
            <button
              className={styles.onlineUsersButton}
              onClick={() => {
                /* You can add a modal here to show detailed user list */
              }}
              title="View Online Users"
            >
              Online ({onlineUsers.length})
            </button>
          </div>
        </div>
      </header>

      <div className={styles.onlineUsersDisplay}>
        <strong>Online: </strong>
        {onlineUsers.length > 0 ? (
          onlineUsers.map((u) => (
            <span key={u.userId} className={styles.onlineUserTag}>
              <span className={styles.onlineIndicator}></span>
              {u.username}
              {u.userId !== user?.userid && ( // Don't allow DMing self
                <button
                  className={styles.dmButton}
                  onClick={() => switchChatMode("private", u)}
                  title={`Start private chat with ${u.username}`}
                >
                  DM
                </button>
              )}
            </span>
          ))
        ) : (
          <span className={styles.noOnlineUsers}>No one else is online.</span>
        )}
      </div>

      <section
        className={styles.messagesContainer}
        aria-live="polite"
        role="log"
      >
        {loadingHistory ? (
          <div className={styles.loadingMessage}>
            <Loader type="ThreeDots" color="#007bff" height={30} width={30} />
            <p className={styles.loadingText}>Loading chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>
            {chatMode === "public"
              ? "No public messages yet. Be the first to start a conversation!"
              : `No private messages with ${
                  currentDmRecipient?.username || "this user"
                } yet.`}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMyMessage = msg.user_id === user?.userid;
            const isFileMessage = msg.file_data && msg.file_name;
            const isImage =
              isFileMessage &&
              msg.file_type &&
              msg.file_type.startsWith("image/");
            const isDeleted = msg.is_deleted;
            const isBeingEdited = editingMessageId === msg.message_id;

            return (
              <article
                key={msg.message_id || index}
                className={`${styles.messageArticle} ${
                  isMyMessage ? styles.myMessageAlign : styles.otherMessageAlign
                }`}
              >
                {msg.avatar_url ? (
                  <img
                    src={msg.avatar_url}
                    alt={`${msg.username}'s avatar`}
                    className={styles.messageAvatar}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/32x32/ff6600/white?text=?";
                    }}
                  />
                ) : (
                  <div className={styles.messageAvatarPlaceholder}>
                    {getUserInitial(msg.username)}
                  </div>
                )}

                <div
                  className={`${styles.messageBubble} ${
                    isMyMessage
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble
                  } ${isDeleted ? styles.deletedMessage : ""}`}
                  ref={(el) => (messageBubbleRefs.current[msg.message_id] = el)}
                >
                  <span className={styles.messageUsername}>
                    {msg.username || "Anonymous"}
                    {msg.message_type === "private" && (
                      <span className={styles.privateTag}> (Private)</span>
                    )}
                  </span>
                  {isDeleted ? (
                    <p className={styles.messageText}>
                      <FiTrash2 /> {msg.message_text}
                    </p>
                  ) : (
                    <>
                      {isImage && (
                        <img
                          src={msg.file_data}
                          alt={msg.file_name || "Sent image"}
                          className={styles.messageImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/150x100/eeeeee/gray?text=Image+Error";
                          }}
                        />
                      )}
                      {!isImage &&
                        isFileMessage && ( // Generic file display
                          <div className={styles.messageFile}>
                            <a
                              href={msg.file_data}
                              download={msg.file_name}
                              className={styles.fileLink}
                            >
                              <FiDownload className={styles.fileIcon} />
                              <span>{msg.file_name}</span>
                            </a>
                          </div>
                        )}
                      {msg.message_text && (
                        <p className={styles.messageText}>{msg.message_text}</p>
                      )}
                    </>
                  )}

                  <time
                    className={styles.messageTimestamp}
                    dateTime={msg.created_at}
                  >
                    {formatTimestamp(msg.created_at)}
                    {msg.edited_at && (
                      <span className={styles.editedTag}> (edited)</span>
                    )}
                  </time>

                  {/* Reaction, Edit, Delete Buttons */}
                  {!isDeleted && (
                    <div className={styles.messageActions}>
                      {msg.message_id && (
                        <button
                          className={styles.reactButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReactionMenuForMessageId(
                              showReactionMenuForMessageId === msg.message_id
                                ? null
                                : msg.message_id
                            );
                            setShowFullReactionEmojiPicker(null);
                          }}
                          title="React to message"
                        >
                          +
                        </button>
                      )}

                      {isMyMessage &&
                        !isFileMessage && ( // Only allow editing own text messages
                          <button
                            className={styles.editButton}
                            onClick={() => startEditingMessage(msg)}
                            title="Edit message"
                            disabled={isBeingEdited}
                          >
                            <FiEdit />
                          </button>
                        )}

                      {isMyMessage && ( // Allow deleting own messages
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteMessage(msg.message_id)}
                          title="Delete message"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reaction Mini Menu */}
                  {showReactionMenuForMessageId === msg.message_id && (
                    <div className={styles.reactionMenu}>
                      {COMMON_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          className={styles.reactionMenuItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReaction(msg.message_id, emoji);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        className={`${styles.reactionMenuItem} ${styles.moreEmojisButton}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullReactionPicker(msg.message_id, e);
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {/* Display reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={styles.reactionsContainer}>
                      {msg.reactions.map((reaction) => (
                        <span
                          key={reaction.emoji}
                          className={`${styles.reactionBubble} ${
                            reaction.userIds.includes(user?.userid)
                              ? styles.userReacted
                              : ""
                          }`}
                          onClick={() =>
                            handleReaction(msg.message_id, reaction.emoji)
                          }
                          title={`Reacted by: ${reaction.usernames.join(", ")}`}
                        >
                          <span className={styles.emoji}>{reaction.emoji}</span>
                          <span className={styles.count}>
                            {reaction.userIds.length}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
        {isTyping && (
          <div className={styles.typingIndicator}>Someone is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Full Reaction Emoji Picker (conditionally rendered) */}
      {showFullReactionEmojiPicker && (
        <>
          <div
            className={styles.reactionEmojiPickerOverlay}
            onClick={() => setShowFullReactionEmojiPicker(null)}
          ></div>
          <div className={styles.reactionEmojiPicker}>
            <EmojiPicker
              onEmojiClick={(emojiObject) =>
                handleReaction(showFullReactionEmojiPicker, emojiObject.emoji)
              }
              theme="light"
              emojiStyle="native"
              width="100%"
              height="100%"
              searchDisabled={false}
              skinTonesDisabled={false}
            />
          </div>
        </>
      )}

      <form
        onSubmit={sendMessage}
        className={styles.inputForm}
        aria-label="Send a message"
      >
        {selectedFile && (
          <div className={styles.selectedFilePreview}>
            <div className={styles.fileIconWrapper}>
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={selectedFile.data}
                  alt="Selected file preview"
                  className={styles.previewThumbnail}
                />
              ) : (
                <FiDownload className={styles.fileTypeIcon} />
              )}
            </div>
            <span className={styles.fileNamePreview}>{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className={styles.clearFileButton}
              title="Clear selected file"
            >
              <FiX />
            </button>
          </div>
        )}

        {editingMessageId && (
          <div className={styles.editingIndicator}>
            Editing message:{" "}
            <span className={styles.editingMessageTextPreview}>
              {editingMessageText.substring(0, 50)}
              {editingMessageText.length > 50 ? "..." : ""}
            </span>
            <button
              type="button"
              onClick={cancelEditing}
              className={styles.cancelEditButton}
            >
              <FiX /> Cancel
            </button>
          </div>
        )}

        <div className={styles.inputFieldWrapper}>
          <input
            type="file"
            accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx, .txt" // Accept common image and document types
            ref={fileInputRef}
            onChange={handleFileSelect}
            className={styles.hiddenFileInput}
            aria-label="Select file to send"
          />
          <button
            type="button"
            onClick={triggerFileInput}
            className={styles.attachFileButton} // Renamed for clarity
            title="Attach File"
            disabled={editingMessageId !== null} // Disable file attach when editing
          >
            <FiImage className={styles.attachFileIcon} />{" "}
            {/* Using FiImage, but could be FiPaperclip */}
          </button>
          <button
            type="button"
            onClick={() => setShowInputEmojiPicker((prev) => !prev)}
            className={styles.emojiButton}
            title="Choose Emoji"
            aria-expanded={showInputEmojiPicker}
            aria-haspopup="dialog"
            ref={inputEmojiButtonRef}
          >
            <FiSmile className={styles.emojiIcon} />
          </button>

          <input
            type="text"
            value={editingMessageId ? editingMessageText : input}
            onChange={(e) =>
              editingMessageId
                ? setEditingMessageText(e.target.value)
                : handleInputChange(e)
            }
            placeholder={
              editingMessageId ? "Edit your message..." : "Type your message..."
            }
            className={styles.messageInput}
            disabled={!socket}
            aria-label="Message input"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={
              (!input.trim() && !selectedFile && !editingMessageId) || !socket
            } // Disable if no text/file AND not editing, or not connected
            aria-label={
              editingMessageId ? "Save edited message" : "Send message"
            }
          >
            {editingMessageId ? (
              <FiEdit className={styles.sendIcon} />
            ) : (
              <FiSend className={styles.sendIcon} />
            )}
          </button>
        </div>

        {showInputEmojiPicker && (
          <div
            className={styles.emojiPickerContainer}
            ref={inputEmojiPickerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Emoji picker"
          >
            <EmojiPicker
              onEmojiClick={onInputEmojiClick}
              theme="light"
              emojiStyle="native"
              width="100%"
              height={300}
            />
          </div>
        )}
      </form>
    </div>

);
};

export default PublicChat;

/_ PublicChat.module.css _/

.publicChatContainer {
width: 100%; /_ Ensures it takes 100% of its parent's width _/
max-width: 500px; /_ Restored: Limits the maximum width for a contained look _/
margin: 1rem auto; /_ Restored: Centers the chat horizontally and adds vertical margin _/
background-color: #ffffff;
border-radius: 0.5rem; /_ Restored: Rounded corners for the chat box _/
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
0 4px 6px -2px rgba(0, 0, 0, 0.05); /_ Restored: Adds a subtle shadow _/
display: flex;
flex-direction: column;
height: 90vh; /_ Keeps the chat box tall but not necessarily full viewport height _/
overflow: hidden;
font-family: "Inter", sans-serif;
}

.chatHeader {
background-color: #2563eb;
color: #ffffff;
padding: 1rem;
border-top-left-radius: 0.5rem; /_ Restored border-radius _/
border-top-right-radius: 0.5rem; /_ Restored border-radius _/
display: flex;
flex-direction: column; /_ Stack title and controls for smaller screens _/
gap: 0.5rem;
align-items: flex-start;
justify-content: space-between;
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.chatTitle {
font-size: 1.25rem;
font-weight: 700;
}

.headerControls {
display: flex;
gap: 0.5rem;
flex-wrap: wrap; /_ Allow wrapping on small screens _/
align-items: center;
width: 100%;
}

.chatModeButton {
padding: 0.4rem 0.8rem;
background-color: #1d4ed8;
color: #ffffff;
border: 1px solid #1d4ed8;
border-radius: 0.375rem;
font-size: 0.8rem;
display: flex;
align-items: center;
gap: 0.25rem;
transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
cursor: pointer;
}

.chatModeButton.activeMode {
background-color: #ffffff;
color: #2563eb;
border-color: #2563eb;
font-weight: 600;
}

.chatModeButton:hover:not(.activeMode) {
background-color: #1e40af;
border-color: #1e40af;
}
.chatModeButton:disabled {
opacity: 0.6;
cursor: not-allowed;
}

.chatModeIcon {
font-size: 1rem;
}

.onlineUsersButtonWrapper {
position: relative;
margin-left: auto; /_ Push to the right _/
}

.onlineUsersButton {
padding: 0.5rem 1rem;
background-color: #1d4ed8;
color: #ffffff;
border-radius: 0.375rem;
font-size: 0.875rem;
transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;
cursor: pointer;
border: none;
}

.onlineUsersButton:hover {
background-color: #1e40af;
}

.onlineUsersButton:focus {
outline: none;
box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.onlineUsersDisplay {
background-color: #f3f4f6;
padding: 0.5rem;
border-bottom: 1px solid #e5e7eb;
font-size: 0.875rem;
color: #4b5563;
overflow-x: auto;
white-space: nowrap;
scrollbar-width: thin;
scrollbar-color: #9ca3af #e5e7eb;
}

.onlineUsersDisplay::-webkit-scrollbar {
height: 8px;
}
.onlineUsersDisplay::-webkit-scrollbar-track {
background: #e5e7eb;
border-radius: 10px;
}
.onlineUsersDisplay::-webkit-scrollbar-thumb {
background-color: #9ca3af;
border-radius: 10px;
border: 2px solid #e5e7eb;
}

.onlineUserTag {
display: inline-flex;
align-items: center;
background-color: #3b82f6;
color: #ffffff;
font-size: 0.75rem;
font-weight: 600;
padding: 0.125rem 0.625rem;
border-radius: 9999px;
margin-right: 0.5rem;
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.onlineIndicator {
width: 0.5rem;
height: 0.5rem;
background-color: #86efac;
border-radius: 9999px;
margin-right: 0.25rem;
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
0%,
100% {
opacity: 1;
}
50% {
opacity: 0.5;
}
}

.dmButton {
background: none;
border: 1px solid rgba(255, 255, 255, 0.5);
color: rgba(255, 255, 255, 0.9);
font-size: 0.7rem;
padding: 0.1rem 0.4rem;
border-radius: 9999px;
margin-left: 0.5rem;
cursor: pointer;
transition: background-color 0.2s ease;
}
.dmButton:hover {
background-color: rgba(255, 255, 255, 0.2);
}

.noOnlineUsers {
color: #6b7280;
}

.messagesContainer {
flex: 1;
overflow-y: auto;
padding: 1rem;
display: flex;
flex-direction: column;
gap: 1rem;
scrollbar-width: thin;
scrollbar-color: #9ca3af #e5e7eb;
}

.messagesContainer::-webkit-scrollbar {
width: 8px;
}
.messagesContainer::-webkit-scrollbar-track {
background: #e5e7eb;
border-radius: 10px;
}
.messagesContainer::-webkit-scrollbar-thumb {
background-color: #9ca3af;
border-radius: 10px;
border: 2px solid #e5e7eb;
}

.loadingMessage {
text-align: center;
color: #6b7280;
padding-top: 2rem;
padding-bottom: 2rem;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
}

.loadingText {
margin-top: 0.5rem;
}

.emptyChat {
text-align: center;
color: #6b7280;
padding-top: 2rem;
padding-bottom: 2rem;
}

.messageArticle {
display: flex;
align-items: flex-start;
gap: 0.75rem;
}

.myMessageAlign {
flex-direction: row-reverse;
}

.otherMessageAlign {
flex-direction: row;
}

.messageAvatar {
width: 2rem;
height: 2rem;
border-radius: 9999px;
object-fit: cover;
border: 2px solid #d1d5db;
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
flex-shrink: 0;
}

.messageAvatarPlaceholder {
width: 2rem;
height: 2rem;
border-radius: 9999px;
display: flex;
align-items: center;
justify-content: center;
color: #ffffff;
font-size: 0.875rem;
font-weight: 700;
background-color: #9ca3af;
border: 2px solid #d1d5db;
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
flex-shrink: 0;
}

.messageBubble {
display: flex;
flex-direction: column;
padding: 0.75rem;
border-radius: 0.75rem;
max-width: 70%;
word-break: break-word;
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
position: relative; /_ Crucial for positioning the react button _/
}

.myMessageBubble {
background-color: #dbeafe;
color: #1e3a8a;
align-items: flex-end;
margin-left: auto;
}

.otherMessageBubble {
background-color: #f3f4f6;
color: #374151;
align-items: flex-start;
margin-right: auto;
}

.messageUsername {
font-weight: 600;
font-size: 0.875rem;
margin-bottom: 0.25rem;
}

.privateTag {
background-color: #6d28d9; /_ Purple for private tag _/
color: white;
font-size: 0.65rem;
padding: 0.1rem 0.4rem;
border-radius: 0.25rem;
margin-left: 0.5rem;
font-weight: normal;
}

.messageText {
font-size: 1rem;
line-height: 1.5;
margin-top: 0.25rem; /_ Space between username and text/image _/
margin-bottom: 0.25rem; /_ Space between text/image and timestamp _/
}

.deletedMessage {
background-color: #fce7f3; /_ Light red/pink for deleted messages _/
color: #9f1239;
font-style: italic;
opacity: 0.8;
border: 1px dashed #fda4af;
}
.deletedMessage .messageText {
display: flex;
align-items: center;
gap: 0.5rem;
}
.deletedMessage .messageText svg {
font-size: 1rem;
color: #9f1239;
}
.deletedMessage .reactionsContainer,
.deletedMessage .messageActions {
display: none; /_ Hide reactions and actions for deleted messages _/
}

.messageImage {
max-width: 100%; /_ Ensure image fits within bubble _/
height: auto;
border-radius: 0.5rem; /_ Rounded corners for images _/
margin-top: 0.5rem; /_ Space above image _/
margin-bottom: 0.5rem; /_ Space below image _/
display: block; /_ Ensures it takes up its own line _/
cursor: zoom-in; /_ Indicate that it's clickable for large view _/
}

.messageFile {
background-color: #e2e8f0;
border-radius: 0.5rem;
padding: 0.5rem;
display: flex;
align-items: center;
gap: 0.5rem;
margin-top: 0.5rem;
margin-bottom: 0.5rem;
}

.fileDownloadButton {
/_ Changed from .fileLink to a button for better semantics _/
background: none;
border: none;
display: flex;
align-items: center;
gap: 0.5rem;
text-decoration: none;
color: #2563eb;
font-weight: 500;
cursor: pointer;
transition: color 0.2s ease;
padding: 0; /_ Remove default button padding _/
}
.fileDownloadButton:hover {
color: #1e40af;
}

.fileIcon {
font-size: 1.2rem;
color: #6b7280;
}

.messageTimestamp {
font-size: 0.75rem;
color: #6b7280;
margin-top: 0.25rem;
display: block;
}

.editedTag {
font-style: italic;
font-size: 0.7rem;
color: #4b5563;
margin-left: 0.3rem;
}

.reactionsContainer {
display: flex;
flex-wrap: wrap; /_ Allow reactions to wrap to next line _/
gap: 0.25rem; /_ Small gap between reaction bubbles _/
margin-top: 0.5rem;
align-self: flex-end; /_ Align to the right in my messages _/
position: relative; /_ For tooltip positioning _/
}

/_ Specific styling for reactions on other messages (align to start) _/
.otherMessageAlign .reactionsContainer {
align-self: flex-start; /_ Align to the left in other messages _/
}

.reactionBubble {
display: inline-flex;
align-items: center;
background-color: rgba(
255,
255,
255,
0.7
); /_ Semi-transparent white background _/
border: 1px solid #e5e7eb;
border-radius: 9999px; /_ Fully rounded _/
padding: 0.125rem 0.5rem; /_ Smaller padding _/
font-size: 0.8rem;
cursor: pointer;
transition: background-color 0.2s ease-in-out;
}

.reactionBubble:hover {
background-color: rgba(255, 255, 255, 0.9);
}

.reactionBubble .emoji {
margin-right: 0.25rem;
}

.reactionBubble .count {
font-weight: 600;
color: #374151;
}

.reactionBubble.userReacted {
background-color: #dbeafe; /_ Highlight if user reacted _/
border-color: #2563eb;
}

.messageActions {
position: absolute;
bottom: 0; /_ Position at the bottom of the bubble _/
right: 0; /_ Position to the right _/
display: flex; /_ Arrange buttons side-by-side _/
gap: 0.2rem; /_ Small gap between action buttons _/
opacity: 0; /_ Hidden by default _/
transition: opacity 0.2s ease-in-out;
padding: 0.25rem;
background-color: rgba(255, 255, 255, 0.8);
border-radius: 0.5rem 0 0.5rem 0;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
z-index: 10;
}
.myMessageAlign .messageActions {
left: 0;
right: auto;
border-radius: 0 0.5rem 0 0.5rem;
}

.messageBubble:hover .messageActions {
opacity: 1;
}

.reactButton,
.editButton,
.deleteButton {
background: none;
border: none;
padding: 0.4rem;
cursor: pointer;
font-size: 0.9rem;
line-height: 1;
color: #6b7280;
border-radius: 9999px;
transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
display: flex;
align-items: center;
justify-content: center;
}

.reactButton:hover {
background-color: #e5e7eb;
color: #2563eb;
}
.editButton:hover {
background-color: #e5f5f5; /_ Light green _/
color: #059669; /_ Green _/
}
.deleteButton:hover {
background-color: #fee2e2; /_ Light red _/
color: #dc2626; /_ Red _/
}

.reactButton:focus,
.editButton:focus,
.deleteButton:focus {
outline: none;
box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.reactionMenu {
position: absolute;
bottom: 35px; /_ Position above the react button, inside the message bubble _/
left: 50%;
transform: translateX(-50%);
display: flex;
background-color: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 9999px; /_ Pill shape _/
padding: 0.25rem;
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
0 2px 4px -1px rgba(0, 0, 0, 0.06);
z-index: 20; /_ Ensure it's above message content _/
gap: 0.25rem; /_ Space between emojis _/
}

.reactionMenuItem {
background: none;
border: none;
padding: 0.3rem 0.4rem;
font-size: 1.2rem; /_ Larger emoji size _/
cursor: pointer;
border-radius: 9999px;
transition: background-color 0.2s ease-in-out;
}

.reactionMenuItem:hover {
background-color: #f3f4f6;
}

.reactionMenuItem.moreEmojisButton {
font-size: 1.2rem; /_ Make it same size as other emojis _/
font-weight: bold; /_ Bold + sign _/
padding: 0.3rem 0.4rem; /_ Adjusted padding _/
background-color: #e5e7eb;
color: #4b5563;
border: 1px solid #d1d5db; /_ Add a border for the circle effect _/
border-radius: 50%; /_ Make it circular _/
display: flex; /_ Use flex to center the '+' _/
align-items: center; /_ Center vertically _/
justify-content: center; /_ Center horizontally _/
width: 2.2rem; /_ Fixed width to make it a circle _/
height: 2.2rem; /_ Fixed height to make it a circle _/
box-sizing: border-box; /_ Include padding and border in element's total width and height _/
}
.reactionMenuItem.moreEmojisButton:hover {
background-color: #d1d5db;
}

.reactionEmojiPicker {
position: fixed; /_ Changed to fixed to cover entire screen effectively _/
top: 50%; /_ Center vertically _/
left: 50%; /_ Center horizontally _/
transform: translate(-50%, -50%); /_ Adjust to true center _/
z-index: 30; /_ Higher than message input emoji picker _/
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
0 4px 6px -2px rgba(0, 0, 0, 0.05);
border-radius: 0.5rem;
overflow: hidden;
border: 1px solid #e5e7eb;
max-width: 90vw; /_ Responsive width _/
max-height: 80vh; /_ Responsive height _/
width: 300px; /_ Default width for the picker _/
height: 300px; /_ Default height for the picker _/
}

.reactionEmojiPickerOverlay {
position: fixed;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
background-color: rgba(0, 0, 0, 0.3); /_ Semi-transparent overlay _/
z-index: 25; /_ Below emoji picker, above everything else _/
}

.typingIndicator {
color: #6b7280;
font-style: italic;
font-size: 0.875rem;
animation: pulse 1.5s infinite;
margin-left: 3.5rem;
}

/_ Styles for the input form and its elements _/
.inputForm {
padding: 1rem;
border-top: 1px solid #e5e7eb;
display: flex;
flex-direction: column; /_ Stack preview above input field _/
gap: 0.5rem;
background-color: #f9fafb; /_ Lighter background for the input form _/
position: relative;
}

.inputFieldWrapper {
flex: 1;
display: flex;
align-items: center;
background-color: #ffffff; /_ White background for the input field itself _/
border: 1px solid #e5e7eb; /_ Subtle border _/
border-radius: 9999px; /_ Fully rounded pill shape _/
padding: 0.25rem 0.75rem; /_ Adjusted padding _/
transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); /_ Soft shadow _/
}

.inputFieldWrapper:focus-within {
border-color: #3b82f6; /_ Blue border on focus _/
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); /_ Soft blue glow on focus _/
}

.attachFileButton, /_ Renamed from imageButton _/
.emojiButton {
background: none;
border: none;
padding: 0.5rem;
color: #6b7280; /_ Neutral color _/
cursor: pointer;
font-size: 1.2rem;
display: flex; /_ For perfect centering of icon _/
align-items: center;
justify-content: center;
border-radius: 9999px; /_ Make it circular _/
transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

.attachFileButton:hover,
.emojiButton:hover {
color: #2563eb; /_ Blue on hover _/
background-color: #eef2ff; /_ Very light blue background on hover _/
}

.attachFileButton:focus,
.emojiButton:focus {
outline: none;
box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); /_ Focus ring _/
}

.attachFileIcon, /_ Renamed from imageIcon _/
.emojiIcon {
width: 1.5rem; /_ Ensure consistent size _/
height: 1.5rem;
}

.messageInput {
flex: 1;
padding: 0.75rem 0.5rem; /_ Adjusted padding for better fit in rounded wrapper _/
background-color: transparent;
outline: none;
border: none;
color: #374151;
font-size: 1rem; /_ Standard text size _/
line-height: 1.5;
resize: none; /_ Prevent manual resizing by user _/
min-height: 2.5rem; /_ Minimum height for input area _/
max-height: 5rem; /_ Max height before scrolling, adjust as needed _/
overflow-y: auto; /_ Enable scrolling for long text _/
scrollbar-width: none; /_ Hide scrollbar for Firefox _/
-ms-overflow-style: none; /_ Hide scrollbar for IE/Edge _/
}

.messageInput::-webkit-scrollbar {
display: none; /_ Hide scrollbar for Chrome, Safari, Opera _/
}

.messageInput::placeholder {
color: #9ca3af;
}

.messageInput:disabled {
cursor: not-allowed;
opacity: 0.7;
background-color: #f3f4f6; /_ Slightly greyed out when disabled _/
}

.sendButton {
background-color: #3b82f6; /_ Solid blue button _/
color: #ffffff; /_ White text _/
border: none;
border-radius: 9999px; /_ Fully rounded _/
padding: 0.6rem 1rem; /_ Generous padding _/
font-size: 1rem;
font-weight: 600;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
gap: 0.25rem; /_ Space between icon and text if any _/
transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out,
box-shadow 0.2s ease-in-out;
box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3),
0 2px 4px -1px rgba(59, 130, 246, 0.2); /_ Elevated shadow _/
}

.sendButton:hover {
background-color: #2563eb; /_ Darker blue on hover _/
transform: translateY(-1px); /_ Slight lift effect _/
box-shadow: 0 6px 8px -2px rgba(59, 130, 246, 0.4); /_ Enhanced shadow on hover _/
}

.sendButton:focus {
outline: none;
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); /_ Focus ring _/
}

.sendButton:disabled {
opacity: 0.6;
cursor: not-allowed;
background-color: #93c5fd; /_ Lighter blue when disabled _/
box-shadow: none; /_ No shadow when disabled _/
transform: none; /_ No transform when disabled _/
}

.emojiPickerContainer {
position: absolute;
bottom: 80px;
right: 1rem;
z-index: 20;
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
0 4px 6px -2px rgba(0, 0, 0, 0.05);
border-radius: 0.5rem;
overflow: hidden;
border: 1px solid #e5e7eb;
}

@media (min-width: 768px) {
.emojiPickerContainer {
right: 50%;
transform: translateX(50%);
}
}

/_ Base styles for the body to ensure Inter font and a light background _/
body {
font-family: "Inter", sans-serif;
margin: 0;
padding: 0;
background-color: #f0f2f5;
}

/_ Custom scrollbar styles _/
.scrollbar-thin {
scrollbar-width: thin;
scrollbar-color: #9ca3af #e5e7eb;
}
.scrollbar-thin::-webkit-scrollbar {
width: 8px;
height: 8px;
}
.scrollbar-thin::-webkit-scrollbar-track {
background: #e5e7eb;
border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
background-color: #9ca3af;
border-radius: 10px;
border: 2px solid #e5e7eb;
}

/_ Specific override for emoji picker _/
.EmojiPickerReact {
z-index: 20 !important;
}

/_ Styles for file input and preview _/
.hiddenFileInput {
display: none; /_ Hide the default file input _/
}

.selectedFilePreview {
/_ Renamed from selectedImagePreview _/
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.5rem;
border: 1px solid #d1d5db;
border-radius: 0.5rem;
background-color: #eef2ff; /_ Light background for preview _/
margin-bottom: 0.5rem; /_ Space before the actual input field _/
width: fit-content; /_ Shrink to content width _/
max-width: 90%; /_ Prevent overflow _/
overflow: hidden; /_ Hide overflow for long file names _/
}

.previewThumbnail {
width: 50px;
height: 50px;
object-fit: cover;
border-radius: 0.3rem;
border: 1px solid #cbd5e1;
}

.fileTypeIcon {
font-size: 2rem;
color: #6b7280;
}

.fileNamePreview {
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis; /_ Truncate long file names _/
max-width: calc(100% - 70px); /_ Adjust based on icon/button width _/
font-size: 0.9rem;
color: #374151;
}

.clearFileButton {
/_ Renamed from clearImageButton _/
background: none;
border: none;
color: #ef4444; /_ Red color for clear button _/
cursor: pointer;
font-size: 1.2rem;
padding: 0.2rem;
border-radius: 9999px;
transition: background-color 0.2s ease-in-out;
}

.clearFileButton:hover {
background-color: rgba(239, 68, 68, 0.1); /_ Light red background on hover _/
}

/_ Editing message styles _/
.editingIndicator {
background-color: #fffbeb; /_ Light yellow background _/
color: #92400e; /_ Darker yellow text _/
padding: 0.5rem 1rem;
border-radius: 0.5rem;
border: 1px solid #fcd34d;
margin-bottom: 0.5rem;
display: flex;
align-items: center;
justify-content: space-between;
font-size: 0.9rem;
}

.editingMessageTextPreview {
font-weight: 600;
margin-right: 0.5rem;
}

.cancelEditButton {
background: none;
border: none;
color: #92400e;
cursor: pointer;
font-size: 0.9rem;
display: flex;
align-items: center;
gap: 0.2rem;
padding: 0.2rem 0.5rem;
border-radius: 0.3rem;
transition: background-color 0.2s ease;
}
.cancelEditButton:hover {
background-color: rgba(252, 211, 77, 0.3);
}

/_ NEW: Image Modal Styles _/
.imageModalOverlay {
position: fixed;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
background-color: rgba(0, 0, 0, 0.8); /_ Dark overlay _/
display: flex;
align-items: center;
justify-content: center;
z-index: 1000; /_ Ensure it's on top of everything _/
}

.imageModalContent {
position: relative;
background-color: #fff;
padding: 1rem;
border-radius: 0.5rem;
box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
max-width: 90vw;
max-height: 90vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
}

.closeModalButton {
position: absolute;
top: 0.5rem;
right: 0.5rem;
background: none;
border: none;
color: #fff; /_ White close icon for dark overlay _/
font-size: 2rem;
cursor: pointer;
z-index: 1001; /_ Above image and modal content _/
background-color: rgba(0, 0, 0, 0.5);
border-radius: 50%;
width: 40px;
height: 40px;
display: flex;
align-items: center;
justify-content: center;
transition: background-color 0.2s ease;
}
.closeModalButton:hover {
background-color: rgba(0, 0, 0, 0.7);
}

.fullSizeImage {
max-width: 100%;
max-height: calc(90vh - 80px); /_ Adjust for header/footer in modal _/
object-fit: contain;
border-radius: 0.5rem;
}

.modalActions {
margin-top: 1rem;
display: flex;
align-items: center;
gap: 1rem;
background-color: #f3f4f6;
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;
width: 100%;
justify-content: space-between;
}

.downloadModalButton {
background-color: #2563eb;
color: #ffffff;
border: none;
padding: 0.6rem 1rem;
border-radius: 0.375rem;
font-size: 0.9rem;
font-weight: 600;
cursor: pointer;
display: flex;
align-items: center;
gap: 0.5rem;
transition: background-color 0.2s ease;
}

.downloadModalButton:hover {
background-color: #1e40af;
}

.modalImageName {
font-size: 0.9rem;
color: #4b5563;
max-width: 60%;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

/_ Responsive adjustments for modal _/
@media (max-width: 600px) {
.imageModalContent {
max-width: 95vw;
max-height: 95vh;
padding: 0.5rem;
}
.fullSizeImage {
max-height: calc(95vh - 70px);
}
.modalActions {
flex-direction: column;
gap: 0.5rem;
padding: 0.5rem;
}
.downloadModalButton {
width: 100%;
justify-content: center;
}
.modalImageName {
max-width: 100%;
text-align: center;
}
}
