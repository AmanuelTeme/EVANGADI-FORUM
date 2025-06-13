const db = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

// Helper to generate a reset token (JWT with user email, expires in 1 hour)
function generateResetToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    const [users] = await db.query(
      "SELECT userid, email FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ msg: "No user found with this email" });
    }

    const user = users[0];
    const resetToken = generateResetToken(user.email);

    // Save reset token and expiration in DB (you'll need to add these columns in your users table)
    await db.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE userid = ?",
      [resetToken, user.userid]
    );

    // TODO: Send reset email with link including token (for now just respond with token)
    // e.g., frontend URL: http://localhost:5173/reset-password?token=resetToken

    res.json({
      msg: "Password reset link sent to your email.",
      resetToken, // REMOVE this in production; only for testing!
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ msg: "Token and new password are required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    // Check if token matches the one in DB and is not expired
    const [users] = await db.query(
      "SELECT userid, reset_password_token, reset_password_expires FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = users[0];

    if (
      user.reset_password_token !== token ||
      new Date(user.reset_password_expires) < new Date()
    ) {
      return res.status(400).json({ msg: "Reset token is invalid or expired" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password, clear reset token & expiration
    await db.query(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE userid = ?",
      [hashedPassword, user.userid]
    );

    res.json({ msg: "Password has been reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ msg: "Reset token expired" });
    }
    res.status(500).json({ msg: "Server error" });
  }
};
