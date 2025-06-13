import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserState } from "../App"; // Adjust path if necessary, assuming App.jsx is one level up

const PrivateRoute = () => {
  const { user } = useContext(UserState); // Get the user state from your context

  // If 'user' is null or undefined (meaning not logged in),
  // redirect to the authentication page.
  // Otherwise, render the nested (protected) routes.
  return user ? <Outlet /> : <Navigate to="/auth" />;
};

export default PrivateRoute;
