// App.jsx (relevant parts)
import { createContext, useEffect, useState } from "react";
import "./App.css";
import { axiosInstance } from "./utility/axios";
import AppRouter from "./routes/AppRouter.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

<ToastContainer position="top-right" autoClose={3000} />;
export const UserState = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("EV-Forum-user", JSON.stringify(userData));
    setUser(userData); // <--- This sets the user immediately
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("EV-Forum-user");
    setUser(null);
    delete axiosInstance.defaults.headers.common["Authorization"];
  };

  const getUserData = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        return;
      }

      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const response = await axiosInstance.get("/user/check");
      // --- IMPORTANT FIX START ---
      // The API returns { user: { username, userid } }.
      // We need to extract the inner 'user' object.
      const userData = response.data.user;
      // --- IMPORTANT FIX END ---

      console.log("Fetched user data:", userData); // This will now log the direct user object
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("EV-Forum-user");
      delete axiosInstance.defaults.headers.common["Authorization"];
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  if (loadingUser) {
    return <div>Loading application...</div>;
  }

  return (
    <UserState.Provider value={{ user, setUser, login, logout }}>
      <AppRouter />
    </UserState.Provider>
  );
}

export default App;
