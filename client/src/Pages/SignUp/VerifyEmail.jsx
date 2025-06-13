import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../utility/axios";
import Swal from "sweetalert2";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const hasVerifiedAttempted = useRef(false);

  useEffect(() => {
    let isComponentMounted = true;

    const verifyUserEmail = async () => {
      if (hasVerifiedAttempted.current || !isComponentMounted) return;
      hasVerifiedAttempted.current = true;

      Swal.fire({
        title: "Verifying Email...",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
      });

      try {
        const response = await axiosInstance.get(`/user/verify-email/${token}`);
        Swal.close();

        setVerificationStatus("success");
        setMessage(
          response.data?.Msg || "Your email has been successfully verified!"
        );

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: response.data?.Msg || "Email Verified!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });

        // ✅ Redirect to /auth route after success
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } catch (error) {
        Swal.close();
        setVerificationStatus("error");
        const errorMsg =
          error.response?.data?.Msg ||
          "Verification failed. Please try again later.";
        setMessage(errorMsg);

        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: errorMsg,
          confirmButtonText: "OK",
        });
      }
    };

    if (token) {
      verifyUserEmail();
    } else {
      setVerificationStatus("error");
      setMessage("No verification token found in the URL.");
      Swal.fire({
        icon: "error",
        title: "Missing Token",
        text: "No verification token found in the URL.",
        confirmButtonText: "OK",
      });
    }

    return () => {
      isComponentMounted = false;
    };
  }, [token, navigate]);

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "20px",
        textAlign: "center",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      {verificationStatus === "verifying" && (
        <>
          <h2>Verifying Your Email...</h2>
          <p>Please wait while we confirm your email address.</p>
        </>
      )}
      {verificationStatus === "success" && (
        <>
          <h2>Email Verified!</h2>
          <p>{message}</p>
        </>
      )}
      {verificationStatus === "error" && (
        <>
          <h2>Verification Failed</h2>
          <p style={{ color: "red" }}>{message}</p>
          <button
            onClick={() => navigate("/signup")}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Go to Signup
          </button>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
