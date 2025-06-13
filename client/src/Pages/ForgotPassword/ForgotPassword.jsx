// ForgotPassword.jsx
import { useState } from "react";
import { axiosInstance } from "../../utility/axios"; // Assuming this path is correct
import Swal from "sweetalert2";
import styles from "./ForgotPassword.module.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Missing Email",
        text: "Please enter your email address.",
      });
      return;
    }

    try {
      Swal.fire({
        title: "Sending reset link...",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
      });

      // CHANGED: Path is now '/user/forgot-password' as baseURL covers '/api/v1'
      const res = await axiosInstance.post("/user/forgot-password", { email });

      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Email Sent!",
        text: res.data.msg || "A reset link has been sent to your email.",
        timer: 4000,
        timerProgressBar: true,
      });

      setEmail("");
    } catch (err) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.msg || "Something went wrong. Try again.",
      });
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Forgot Password</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          placeholder="Enter your email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className={styles.button}>
          Send Reset Link
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
