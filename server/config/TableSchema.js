// config/TableSchema.js
const dbConnection = require("./dbConfig");

async function initializeDatabase() {
  console.log("Attempting to initialize database tables...");

  try {
    // Create users table (initial creation or ensure existence)
    // NOTE: This initial CREATE TABLE should reflect the final desired schema,
    // but the ALTER TABLE statements below will handle adding new columns
    // if the table already exists from a previous version without them.
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        userid INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(20) NOT NULL UNIQUE,
        firstname VARCHAR(20) NOT NULL,
        lastname VARCHAR(20) NOT NULL,
        email VARCHAR(40) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(2048) DEFAULT NULL,
        is_verified BOOLEAN DEFAULT FALSE,         -- NEW: Email verification status
        verification_token VARCHAR(255) UNIQUE,    -- NEW: Token for email verification
        token_expires_at DATETIME,                 -- NEW: Expiration for verification token
        reset_password_token VARCHAR(255) UNIQUE,  -- NEW: Token for password reset
        reset_password_expires DATETIME,           -- NEW: Expiration for password reset token
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("Users table ensured.");

    // Create questions table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questionid VARCHAR(100) NOT NULL UNIQUE,
        userid INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        tag VARCHAR(20),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("Questions table ensured.");

    // Create answers table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        answerid INT AUTO_INCREMENT PRIMARY KEY,
        userid INT NOT NULL,
        questionid VARCHAR(100) NOT NULL,
        answer TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        rating_count INT DEFAULT 0,
        FOREIGN KEY(questionid) REFERENCES questions(questionid) ON DELETE CASCADE,
        FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("Answers table ensured.");

    // Create answer_ratings table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS answer_ratings (
        ratingid INT AUTO_INCREMENT PRIMARY KEY,
        answerid INT NOT NULL,
        userid INT NOT NULL,
        vote_type TINYINT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (answerid, userid),
        FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
        FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("Answer ratings table ensured.");

    // Create chat_history table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id INT NULL,
        role ENUM('user', 'model') NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE SET NULL
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("Chat history table ensured.");

    // Create chat_messages table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(255) NOT NULL,
        message_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        room_id VARCHAR(255) NOT NULL,
        message_type ENUM('public', 'private') NOT NULL DEFAULT 'public',
        recipient_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        edited_at DATETIME NULL,
        is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
        reactions JSON,
        file_data LONGTEXT NULL,
        file_name VARCHAR(255) NULL,
        file_type VARCHAR(50) NULL,
        FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE SET NULL,
        FOREIGN KEY (recipient_id) REFERENCES users(userid) ON DELETE SET NULL
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("Public Chat Messages table ensured.");

    // --- Conditional ALTER TABLE statements for existing databases ---

    // Function to check and add column
    const addColumnIfNotExists = async (
      tableName,
      columnName,
      columnDefinition
    ) => {
      const [columnExistsResult] = await dbConnection.query(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?;
      `,
        [tableName, columnName]
      );

      if (columnExistsResult[0].count === 0) {
        await dbConnection.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN ${columnName} ${columnDefinition};
        `);
        console.log(`Added '${columnName}' column to '${tableName}' table.`);
      } else {
        console.log(
          `'${columnName}' column already exists in '${tableName}' table.`
        );
      }
    };

    // Users table new columns
    await addColumnIfNotExists("users", "is_verified", "BOOLEAN DEFAULT FALSE");
    await addColumnIfNotExists(
      "users",
      "verification_token",
      "VARCHAR(255) UNIQUE"
    );
    await addColumnIfNotExists("users", "token_expires_at", "DATETIME");
    await addColumnIfNotExists(
      "users",
      "reset_password_token",
      "VARCHAR(255) UNIQUE"
    );
    await addColumnIfNotExists("users", "reset_password_expires", "DATETIME");

    // Existing checks (keeping for completeness, but they can use the helper now)
    await addColumnIfNotExists(
      "users",
      "avatar_url",
      "VARCHAR(2048) DEFAULT NULL"
    );
    await addColumnIfNotExists("chat_messages", "reactions", "JSON");
    await addColumnIfNotExists("chat_messages", "file_data", "LONGTEXT NULL");
    await addColumnIfNotExists(
      "chat_messages",
      "file_name",
      "VARCHAR(255) NULL"
    );
    await addColumnIfNotExists(
      "chat_messages",
      "file_type",
      "VARCHAR(50) NULL"
    );

    console.log("✅ All database tables checked/created successfully.");
  } catch (err) {
    console.error("❌ Error during database table initialization:", err);
    process.exit(1);
  }
}

module.exports = initializeDatabase;
