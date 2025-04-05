interface VerificationData {
  // Self Proof data
  label: string;
  self_root: string;
  userId: string;

  // World ID Proof data
  owner: string;
  root: string;
  nullifierHash: string;
  proof: string[];

  timestamp?: number;
}

// In-memory storage
let verificationData: VerificationData | null = null;

export function storeVerificationData(
  data: Omit<VerificationData, "timestamp">
) {
  console.log("Storing verification data:", data);
  verificationData = {
    ...data,
    timestamp: Date.now(),
  };
  console.log("Stored verification data:", verificationData);
}

export function getVerificationData(): VerificationData | null {
  console.log("Getting verification data:", verificationData);
  return verificationData;
}

export function clearVerificationData() {
  console.log("Clearing verification data");
  verificationData = null;
}
