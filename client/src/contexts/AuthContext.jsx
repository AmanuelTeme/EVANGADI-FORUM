// contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Create the Auth Context
const AuthContext = createContext(null);

// Custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  // user state will hold the authenticated user's data (e.g., { userid, username, email, avatar_url })
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To indicate if auth state is being loaded
  const [authReady, setAuthReady] = useState(false); // New state to indicate when auth check is complete

  // Function to check user's login status (e.g., via token in localStorage)
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token"); // Assuming JWT token is stored here

    if (token) {
      try {
        // Call your backend to verify the token and get user details
        const response = await fetch("http://localhost:5000/api/check-user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user); // Set the user data from the backend response
          console.log("AuthContext: User authenticated via token:", data.user);
        } else {
          console.error("AuthContext: Token verification failed or expired.");
          localStorage.removeItem("token"); // Remove invalid token
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error checking auth status:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false); // Mark loading as complete
        setAuthReady(true); // Mark auth as ready
      }
    } else {
      setUser(null);
      setLoading(false); // Mark loading as complete
      setAuthReady(true); // Mark auth as ready (even if no token)
    }
  }, []);

  // Function to handle user login
  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token); // Store the JWT token
        setUser(data.user); // Set the user data
        setAuthReady(true); // Mark auth as ready on successful login
        console.log("AuthContext: Login successful:", data.user);
        return { success: true, message: "Login successful!" };
      } else {
        // Handle login errors from backend
        console.error("AuthContext: Login failed:", data.message);
        return { success: false, message: data.message || "Login failed." };
      }
    } catch (error) {
      console.error(
        "AuthContext: Network or server error during login:",
        error
      );
      return { success: false, message: "Network error. Please try again." };
    }
  };

  // Function to handle user logout
  const logout = () => {
    localStorage.removeItem("token"); // Remove token from local storage
    setUser(null); // Clear user state
    // Keep authReady as true, as the auth check is still complete, just the user is now null
    console.log("AuthContext: User logged out.");
  };

  // Effect to run once on component mount to check initial auth status
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]); // Dependency array includes checkAuthStatus for useCallback optimization

  // The value provided to consumers of this context
  const authContextValue = {
    user,
    loading, // Expose loading state
    authReady, // Expose authReady state
    login,
    logout,
    isAuthenticated: !!user, // Convenience boolean
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
