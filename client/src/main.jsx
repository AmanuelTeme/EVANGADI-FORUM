// main.jsx or index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom"; // ✅ Import router
import { AuthProvider } from "./contexts/AuthContext"; // ✅ Import AuthProvider

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* ✅ Router first */}
      <AuthProvider>
        {" "}
        {/* ✅ Then AuthProvider inside */}
        <App /> {/* ✅ Your app with routes inside */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
