const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(to, resetLink) {
  const mailOptions = {
    from: `MyApp <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `<p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>This link will expire in 15 minutes.</p>`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendResetEmail };
