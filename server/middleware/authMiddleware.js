const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config(); // Ensure dotenv is configured to load .env variables

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Log the incoming Authorization header for debugging
  console.log("AuthMiddleware: Received Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(
      'AuthMiddleware: Missing or invalid "Bearer" token format. Request will be denied.'
    );
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "Authentication invalid: No token provided or wrong format.",
    });
  }

  try {
    // Extract the token part after "Bearer "
    const token = authHeader.split(" ")[1];

    // Get the secret from environment variables
    const secret = process.env.JWT_SECRET;

    // CRITICAL DEBUGGING LOG: Show the secret being used by the middleware
    if (!secret) {
      console.error(
        "AuthMiddleware: FATAL ERROR - JWT_SECRET is NOT defined in .env file!"
      );
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Server configuration error: JWT_SECRET missing." });
    }
    console.log(
      "AuthMiddleware: JWT_SECRET currently loaded and used:",
      secret
    ); // <<--- CHECK THIS LOG CAREFULLY!

    // Verify the token
    const decoded = jwt.verify(token, secret);
    console.log("AuthMiddleware: Successfully decoded JWT payload:", decoded); // Log the full decoded payload

    let extractedUsername = decoded.username;
    let extractedUserid = decoded.userid || decoded.id;
    if (decoded.user && typeof decoded.user === "object") {
      extractedUsername = decoded.user.username || extractedUsername;
      extractedUserid =
        decoded.user.userid || decoded.user.id || extractedUserid;
    }

    if (!extractedUsername || !extractedUserid) {
      console.error(
        "AuthMiddleware: Missing username or userid after decoding token. Decoded:",
        decoded
      );
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "Authentication invalid: User details missing in token payload.",
      });
    }

    // Attach user info to the request object
    req.user = { username: extractedUsername, userid: extractedUserid };
    // If avatar_url is consistently included in the token payload, extract and attach it here too.
    if (decoded.avatar_url) {
      // Check if avatar_url exists directly in decoded payload
      req.user.avatar_url = decoded.avatar_url;
    } else if (decoded.user && decoded.user.avatar_url) {
      // Check if it's nested under 'user'
      req.user.avatar_url = decoded.user.avatar_url;
    }

    console.log("AuthMiddleware: User authenticated:", req.user);

    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    console.error("AuthMiddleware: Token verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication invalid: Token has expired." });
    } else if (error.name === "JsonWebTokenError") {
      // This is the most likely error if JWT_SECRET mismatch or malformed token
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "Authentication invalid: Token is malformed or signature is invalid.",
      });
    }
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication invalid: " + error.message });
  }
}

module.exports = authMiddleware;
