import Database from "better-sqlite3";
import path from "path";

interface WorldIdVerificationData {
  root: string;
  nullifierHash: string;
  proof: string[];
  timestamp?: number;
}

interface WorldIdVerificationDataRow {
  root: string;
  nullifierHash: string;
  proof: string;
  timestamp: number;
}

// Initialize database
const db = new Database(path.join(process.cwd(), "worldid_verification.db"));

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS worldid_verification_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    root TEXT NOT NULL,
    nullifierHash TEXT NOT NULL,
    proof TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);

export function storeWorldIdVerificationData(
  data: Omit<WorldIdVerificationData, "timestamp">
) {
  // Clear any existing data
  db.prepare("DELETE FROM worldid_verification_data").run();

  // Insert new data
  const stmt = db.prepare(`
    INSERT INTO worldid_verification_data (
      root, nullifierHash, proof, timestamp
    ) VALUES (?, ?, ?, ?)
  `);

  stmt.run(
    data.root,
    data.nullifierHash,
    JSON.stringify(data.proof),
    Date.now()
  );
}

export function getWorldIdVerificationData(): WorldIdVerificationData | null {
  const row = db
    .prepare(
      "SELECT * FROM worldid_verification_data ORDER BY timestamp DESC LIMIT 1"
    )
    .get() as WorldIdVerificationDataRow | undefined;

  if (!row) {
    return null;
  }

  return {
    root: row.root,
    nullifierHash: row.nullifierHash,
    proof: JSON.parse(row.proof),
    timestamp: row.timestamp,
  };
}

export function clearWorldIdVerificationData() {
  db.prepare("DELETE FROM worldid_verification_data").run();
}
