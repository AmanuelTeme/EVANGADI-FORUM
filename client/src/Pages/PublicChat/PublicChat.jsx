import React, { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import styles from "./PublicChat.module.css"; // Import the CSS module
import { UserState } from "../../App.jsx"; // Assuming UserState is defined here
import {
  FiSend,
  FiSmile,
  FiX,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiUsers,
  FiMessageCircle,
  FiPaperclip, // Using FiPaperclip for attachment button
} from "react-icons/fi"; // Added more icons
import EmojiPicker from "emoji-picker-react";
import Loader from "../../components/Loader/Loader.jsx"; // Assuming you have a loader component
import Swal from "sweetalert2"; // For confirmations

const SOCKET_SERVER_URL = "http://localhost:5000"; // IMPORTANT: Ensure your Socket.IO server is running on this URL
const PUBLIC_CHAT_ROOM_ID = "stackoverflow_lobby"; // Unique ID for the public chat room

// Define common reaction emojis
const COMMON_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉"];

// Helper function to generate a consistent private chat room ID
// This must match the logic on your backend (app.js: getPrivateChatRoomId)
const getPrivateChatRoomId = (user1Id, user2Id) => {
  if (!user1Id || !user2Id) return null;
  const sortedIds = [user1Id, user2Id].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
};

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
  const [registeredUsers, setRegisteredUsers] = useState([]); // State for all registered users
  const [showRegisteredUsersModal, setShowRegisteredUsersModal] =
    useState(false); // State for controlling modal visibility

  const [showReactionMenuForMessageId, setShowReactionMenuForMessageId] =
    useState(null); // Stores message_id if mini palette is open
  const [showFullReactionEmojiPicker, setShowFullReactionEmojiPicker] =
    useState(null); // Stores message_id if full picker is open

  // File/Image attachment states
  const [selectedFile, setSelectedFile] = useState(null); // State for general file data {data: Base64, name: string, type: string}
  const fileInputRef = useRef(null); // Ref for the hidden file input (for images and general files)

  // Image modal states (for viewing full-size images sent in chat)
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageData, setModalImageData] = useState(null);
  const [modalImageName, setModalImageName] = useState(null);

  const [chatMode, setChatMode] = useState("public"); // 'public' or 'private'
  const [currentDmRecipient, setCurrentDmRecipient] = useState(null); // {userId, username, avatar_url}

  // Message editing states
  const [editingMessageId, setEditingMessageId] = useState(null); // ID of the message being edited
  const [editingMessageText, setEditingMessageText] = useState(""); // Text of the message being edited

  // Refs for managing DOM elements and timeouts
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null); // Ref to scroll to the latest message
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
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

      // Determine the room ID based on current chat mode
      let roomToJoin;
      let fetchHistoryData = { userId: user?.userid };

      if (chatMode === "public") {
        roomToJoin = PUBLIC_CHAT_ROOM_ID;
        fetchHistoryData.roomId = PUBLIC_CHAT_ROOM_ID;
      } else if (chatMode === "private" && currentDmRecipient) {
        roomToJoin = getPrivateChatRoomId(
          user?.userid,
          currentDmRecipient.userId
        );
        fetchHistoryData.roomId = roomToJoin;
        fetchHistoryData.targetUserId = currentDmRecipient.userId; // Pass targetUserId for private history
      } else {
        // Fallback or initial state if no recipient for private chat is set
        roomToJoin = PUBLIC_CHAT_ROOM_ID;
        fetchHistoryData.roomId = PUBLIC_CHAT_ROOM_ID;
      }

      // Join the determined room
      newSocket.emit("join_room", roomToJoin);
      // Fetch chat history for that room
      newSocket.emit("fetch_chat_history", fetchHistoryData);

      // Notify server about user being online if logged in
      if (user?.userid && user?.username) {
        newSocket.emit("user_online", {
          userId: user.userid,
          username: user.username,
          avatar_url: user.avatar_url,
        });
      }
    });

    // Listener for new messages
    newSocket.on("message", (message) => {
      console.log("New message received:", message);
      // Determine the correct room ID for the incoming message
      const messageActualRoomId =
        message.message_type === "private" && message.recipient_id
          ? getPrivateChatRoomId(message.user_id, message.recipient_id)
          : message.room_id;

      // Determine the current active room ID on the client
      const currentActiveRoomId =
        chatMode === "public"
          ? PUBLIC_CHAT_ROOM_ID
          : currentDmRecipient
          ? getPrivateChatRoomId(user?.userid, currentDmRecipient.userId)
          : null;

      // Only add message if it belongs to the currently active chat mode/recipient
      if (messageActualRoomId === currentActiveRoomId) {
        setMessages((prev) => [...prev, message]);
      } else {
        console.log(
          `Message received for room ${messageActualRoomId}, but current room is ${currentActiveRoomId}. Not displaying.`
        );
      }
      setIsTyping(false);
    });

    // Listener for chat history (initial load)
    newSocket.on("chat_history", (history) => {
      console.log("Chat history received:", history);
      setMessages(
        history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      );
      setLoadingHistory(false);
    });

    // Listener for online users updates
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

    // Listener for typing indicators
    newSocket.on("typing", (data) => {
      // Ensure typing indicator is only shown for the relevant room
      const typingRoomId = data.roomId || PUBLIC_CHAT_ROOM_ID;
      const currentActiveRoomId =
        chatMode === "public"
          ? PUBLIC_CHAT_ROOM_ID
          : currentDmRecipient
          ? getPrivateChatRoomId(user?.userid, currentDmRecipient.userId)
          : null;

      if (
        data.userId !== user?.userid &&
        typingRoomId === currentActiveRoomId
      ) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000); // Hide after 2 seconds of no new typing event
      }
    });

    // Listener for stop typing indicators
    newSocket.on("stop_typing", (data) => {
      const typingRoomId = data.roomId || PUBLIC_CHAT_ROOM_ID;
      const currentActiveRoomId =
        chatMode === "public"
          ? PUBLIC_CHAT_ROOM_ID
          : currentDmRecipient
          ? getPrivateChatRoomId(user?.userid, currentDmRecipient.userId)
          : null;

      if (
        data.userId !== user?.userid &&
        typingRoomId === currentActiveRoomId
      ) {
        clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
      }
    });

    // Listener for socket disconnection
    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server.");
      setSocket(null);
      if (user?.userid) {
        newSocket.emit("user_offline", { userId: user.userid });
      }
    });

    // Listener for connection errors
    newSocket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Listener for server-emitted errors
    newSocket.on("error", (errorMessage) => {
      Swal.fire({
        icon: "error",
        title: "Chat Error",
        text: errorMessage,
      });
    });

    // Cleanup function for useEffect
    return () => {
      newSocket.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [user, chatMode, currentDmRecipient]); // Reconnect when chat mode or DM recipient changes

  // Effect hook to fetch all registered users
  useEffect(() => {
    const fetchRegisteredUsers = async () => {
      if (!user?.userid) {
        // Only fetch if user is logged in
        setRegisteredUsers([]);
        return;
      }
      try {
        // MODIFIED: Include Authorization header with JWT
        const response = await fetch("http://localhost:5000/api/v1/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
          },
        });
        if (!response.ok) {
          // Check for 401 specifically to give a more precise error message
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const users = await response.json();
        // The backend returns { users: [...] } so access the 'users' array
        setRegisteredUsers(
          users.users.filter((u) => u.userid !== user?.userid)
        );
      } catch (error) {
        console.error("Failed to fetch registered users:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Could not fetch registered users: ${error.message || ""}`,
        });
        setRegisteredUsers([]); // Clear users on error
      }
    };

    fetchRegisteredUsers();
  }, [user?.userid]); // Re-fetch if the logged-in user changes

  // Effect hook to scroll to the bottom of the messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    messages,
    isTyping,
    showReactionMenuForMessageId,
    showFullReactionEmojiPicker,
    editingMessageId,
    // Dependency for image modal, ensures scroll after opening/closing can be smooth
    showImageModal,
  ]);

  // Effect hook to close emoji pickers and reaction menus when clicking outside
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
        // Check if click was inside a message bubble but not specifically on a react button
        const isClickInsideMessageBubble = event.target.closest(
          `.${styles.messageBubble}`
        );

        if (
          !isClickInsideReactionMenu &&
          !isClickInsideFullReactionPicker &&
          !isClickOnReactButton &&
          // Only close if click is NOT within the message bubble itself when a reaction menu is open
          (showReactionMenuForMessageId !== null
            ? !isClickInsideMessageBubble
            : true)
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
    if (socket && user?.userid) {
      const roomToSend =
        chatMode === "public"
          ? PUBLIC_CHAT_ROOM_ID
          : currentDmRecipient
          ? getPrivateChatRoomId(user.userid, currentDmRecipient.userId)
          : null;

      if (roomToSend) {
        if (e.target.value.trim().length > 0) {
          socket.emit("typing", {
            userId: user.userid,
            username: user.username,
            roomId: roomToSend,
            message_type: chatMode,
            recipient_id: currentDmRecipient?.userId || null,
          });
        } else {
          socket.emit("stop_typing", {
            userId: user.userid,
            roomId: roomToSend,
            message_type: chatMode,
            recipient_id: currentDmRecipient?.userId || null,
          });
        }
      }
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && user?.userid) {
        const roomToSend =
          chatMode === "public"
            ? PUBLIC_CHAT_ROOM_ID
            : currentDmRecipient
            ? getPrivateChatRoomId(user.userid, currentDmRecipient.userId)
            : null;
        if (roomToSend) {
          socket.emit("stop_typing", {
            userId: user.userid,
            roomId: roomToSend,
            message_type: chatMode,
            recipient_id: currentDmRecipient?.userId || null,
          });
        }
      }
    }, 1000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const messageText = input.trim();

    if (editingMessageId) {
      handleEditMessageConfirm();
      return;
    }

    if ((messageText || selectedFile) && socket && user?.userid) {
      let roomToSend;
      let recipientIdToSend = null;

      if (chatMode === "private" && currentDmRecipient) {
        roomToSend = getPrivateChatRoomId(
          user.userid,
          currentDmRecipient.userId
        );
        recipientIdToSend = currentDmRecipient.userId;
      } else {
        roomToSend = PUBLIC_CHAT_ROOM_ID;
      }

      const messagePayload = {
        roomId: roomToSend,
        text: messageText,
        userId: user.userid,
        username: user.username,
        avatar_url: user.avatar_url,
        message_type: chatMode,
        recipient_id: recipientIdToSend,
        reactions: [],
        file_data: selectedFile ? selectedFile.data : null,
        file_name: selectedFile ? selectedFile.name : null,
        file_type: selectedFile ? selectedFile.type : null,
      };

      console.log("Sending message:", messagePayload);
      socket.emit("chat message", messagePayload);

      setInput("");
      setSelectedFile(null); // Clear selected file
      setShowInputEmojiPicker(false); // Make sure this is reset
      clearTimeout(typingTimeoutRef.current);

      if (socket && user?.userid) {
        socket.emit("stop_typing", {
          userId: user.userid,
          roomId: roomToSend,
          message_type: chatMode,
          recipient_id: recipientIdToSend,
        });
      }
    } else if (!user?.userid) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "You must be logged in to send messages.",
      });
    }
  };

  const onInputEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowInputEmojiPicker(false); // ADDED: Close picker after selection
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

    // Close reaction menus after interaction (can be kept open too depending on UX choice)
    setShowReactionMenuForMessageId(null); // Close mini menu
    setShowFullReactionEmojiPicker(null); // Close full picker
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
      if (file.size > 5 * 1024 * 1024) {
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
        setInput(""); // Clear text input as file is being sent
      };
      reader.readAsDataURL(file);
    }
    // Clear the file input's value after selection to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      link.target = "_blank"; // Open in new tab
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

  // NEW: Function to open image in a modal
  const openImageInModal = (imageData, imageName) => {
    setModalImageData(imageData);
    setModalImageName(imageName);
    setShowImageModal(true);
  };

  // Function to start editing a message
  const startEditingMessage = (message) => {
    setEditingMessageId(message.message_id);
    setEditingMessageText(message.message_text);
    setInput(message.message_text); // Pre-fill input with message text
    setSelectedFile(null); // Clear file selection when editing text
    setShowInputEmojiPicker(false); // Close emoji picker
  };

  // Function to confirm and send edited message
  const handleEditMessageConfirm = () => {
    if (
      editingMessageId &&
      editingMessageText.trim() &&
      socket &&
      user?.userid
    ) {
      // Pass file_data, file_name, file_type as null if not sending a new file with edit
      // (current implementation only allows text editing)
      socket.emit("edit_message", {
        messageId: editingMessageId,
        newText: editingMessageText.trim(),
        userId: user.userid,
        file_data: null, // No file change allowed during text edit
        file_name: null,
        file_type: null,
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
    setSelectedFile(null);
    setEditingMessageId(null);
    setEditingMessageText("");
    setShowRegisteredUsersModal(false); // Close modal when switching mode

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
            title="Switch to Public Chat"
          >
            <FiUsers className={styles.chatModeIcon} /> Public
          </button>
          <button
            className={`${styles.chatModeButton} ${
              chatMode === "private" ? styles.activeMode : ""
            }`}
            onClick={() => setShowRegisteredUsersModal(true)} // Open modal to select DM recipient
            disabled={!user?.userid}
            title="Start a Private Chat"
          >
            <FiMessageCircle className={styles.chatModeIcon} /> Private
          </button>

          <div className={styles.onlineUsersButtonWrapper}>
            <button
              className={styles.onlineUsersButton}
              onClick={() => {
                /* You can add a modal here to show detailed online user list */
              }}
              title="View Online Users"
            >
              Online ({onlineUsers.length})
            </button>
          </div>
        </div>
      </header>

      {/* Display of online users */}
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

      {/* Main message display area */}
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
                        "https://placehold.co/32x32/ff6600/white?text=?"; // Fallback
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
                          onClick={() =>
                            openImageInModal(msg.file_data, msg.file_name)
                          } // Open image in modal on click
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
                            <button
                              onClick={() =>
                                downloadFile(
                                  msg.file_data,
                                  msg.file_name,
                                  msg.file_type
                                )
                              }
                              className={styles.fileDownloadButton} // Use the new button style
                              title={`Download ${msg.file_name}`}
                            >
                              <FiDownload className={styles.fileIcon} />
                              <span>{msg.file_name}</span>
                            </button>
                          </div>
                        )}
                      {msg.message_text && (
                        <p className={styles.messageText}>{msg.message_text}</p>
                      )}

                      {/* NEW POSITION: Reactions here, after text/files */}
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
                              title={`Reacted by: ${reaction.usernames.join(
                                ", "
                              )}`}
                            >
                              <span className={styles.emoji}>
                                {reaction.emoji}
                              </span>
                              <span className={styles.count}>
                                {reaction.userIds.length}
                              </span>
                            </span>
                          ))}
                        </div>
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

                  {/* NEW POSITION: Reaction, Edit, Delete Buttons at the bottom */}
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

                  {/* Reaction Mini Menu (position relative to messageBubble) */}
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

      {/* NEW: Registered Users Modal */}
      {showRegisteredUsersModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowRegisteredUsersModal(false)}
        >
          <div
            className={styles.registeredUsersModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Select a User for Private Chat</h3>
              <button
                className={styles.closeModalButton}
                onClick={() => setShowRegisteredUsersModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className={styles.modalBody}>
              {registeredUsers.length === 0 ? (
                <p>No other registered users found.</p>
              ) : (
                <ul className={styles.userList}>
                  {registeredUsers.map((u) => (
                    <li key={u.userid} className={styles.userListItem}>
                      <div className={styles.userInfo}>
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={`${u.username}'s avatar`}
                            className={styles.userListAvatar}
                          />
                        ) : (
                          <div className={styles.userListAvatarPlaceholder}>
                            {getUserInitial(u.username)}
                          </div>
                        )}
                        <span>{u.username}</span>
                        {onlineUsers.some(
                          (onlineUser) => onlineUser.userId === u.userid
                        ) && (
                          <span className={styles.onlineIndicatorSmall}></span>
                        )}
                      </div>
                      <button
                        className={styles.selectUserButton}
                        onClick={() => {
                          switchChatMode("private", {
                            userId: u.userid,
                            username: u.username,
                            avatar_url: u.avatar_url,
                          });
                          setShowRegisteredUsersModal(false); // Close modal
                        }}
                      >
                        Chat <FiMessageCircle />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW: Full-size Image View Modal */}
      {showImageModal && modalImageData && (
        <div
          className={styles.imageModalOverlay}
          onClick={() => setShowImageModal(false)}
        >
          <div
            className={styles.imageModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeModalButton}
              onClick={() => setShowImageModal(false)}
            >
              <FiX />
            </button>
            <img
              src={modalImageData}
              alt={modalImageName || "Full size image"}
              className={styles.fullSizeImage}
            />
            <div className={styles.modalActions}>
              <span className={styles.modalImageName}>{modalImageName}</span>
              <button
                onClick={() =>
                  downloadFile(modalImageData, modalImageName, null)
                } // Pass null for fileType as it's an image
                className={styles.downloadModalButton}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message input form */}
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
            style={{ display: "none" }} // Hidden input
            aria-label="Select file to send"
          />
          <button
            type="button"
            onClick={triggerFileInput}
            className={styles.attachButton}
            title="Attach File"
            disabled={editingMessageId !== null} // Disable file attach when editing
          >
            <FiPaperclip className={styles.attachIcon} />
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
              (!input.trim() && !selectedFile && !editingMessageId) ||
              !socket ||
              !user?.userid
            } // Disable if no text/file AND not editing, or not connected, or not logged in
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
            className={styles.inputEmojiPickerContainer}
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
              searchDisabled={false}
              skinTonesDisabled={false}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default PublicChat;
