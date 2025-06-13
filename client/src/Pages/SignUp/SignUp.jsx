// import { useState } from "react";
// import classes from "./signUp.module.css";
// import { Link } from "react-router-dom";
// import { axiosInstance } from "../../utility/axios";
// import Swal from "sweetalert2";

// // Import Font Awesome icons
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

// function Signup({ onSwitch }) {
//   const [error, setError] = useState(null); // for error message
//   const [success, setSuccess] = useState(null); // for success message
//   const [showPassword, setShowPassword] = useState(false); // State for showing/hiding password
//   const [formData, setFormData] = useState({
//     username: "",
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   const handleTogglePassword = () => {
//     setShowPassword((prev) => !prev); // Toggle the visibility state
//   };

//   // validate the form data for names
//   function validateUserData(fname, lname, username) {
//     // Check if first and last names contain only letters and are at least two characters long
//     const isValidFname = /^[A-Za-z]{2,}$/.test(fname.trim());
//     const isValidLname = /^[A-Za-z]{2,}$/.test(lname.trim());

//     // Check if username is more than two characters and holds only letters and numbers
//     const isValidUserName = /^[A-Za-z0-9]+$/.test(username.trim());
//     const isValidUsernameLength = username.trim().length > 1;

//     // Return true only if all conditions are met, after that we will send the request to our API
//     return (
//       isValidFname && isValidLname && isValidUserName && isValidUsernameLength
//     );
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Send a POST request to the server to register the user
//     if (
//       !validateUserData(
//         formData.firstName,
//         formData.lastName,
//         formData.username
//       )
//     ) {
//       return await Swal.fire({
//         title: "Error",
//         text: "Please enter a valid first, last and username.  Names should contain only letters and include at least two characters",
//         icon: "error",
//         confirmButtonText: "OK",
//       });
//     }

//     try {
//       const response = await axiosInstance.post("/user/register", {
//         // Sending user registration data
//         username: formData.username,
//         firstname: formData.firstName,
//         lastname: formData.lastName,
//         email: formData.email,
//         password: formData.password,
//       });
//       setSuccess("success");

//       if (response.status === 201) {
//         setError(null); // Clear any previous errors

//         // Show a success alert for registration
//         await Swal.fire({
//           title: "Success!",
//           text: "User registered successfully! Logging in...",
//           icon: "success",
//           confirmButtonText: "OK",
//         });

//         // Immediately log the user in after we do the registration
//         try {
//           const loginResponse = await axiosInstance.post("/user/login", {
//             usernameOrEmail: formData.email, // we will make the user login with the registered email
//             password: formData.password, // The same password used for registration
//           });

//           // Check the response status after awaiting the promise
//           if (loginResponse.status === 200) {
//             // Store the JWT token (use localStorage, sessionStorage, or cookies as appropriate)
//             localStorage.setItem("token", loginResponse.data.token); // Store the token in local storage

//             // Redirect to home page
//             window.location.href = "/";
//           } else {
//             setError(
//               loginResponse.data.msg || "Login failed. Please try again."
//             );
//           }
//         } catch (error) {
//           console.error("Login error:", error);
//           setError("An error occurred during login. Please try again.");
//         }
//       } else {
//         setError(response.data.Msg);
//         await Swal.fire({
//           title: "Error",
//           text: error || "Error submitting the form. Please try again.",
//           icon: "error",
//           confirmButtonText: "OK",
//         });
//         setSuccess(null); // clear any previous success message
//       }
//     } catch (err) {
//       setError(
//         err.response?.data?.Msg ||
//           "Error submitting the form. Please try again." + err
//       );
//       await Swal.fire({
//         title: "Error",
//         text:
//           err.response?.data?.Msg ||
//           "Error submitting the form. Please try again.",
//         icon: "error",
//         confirmButtonText: "OK",
//       });
//       setSuccess(null); // clear any previous success message
//     }
//   };

//   return (
//     <div className={classes.formcontainer}>
//       <h2>Join the network</h2>
//       <p className="signin-text">
//         Already have an account?{" "}
//         <a
//           onClick={onSwitch}
//           style={{ cursor: "pointer", color: "var(--primary-color)" }}
//         >
//           Sign in
//         </a>
//       </p>
//       {error && <p className={classes.error}>{error}</p>}{" "}
//       {success && <p className={classes.success}>{success}</p>}{" "}
//       <form method="POST" onSubmit={handleSubmit}>
//         <input
//           type="text"
//           name="username"
//           placeholder="Username"
//           value={formData.username}
//           onChange={handleChange}
//           required
//         />
//         <div className={classes.nameinputs}>
//           <input
//             type="text"
//             name="firstName"
//             placeholder="First name"
//             value={formData.firstName}
//             onChange={handleChange}
//             required
//           />
//           <input
//             type="text"
//             name="lastName"
//             placeholder="Last name"
//             value={formData.lastName}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <input
//           type="email"
//           name="email"
//           placeholder="Email address"
//           value={formData.email}
//           onChange={handleChange}
//           required
//         />
//         <div className={classes.passwordinput}>
//           <input
//             type={showPassword ? "text" : "password"} // Toggle between text and password
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//           />
//           <button
//             type="button"
//             onClick={handleTogglePassword}
//             className={classes.togglebtn}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               padding: "0 5px", // Adjust padding as needed
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
//           </button>
//           <div style={{ padding: "5px", fontSize: "14px" }}>
//             I agree to the <Link to="/privacyPolicy">privacy policy</Link> and{" "}
//             <Link to="/terms">terms of service</Link>.
//           </div>
//         </div>
//         <button type="submit" className={classes.submitbtn}>
//           Agree and Join
//         </button>
//         <p className={classes.signintext}>
//           <a
//             onClick={onSwitch}
//             style={{ cursor: "pointer", color: "var(--primary-color)" }}
//           >
//             Already have an account?
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }

// export default Signup;
import { useState } from "react";
import classes from "./signUp.module.css";
import { Link } from "react-router-dom";
import { axiosInstance } from "../../utility/axios";
import Swal from "sweetalert2";

// Import Font Awesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function Signup({ onSwitch }) {
  const [error, setError] = useState(null); // for error message
  const [success, setSuccess] = useState(null); // for success message
  const [showPassword, setShowPassword] = useState(false); // State for showing/hiding password
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
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
    setShowPassword((prev) => !prev); // Toggle the visibility state
  };

  // validate the form data for names
  function validateUserData(fname, lname, username) {
    // Check if first and last names contain only letters and are at least two characters long
    const isValidFname = /^[A-Za-z]{2,}$/.test(fname.trim());
    const isValidLname = /^[A-Za-z]{2,}$/.test(lname.trim());

    // Check if username is more than two characters and holds only letters and numbers
    const isValidUserName = /^[A-Za-z0-9]+$/.test(username.trim());
    const isValidUsernameLength = username.trim().length > 1;

    // Return true only if all conditions are met, after that we will send the request to our API
    return (
      isValidFname && isValidLname && isValidUserName && isValidUsernameLength
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Send a POST request to the server to register the user
    if (
      !validateUserData(
        formData.firstName,
        formData.lastName,
        formData.username
      )
    ) {
      return await Swal.fire({
        title: "Error",
        text: "Please enter a valid first, last and username. Names should contain only letters and include at least two characters",
        icon: "error",
        confirmButtonText: "OK",
      });
    }

    try {
      const response = await axiosInstance.post("/user/register", {
        // Sending user registration data
        username: formData.username,
        firstName: formData.firstName, // CHANGED: 'firstName' (camelCase) to match backend
        lastName: formData.lastName, // CHANGED: 'lastName' (camelCase) to match backend
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201) {
        setError(null); // Clear any previous errors

        await Swal.fire({
          title: "Registration Successful!",
          text: "Please check your email to verify your account before logging in.",
          icon: "success",
          confirmButtonText: "OK",
        });

        setSuccess(
          "Registration successful! Please check your email to verify your account."
        );
        setFormData({
          username: "",
          firstName: "",
          lastName: "",
          email: "",
          password: "",
        }); // Clear form
      } else {
        setError(
          response.data.Msg || "Error submitting the form. Please try again."
        );
        await Swal.fire({
          title: "Error",
          text:
            response.data.Msg || "Error submitting the form. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
        setSuccess(null); // clear any previous success message
      }
    } catch (err) {
      setError(
        err.response?.data?.Msg ||
          "Error submitting the form. Please try again. " + err.message
      );
      await Swal.fire({
        title: "Error",
        text:
          err.response?.data?.Msg ||
          "Error submitting the form. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setSuccess(null); // clear any previous success message
    }
  };

  return (
    <div className={classes.formcontainer}>
      <h2>Join the network</h2>
      <p className="signin-text">
        Already have an account?{" "}
        <a
          onClick={onSwitch}
          style={{ cursor: "pointer", color: "var(--primary-color)" }}
        >
          Sign in
        </a>
      </p>
      {error && <p className={classes.error}>{error}</p>}{" "}
      {success && <p className={classes.success}>{success}</p>}{" "}
      <form method="POST" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <div className={classes.nameinputs}>
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <div className={classes.passwordinput}>
          <input
            type={showPassword ? "text" : "password"} // Toggle between text and password
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={handleTogglePassword}
            className={classes.togglebtn}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 5px", // Adjust padding as needed
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
          </button>
          <div style={{ padding: "5px", fontSize: "14px" }}>
            I agree to the <Link to="/privacyPolicy">privacy policy</Link> and{" "}
            <Link to="/terms">terms of service</Link>.
          </div>
        </div>
        <button type="submit" className={classes.submitbtn}>
          Agree and Join
        </button>
        <p className={classes.signintext}>
          <a
            onClick={onSwitch}
            style={{ cursor: "pointer", color: "var(--primary-color)" }}
          >
            Already have an account?
          </a>
        </p>
      </form>
    </div>
  );
}

export default Signup;
