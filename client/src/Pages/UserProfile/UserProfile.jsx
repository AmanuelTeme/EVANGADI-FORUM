import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import axios from "axios";

import Swal from "sweetalert2"; // Import SweetAlert2

// Import Lucide React Icons

import {
  User,
  Mail,
  Key,
  Save,
  XCircle,
  Edit,
  Loader,
  CalendarDays,
} from "lucide-react";

// Import your custom CSS module

import classes from "./UserProfile.module.css"; // Ensure this path is correct

function UserProfile() {
  const { userid } = useParams();

  const [userData, setUserData] = useState(null);

  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);

  const [editFullname, setEditFullname] = useState("");

  const [editUsername, setEditUsername] = useState("");

  const [editEmail, setEditEmail] = useState("");

  const [editPassword, setEditPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  console.log("UserID from URL params:", userid);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("User not authenticated. Please log in.");

        Swal.fire({
          icon: "error",

          title: "Authentication Required",

          text: "You are not logged in. Please log in to view your profile.",

          confirmButtonColor: "var(--red-error)",
        });

        return;
      }

      try {
        const requestUrl = `http://localhost:5000/api/v1/user/${userid}`;

        console.log("Attempting to fetch from URL:", requestUrl);

        const response = await axios.get(requestUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserData(response.data);

        const { fullname, username, email } = response.data;

        setEditFullname(fullname || "");

        setEditUsername(username || "");

        setEditEmail(email || "");

        setEditPassword("");

        setConfirmPassword("");

        setError(null);
      } catch (err) {
        console.error("Failed to fetch user:", err);

        let errorMessage =
          "Failed to load user profile. Please check the ID and try again.";

        if (err.response) {
          if (err.response.status === 401) {
            errorMessage =
              "Session expired or unauthorized. Please log in again.";

            Swal.fire({
              icon: "error",

              title: "Unauthorized Access",

              text: errorMessage,

              confirmButtonColor: "var(--red-error)",
            });
          } else {
            errorMessage = err.response.data?.Msg || errorMessage;

            Swal.fire({
              icon: "error",

              title: "Error Fetching Profile",

              text: errorMessage,

              confirmButtonColor: "var(--red-error)",
            });
          }
        } else {
          Swal.fire({
            icon: "error",

            title: "Network Error",

            text: "Could not connect to the server. Please check your internet connection or try again later.",

            confirmButtonColor: "var(--red-error)",
          });
        }

        setError(errorMessage);

        setUserData(null);
      }
    };

    if (userid) {
      fetchUserData();
    } else {
      setError("No user ID provided in the URL.");

      Swal.fire({
        icon: "warning",

        title: "Missing User ID",

        text: "No user ID was found in the URL. Please provide a valid ID.",

        confirmButtonColor: "var(--yellow-warning)",
      });
    }
  }, [userid]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);

    if (userData) {
      setEditFullname(userData.fullname || "");

      setEditUsername(userData.username || "");

      setEditEmail(userData.email || "");
    }

    setEditPassword("");

    setConfirmPassword("");

    Swal.fire({
      icon: "info",

      title: "Edit Cancelled",

      text: "Your changes have been discarded.",

      confirmButtonColor: "var(--info-blue)",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fullname") setEditFullname(value);
    else if (name === "username") setEditUsername(value);
    else if (name === "email") setEditEmail(value);
    else if (name === "password") setEditPassword(value);
    else if (name === "confirmPassword") setConfirmPassword(value);
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();

    if (editPassword && editPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",

        title: "Password Mismatch",

        text: "New password and confirm password do not match.",

        confirmButtonColor: "var(--yellow-warning)",
      });

      return;
    }

    if (editPassword && editPassword.length > 0 && editPassword.length < 8) {
      Swal.fire({
        icon: "warning",

        title: "Password Too Short",

        text: "Password should be at least 8 characters long.",

        confirmButtonColor: "var(--yellow-warning)",
      });

      return;
    }

    const updatedData = {
      fullname: editFullname,

      username: editUsername,

      email: editEmail,
    };

    if (editPassword) {
      updatedData.password = editPassword;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        icon: "error",

        title: "Authentication Required",

        text: "You are not logged in. Please log in to update your profile.",

        confirmButtonColor: "var(--red-error)",
      });

      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/v1/user/${userid}`,

        updatedData,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData((prev) => ({
        ...prev,

        fullname: updatedData.fullname,

        username: updatedData.username,

        email: updatedData.email,
      }));

      setIsEditing(false);

      setEditPassword("");

      setConfirmPassword("");

      setError(null);

      Swal.fire({
        icon: "success",

        title: "Profile Updated!",

        text:
          response.data.msg || "Your profile has been updated successfully.",

        confirmButtonColor: "var(--green-success)",
      });
    } catch (err) {
      console.error("Failed to update user profile:", err);

      console.error("Axios response error details:", err.response);

      console.error("Axios request error details:", err.request);

      let errorMessage = "Failed to update profile. Please try again.";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage =
            "Session expired or unauthorized. Please log in again.";
        } else if (err.response.data && err.response.data.Msg) {
          errorMessage = err.response.data.Msg;
        }
      }

      Swal.fire({
        icon: "error",

        title: "Update Failed",

        text: errorMessage,

        confirmButtonColor: "var(--red-error)",
      });

      setError(errorMessage);
    }
  }; // These conditional renders use the new custom CSS classes

  if (error && !userData) {
    return (
      <div className={classes["alert-box"]}>
               {" "}
        <div
          className={`${classes["alert-content"]} ${classes["alert-error-bg"]}`}
        >
                    <strong className={classes["alert-strong"]}>Error!</strong> 
                  <span className={classes["alert-span"]}>{error}</span>       {" "}
        </div>
             {" "}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={classes["alert-box"]}>
               {" "}
        <div
          className={`${classes["alert-content"]} ${classes["alert-loading-bg"]}`}
        >
                   {" "}
          <strong className={classes["alert-strong"]}>Loading...</strong>       
           {" "}
          <span className={classes["alert-span"]}>Loading user profile...</span>
                    <Loader className={classes["loader-icon"]} size={20} />     
           {" "}
        </div>
             {" "}
      </div>
    );
  }

  const { fullname, username, email, created_at } = userData;

  return (
    <div className={classes.profile_container}>
            <h2 className={classes.title}>User Profile</h2>     {" "}
      <div className={classes.profile_card}>
               {" "}
        {isEditing ? (
          <form onSubmit={handleSaveClick} className={classes.form}>
                                    {/* Added form class for spacing */}       
               {" "}
            <div className={classes.form_group}>
                           {" "}
              <label htmlFor="fullname">
                                <User className={classes["icon-label"]} /> Full
                Name:              {" "}
              </label>
                           {" "}
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={editFullname}
                onChange={handleInputChange}
                className={classes.input_field}
                required
              />
                         {" "}
            </div>
                       {" "}
            <div className={classes.form_group}>
                           {" "}
              <label htmlFor="username">
                                <User className={classes["icon-label"]} />{" "}
                Username:              {" "}
              </label>
                           {" "}
              <input
                type="text"
                id="username"
                name="username"
                value={editUsername}
                onChange={handleInputChange}
                className={classes.input_field}
                required
              />
                         {" "}
            </div>
                       {" "}
            <div className={classes.form_group}>
                           {" "}
              <label htmlFor="email">
                                <Mail className={classes["icon-label"]} />{" "}
                Email:              {" "}
              </label>
                           {" "}
              <input
                type="email"
                id="email"
                name="email"
                value={editEmail}
                onChange={handleInputChange}
                className={classes.input_field}
                required
              />
                         {" "}
            </div>
                       {" "}
            <div className={classes.form_group}>
                           {" "}
              <label htmlFor="password">
                                <Key className={classes["icon-label"]} /> New
                Password                 (optional):              {" "}
              </label>
                           {" "}
              <input
                type="password"
                id="password"
                name="password"
                value={editPassword}
                onChange={handleInputChange}
                className={classes.input_field}
                placeholder="Leave blank to keep current password"
              />
                         {" "}
            </div>
                       {" "}
            <div className={classes.form_group}>
                           {" "}
              <label htmlFor="confirmPassword">
                                <Key className={classes["icon-label"]} />{" "}
                Confirm New Password:              {" "}
              </label>
                           {" "}
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                className={classes.input_field}
              />
                         {" "}
            </div>
                       {" "}
            <div className={classes.button_group}>
                           {" "}
              <button type="submit" className={classes.save_btn}>
                                <Save className={classes["icon-button"]} /> Save
                Changes              {" "}
              </button>
                           {" "}
              <button
                type="button"
                onClick={handleCancelClick}
                className={classes.cancel_btn}
              >
                                <XCircle className={classes["icon-button"]} />{" "}
                Cancel              {" "}
              </button>
                         {" "}
            </div>
                     {" "}
          </form>
        ) : (
          <div className={classes["profile-details"]}>
                                    {/* Added a class for consistent spacing */}
                       {" "}
            <p>
                            <User className={classes["icon-detail"]} />        
                    <strong>Full Name:</strong> {fullname}           {" "}
            </p>
                       {" "}
            <p>
                            <User className={classes["icon-detail"]} />        
                    <strong>Username:</strong> {username}           {" "}
            </p>
                       {" "}
            <p>
                            <Mail className={classes["icon-detail"]} />        
                    <strong>Email:</strong> {email}           {" "}
            </p>
                       {" "}
            <p>
                            <CalendarDays className={classes["icon-detail"]} />{" "}
                            <strong>Registered Date:</strong>              {" "}
              {created_at ? new Date(created_at).toLocaleDateString() : "N/A"} 
                       {" "}
            </p>
                       {" "}
            <button onClick={handleEditClick} className={classes.edit_btn}>
                            <Edit className={classes["icon-button"]} /> Edit
              Profile            {" "}
            </button>
                     {" "}
          </div>
        )}
             {" "}
      </div>
         {" "}
    </div>
  );
}

export default UserProfile;
