import Database from "better-sqlite3";
import path from "path";

interface VerificationData {
  // Self Proof data
  label: string;
  self_root: string;
  userId: string;
  timestamp?: number;
}

interface VerificationDataRow {
  label: string;
  self_root: string;
  userId: string;
  timestamp: number;
}

// Initialize database
const db = new Database(path.join(process.cwd(), "verification.db"));
console.log(
  "Database initialized at:",
  path.join(process.cwd(), "verification.db")
);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS verification_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    self_root TEXT NOT NULL,
    userId TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);
console.log("Database table created or already exists");

export function storeVerificationData(
  data: Omit<VerificationData, "timestamp">
) {
  console.log("Storing data in database:", data);
  // Clear any existing data
  db.prepare("DELETE FROM verification_data").run();

  // Insert new data
  const stmt = db.prepare(`
    INSERT INTO verification_data (
      label, self_root, userId, timestamp
    ) VALUES (?, ?, ?, ?)
  `);

  stmt.run(data.label, data.self_root, data.userId, Date.now());
  console.log("Data stored successfully");
}

export function getVerificationData(): VerificationData | null {
  console.log("Retrieving data from database");
  const row = db
    .prepare("SELECT * FROM verification_data ORDER BY timestamp DESC LIMIT 1")
    .get() as VerificationDataRow | undefined;

  if (!row) {
    console.log("No data found in database");
    return null;
  }

  console.log("Data retrieved from database:", row);
  return {
    label: row.label,
    self_root: row.self_root,
    userId: row.userId,
    timestamp: row.timestamp,
  };
}

export function clearVerificationData() {
  console.log("Clearing database");
  db.prepare("DELETE FROM verification_data").run();
  console.log("Database cleared");
}
