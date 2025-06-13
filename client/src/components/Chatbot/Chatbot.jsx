import React, { useState, useRef, useEffect, forwardRef } from "react"; // Import forwardRef
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import styles from "./Chatbot.module.css";

// Import icons from react-icons
import {
  FiPlusSquare,
  FiList,
  FiSend,
  FiMessageSquare,
  FiClock,
} from "react-icons/fi"; // Feather icons

// Wrap the Chatbot component with forwardRef
const Chatbot = forwardRef((props, ref) => {
  // Accept props and ref as arguments
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentView, setCurrentView] = useState("chat"); // 'chat' or 'historyList'
  const [chatSessions, setChatSessions] = useState([]);

  // Use a different ref name internally if you still need to scroll,
  // or use the forwarded 'ref' for scrolling if it points to the messagesContainer.
  // For now, let's keep messagesEndRef for internal scrolling.
  const messagesEndRef = useRef(null);

  const API_CHAT_URL = "http://localhost:5000/api/ai/chat";
  const API_HISTORY_URL = "http://localhost:5000/api/ai/history";
  const API_ALL_SESSIONS_URL = "http://localhost:5000/api/ai/sessions";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedSessionId = localStorage.getItem("chatbotSessionId");
    let currentSession = savedSessionId;

    if (!savedSessionId) {
      currentSession = uuidv4();
      localStorage.setItem("chatbotSessionId", currentSession);
    }
    setSessionId(currentSession);

    const loadCurrentSessionHistory = async () => {
      if (currentSession) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${API_HISTORY_URL}?sessionId=${currentSession}`
          );
          // const response = await api.get(
          //   `/history?sessionId=${currentSession}`
          // );
          if (response.data.history && response.data.history.length > 0) {
            setMessages(response.data.history);
          } else {
            setMessages([
              { role: "model", parts: "Hi there! How can I help you today?" },
            ]);
          }
        } catch (error) {
          console.error(
            "Error loading chat history for current session:",
            error
          );
          setMessages([
            {
              role: "model",
              parts: "Error loading previous chat. Starting fresh.",
            },
          ]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCurrentSessionHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const userMessage = { role: "user", parts: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(API_CHAT_URL, {
        message: userMessage.parts,
        sessionId: sessionId,
        // userId: YOUR_USER_ID_HERE, // Pass actual user ID if available
      });
      // const response = await api.post("/chat", {
      //   message: userMessage.parts,
      //   sessionId: sessionId,
      // });

      const aiReply = { role: "model", parts: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, aiReply]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "model",
          parts: "Error: Could not get a response. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    const newSessionId = uuidv4();
    localStorage.setItem("chatbotSessionId", newSessionId);
    setSessionId(newSessionId);
    setMessages([
      { role: "model", parts: "New chat started! How can I help you?" },
    ]);
    setInput("");
    setCurrentView("chat"); // Always switch to chat view when starting new chat
  };

  const fetchAllChatSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ALL_SESSIONS_URL); // Add ?userId=${YOUR_USER_ID_HERE} if filtering
      setChatSessions(response.data.sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      setChatSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const viewChatHistoryList = async () => {
    setCurrentView("historyList");
    await fetchAllChatSessions(); // Fetch sessions when switching to history view
  };

  const loadSpecificChat = async (selectedSessionId) => {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_HISTORY_URL}?sessionId=${selectedSessionId}`
      );
      if (response.data.history) {
        setMessages(response.data.history);
        setSessionId(selectedSessionId); // Update current session ID to the loaded one
        localStorage.setItem("chatbotSessionId", selectedSessionId); // Save to local storage
        setCurrentView("chat"); // Switch back to chat view
      }
    } catch (error) {
      console.error("Error loading specific chat history:", error);
      setMessages([
        {
          role: "model",
          parts: `Error loading chat for session ${selectedSessionId}.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Attach the forwarded ref to the outermost div of your Chatbot component
    <div className={styles.chatbotContainer} ref={ref}>
      {/* Header with title and main action buttons */}
      <div className={styles.chatHeader}>
        <h1 className={styles.chatTitle}>AI Assistant</h1>
        <div className={styles.headerButtons}>
          <button
            onClick={startNewChat}
            className={styles.newChatButton}
            title="Start New Chat"
          >
            <FiMessageSquare className={styles.buttonIcon} /> New Chat
          </button>
          <button
            onClick={viewChatHistoryList}
            className={styles.historyButton}
            title="View Chat History"
          >
            <FiClock className={styles.buttonIcon} /> History
          </button>
        </div>
      </div>

      {currentView === "chat" && (
        <>
          <div className={styles.messagesContainer}>
            {messages.length === 0 && !loading && (
              <div className={styles.welcomeMessage}>
                Hi there! How can I help you today?
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  msg.role === "user" ? styles.userMessage : styles.aiMessage
                }`}
              >
                {msg.parts}
              </div>
            ))}
            {loading && (
              <div className={styles.loadingMessage}>Thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className={styles.inputContainer}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className={styles.inputField}
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={loading}
            >
              <FiSend className={styles.sendIcon} />
            </button>
          </form>
        </>
      )}

      {currentView === "historyList" && (
        <div className={styles.historyListContainer}>
          <h2>Your Chat Sessions</h2>
          {loading ? (
            <p className={styles.loadingText}>Loading sessions...</p>
          ) : chatSessions.length === 0 ? (
            <p className={styles.noHistoryText}>
              No chat sessions found. Start a new chat to create one.
            </p>
          ) : (
            <ul className={styles.sessionList}>
              {chatSessions.map((session) => (
                <li key={session.id} className={styles.sessionItem}>
                  <div className={styles.sessionInfo}>
                    <FiMessageSquare className={styles.sessionIcon} />
                    <span className={styles.sessionName}>{session.name}</span>
                    <small className={styles.sessionDate}>
                      {session.last_updated && ` (${session.last_updated})`}
                    </small>
                  </div>
                  <button
                    onClick={() => loadSpecificChat(session.id)}
                    className={styles.loadChatButton}
                  >
                    Load Chat
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setCurrentView("chat")}
            className={styles.backToChatButton}
          >
            Back to Chat
          </button>
        </div>
      )}
    </div>
  );
});

export default Chatbot;
