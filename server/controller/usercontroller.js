// userController.js
const bcrypt = require("bcryptjs"); // Use bcryptjs as per your current code
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes"); // For better HTTP status management
const dbConnection = require("../config/dbConfig"); // Corrected variable name to match your dbConfig
const crypto = require("crypto"); // For generating tokens
const nodemailer = require("nodemailer"); // For sending emails
require("dotenv").config(); // Ensure dotenv is configured if not already in app.js

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Or 'smtp', etc., based on your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.BASE_URL}/verify-email/${token}`; // BASE_URL from your .env
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email for Evangadi Forum",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0d6efd;">Welcome to Evangadi Forum!</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">
          Thank you for registering with <strong>Evangadi Forum</strong>!
          Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #0d6efd; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 16px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #555;">
          This link will expire in 1 hour.
        </p>
        <p style="font-size: 14px; color: #555;">
          If you did not register for an account, please ignore this email.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 14px; color: #777;">
          Best regards,<br/>
          The <strong>Evangadi Team</strong>
        </p>
      </div>
    `,
  };

  try {
    console.log(
      `Attempting to send verification email to ${email} with link: ${verificationLink}`
    );
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Error sending verification email to ${email}:`, error);
    throw new Error("Failed to send verification email.");
  }
};

// Helper function to send password reset email (integrated Nodemailer directly)
const sendResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request for Evangadi Forum",
    html: `
            <p>Hello,</p>
            <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <p>Best regards,</p>
            <p>The Evangadi Team</p>
        `,
  };

  try {
    console.log(
      `Attempting to send password reset email to ${email} with link: ${resetLink}`
    );
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    throw new Error("Failed to send password reset email.");
  }
};

// Register a new user
async function register(req, res) {
  const { username, firstName, lastName, email, password } = req.body;

  if (!username || !firstName || !lastName || !email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ Msg: "All fields are required." });
  }

  if (password.length < 8) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ Msg: "Password should be at least 8 characters long." });
  }

  try {
    // Check if username or email already exists
    const [existingUsers] = await dbConnection.query(
      "SELECT userid FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ Msg: "Username or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex"); // Generate a random token
    const tokenExpires = new Date(Date.now() + 3600000); // Token expires in 1 hour (3600000 ms)

    console.log(
      `Register: Generated verification token for ${email}: ${verificationToken}`
    );
    console.log(`Register: Token expires at: ${tokenExpires}`);

    // Using 'firstname' and 'lastname' to match your actual database schema
    await dbConnection.query(
      "INSERT INTO users (username, firstname, lastname, email, password, verification_token, token_expires_at, is_verified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        username,
        firstName,
        lastName,
        email,
        hashedPassword,
        verificationToken,
        tokenExpires,
        false,
        new Date(),
      ]
    );

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(StatusCodes.CREATED).json({
      Msg: "User registered successfully! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Server error during registration." });
  }
}

// Verify user email
async function verifyEmail(req, res) {
  const { token } = req.params;
  console.log(`VerifyEmail: Received token from URL: ${token}`);

  try {
    const [users] = await dbConnection.query(
      "SELECT userid, is_verified, token_expires_at, email FROM users WHERE verification_token = ?",
      [token]
    );
    console.log(
      `VerifyEmail: Database query result for token '${token}':`,
      users
    );

    let user;
    if (users.length === 0) {
      console.log(
        "VerifyEmail: No user found for this token (or token was already used)."
      );

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ Msg: "Invalid or expired verification link." });
    }

    user = users[0]; // Set user if found
    console.log("VerifyEmail: Found user:", user);

    if (user.is_verified) {
      console.log("VerifyEmail: Email already verified for user:", user.userid);
      // If already verified, still return success, as the action is effectively complete
      return res
        .status(StatusCodes.OK)
        .json({ Msg: "Email already verified." });
    }

    const expirationDate = new Date(user.token_expires_at);
    const currentDate = new Date();

    console.log(
      `VerifyEmail: Token expiration date from DB: ${expirationDate.toISOString()}`
    );
    console.log(`VerifyEmail: Current date: ${currentDate.toISOString()}`);
    console.log(
      `VerifyEmail: Is token expired? ${
        expirationDate.getTime() < currentDate.getTime()
      }`
    );

    if (expirationDate.getTime() < currentDate.getTime()) {
      console.log("VerifyEmail: Token has expired.");
      return res.status(StatusCodes.BAD_REQUEST).json({
        Msg: "Verification link has expired. Please request a new one.",
      });
    }

    // If all checks pass, then update the user's status
    const [updateResult] = await dbConnection.query(
      "UPDATE users SET is_verified = ?, verification_token = NULL, token_expires_at = NULL WHERE userid = ?",
      [true, user.userid]
    );

    if (updateResult.affectedRows === 0) {
      console.error(
        "VerifyEmail: Failed to update user verification status. No rows affected."
      );
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        Msg: "Failed to update verification status. Please try again.",
      });
    }

    console.log(
      "VerifyEmail: User successfully verified and token cleared for user:",
      user.userid
    );
    console.log("VerifyEmail: Sending success response to frontend.");
    res
      .status(StatusCodes.OK)
      .json({ Msg: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Error verifying email:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Server error during email verification." });
  }
}

// Login user
async function login(req, res) {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      Msg: "Your email or password is incorrect. Please check your details and try again.",
    });
  }

  try {
    const [users] = await dbConnection.query(
      "SELECT userid, username, email, password, is_verified, avatar_url FROM users WHERE email = ? OR username = ?",
      [usernameOrEmail, usernameOrEmail]
    );

    if (users.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "Invalid credentials. Please check your details and try again.",
      });
    }

    const user = users[0];

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(StatusCodes.FORBIDDEN).json({
        Msg: "Please verify your email address before logging in. Check your inbox for a verification link.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid credentials. Please check your details and try again.",
      });
    }

    const token = jwt.sign(
      {
        userid: user.userid,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    res.status(StatusCodes.OK).json({
      Msg: "Logged in successfully!",
      token: token,
      user: {
        userid: user.userid,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Internal server error." });
  }
}

// Forgot Password
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({ Msg: "Email required." });
  }

  try {
    const [users] = await dbConnection.query(
      "SELECT userid FROM users WHERE email = ?",
      [email]
    );

    // Security: Always return a success message even if email not found
    // to prevent email enumeration.
    if (users.length === 0) {
      return res.status(StatusCodes.OK).json({
        Msg: "If a matching account is found, a password reset link will be sent to your email.",
      });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour (3600000 ms)

    await dbConnection.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE userid = ?",
      [resetToken, resetTokenExpires, user.userid]
    );

    const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    await sendResetEmail(email, resetLink);

    return res
      .status(StatusCodes.OK)
      .json({ Msg: "Password reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Server error." });
  }
}

// Reset Password
async function resetPassword(req, res) {
  const { token } = req.params; // token from URL
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ Msg: "Token and new password are required." });
  }

  if (newPassword.length < 8) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ Msg: "Password must be at least 8 characters." });
  }

  try {
    const [users] = await dbConnection.query(
      "SELECT userid, reset_password_expires FROM users WHERE reset_password_token = ?",
      [token]
    );

    if (users.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ Msg: "Invalid or expired password reset token." });
    }

    const user = users[0];
    const now = new Date();

    if (
      !user.reset_password_expires ||
      now > new Date(user.reset_password_expires)
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ Msg: "Reset token expired." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await dbConnection.query(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE userid = ?",
      [hashedPassword, user.userid]
    );

    res.status(StatusCodes.OK).json({ Msg: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Server error during password reset." });
  }
}

async function check(req, res) {
  const username = req.user.username;
  const userid = req.user.userid;
  const avatar_url = req.user.avatar_url; // Ensure avatar_url is part of your JWT payload

  return res
    .status(StatusCodes.OK)
    .json({ user: { username, userid, avatar_url } });
}

async function getUserProfileById(req, res) {
  const { userid } = req.params;

  try {
    // Select 'firstname' and 'lastname' to match your database schema
    const [user] = await dbConnection.query(
      "SELECT userid, username, firstname, lastname, email, avatar_url, createdAt, is_verified FROM users WHERE userid = ?",
      [userid]
    );

    if (user.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "User not found.",
      });
    }

    const userData = user[0];
    // Ensure you construct fullname correctly from 'firstname' and 'lastname'
    const fullname = `${userData.firstname} ${userData.lastname}`;

    return res.status(StatusCodes.OK).json({
      fullname: fullname,
      username: userData.username,
      email: userData.email,
      avatar_url: userData.avatar_url,
      created_at: userData.createdAt,
      is_verified: userData.is_verified,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Internal server error while fetching user profile." });
  }
}

async function updateUserProfile(req, res) {
  const { userid } = req.params;
  const authenticatedUserId = req.user?.userid; // Assuming req.user is populated by authMiddleware

  const { fullname, username, email, password, avatar_url } = req.body;

  let firstname, lastname;
  if (fullname !== undefined) {
    // Check if fullname is provided
    const nameParts = fullname.split(" ");
    firstname = nameParts[0];
    lastname = nameParts.slice(1).join(" ") || ""; // Handle multi-word last names or no last name
  } else {
    // If fullname is not provided, you might need to get firstname/lastname from DB or handle as error
    // For simplicity, let's assume fullname is always passed if names are being updated.
    // Or you could accept firstName and lastName directly in req.body
    return res.status(StatusCodes.BAD_REQUEST).json({
      Msg: "Full name is required for profile updates.",
    });
  }

  if (!username || !email) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      Msg: "Username and email are required fields.",
    });
  }

  if (authenticatedUserId && parseInt(userid) !== authenticatedUserId) {
    return res.status(StatusCodes.FORBIDDEN).json({
      Msg: "You are not authorized to update this user's profile.",
    });
  }

  try {
    let updateQuery = `
            UPDATE users
            SET firstname = ?, lastname = ?, username = ?, email = ?
        `;
    const queryParams = [firstname, lastname, username, email];

    if (avatar_url !== undefined) {
      updateQuery += `, avatar_url = ?`;
      queryParams.push(avatar_url);
    }

    if (password) {
      if (password.length < 8) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          Msg: "New password must be at least 8 characters long.",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = ?`;
      queryParams.push(hashedPassword);
    }

    updateQuery += ` WHERE userid = ?`;
    queryParams.push(userid);

    const [result] = await dbConnection.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        Msg: "User not found or no changes were made.",
      });
    }

    return res.status(StatusCodes.OK).json({
      msg: "Profile updated successfully!",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(StatusCodes.CONFLICT).json({
        Msg: "The provided username or email is already in use. Please choose a different one.",
      });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ Msg: "Internal server error while updating profile." });
  }
}

async function getAllUsers(req, res) {
  // You might want to restrict this to admin users only
  // Example: if (!req.user.isAdmin) return res.status(StatusCodes.FORBIDDEN).json({ Msg: "Unauthorized." });
  try {
    // Selecting all relevant user data, including is_verified status
    const [users] = await dbConnection.query(
      "SELECT userid, username, email, firstname, lastname, avatar_url, is_verified, createdAt FROM users ORDER BY username ASC"
    );
    res.status(StatusCodes.OK).json({ users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Server error fetching all users.",
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
  verifyEmail, // Make sure to export this new function
  forgotPassword,
  resetPassword,
  check,
  getUserProfileById,
  updateUserProfile,
  getAllUsers,
};
