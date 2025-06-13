import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import Chatbot from "../components/Chatbot/Chatbot.jsx";
import { useAuth } from "../contexts/AuthContext.jsx"; // ✅ Import AuthContext
import classes from "./Layout.module.css";

function Layout({ children }) {
  const { isAuthenticated, loading } = useAuth(); // ✅ Get auth state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotAnimating, setChatbotAnimating] = useState(false);

  const chatbotRef = useRef(null);
  const chatbotToggleButtonRef = useRef(null);

  const toggleChatbotVisibility = () => {
    if (!showChatbot) {
      setShowChatbot(true);
      setTimeout(() => setChatbotAnimating(true), 50);
    } else {
      setChatbotAnimating(false);
      setTimeout(() => setShowChatbot(false), 300);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        chatbotRef.current &&
        !chatbotRef.current.contains(event.target) &&
        chatbotToggleButtonRef.current &&
        !chatbotToggleButtonRef.current.contains(event.target)
      ) {
        if (showChatbot) {
          setChatbotAnimating(false);
          setTimeout(() => setShowChatbot(false), 300);
        }
      }
    }

    if (showChatbot) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showChatbot]);

  return (
    <div>
      <Header />
      <div style={{ minHeight: "100vh" }}>{children}</div>

      {!loading &&
        isAuthenticated && ( // ✅ Show chatbot only after login check is complete and user is logged in
          <>
            <div
              className={classes.chatbotToggleArea}
              onClick={toggleChatbotVisibility}
              title={showChatbot ? "Hide Chatbot" : "Ask Chatbot"}
              ref={chatbotToggleButtonRef}
            >
              <span className={classes.askChatbotText}>Ask Chatbot</span>
              <span className={classes.chatbotIcon}>🤖</span>
            </div>

            {showChatbot && (
              <div
                className={`${classes.chatbotColumn} ${
                  chatbotAnimating ? classes.fadeIn : classes.fadeOut
                }`}
                ref={chatbotRef}
              >
                <Chatbot />
              </div>
            )}
          </>
        )}

      <Footer />
    </div>
  );
}

export default Layout;
