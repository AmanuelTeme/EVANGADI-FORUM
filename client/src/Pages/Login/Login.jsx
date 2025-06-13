import { useState, useContext } from "react";
import { axiosInstance } from "../../utility/axios.js";
import classes from "./login.module.css";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { UserState } from "../../App.jsx";
function Login({ onSwitch }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/user/Login", {
        usernameOrEmail: formData.usernameOrEmail,
        password: formData.password,
      });
      // console.log(response.data)
      localStorage.setItem("token", response.data.token); // Store the token in local storage
      window.location.href = "/"; // This will navigate to the / page and refresh the application
      if (response.status === 200) {
        setSuccess("Login successful! Redirecting...");
        await Swal.fire({
          title: "Success!",
          text: "User Loggedin successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        setError(null);
      } else {
        setError(response.data.msg || "Login failed.");
        await Swal.fire({
          title: "Error",
          text:
            response.data.msg || "Error submitting the form. Please try again",
          icon: "error",
          confirmButtonText: "OK",
        });
        setSuccess(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.msg || "Error logging in. Please try again." + err
      );
      await Swal.fire({
        title: "Error",
        text:
          err.response?.data?.msg ||
          "Error submitting the form. Please try again",
        icon: "error",
        confirmButtonText: "OK",
      });
      setSuccess(null);
    }
  };

  return (
    <div className={classes.formcontainer}>
      <div className={classes.innerContainer}>
        <div className={classes.heading}>
          <h2 className={classes.title}>Login to your account</h2>
          <p className={classes.signuptext}>
            Don't have an account?{" "}
            <a
              onClick={onSwitch}
              style={{ cursor: "pointer", color: "var(--primary-color)" }}
            >
              create a new account
            </a>
          </p>
          {error && (
            <p className={classes.error} style={{ marginBottom: "10px" }}>
              {error}
            </p>
          )}{" "}
          {success && <p className={classes.success}>{success}</p>}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="usernameOrEmail"
            placeholder="User name or Email"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            required
          />
          <div className={classes.passwordinput}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={handleTogglePassword}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </button>
          </div>
          <p className={classes.forgotpasswordtext}>
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
          <button type="submit" className={classes.submitbtn}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
