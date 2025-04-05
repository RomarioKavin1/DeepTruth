"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { WorldENSResolverABI } from "@/constants/abi";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";

const CONTRACT_ADDRESS = "0x3Df0C30a02221FAb4fbdE6Ae7dd288F00F563bBF";
const WORLDCHAIN_MAINNET_RPC = "https://worldchain.drpc.org";
const EXPLORER_URL = "https://worldscan.org/tx/";

interface SelfVerificationData {
  label: string;
  self_root: string;
}

interface WorldIdVerificationData {
  root: string;
  nullifierHash: string;
  proof: string[];
}

export default function MintPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mintedName, setMintedName] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selfData, setSelfData] = useState<SelfVerificationData | null>(null);
  const [worldIdData, setWorldIdData] =
    useState<WorldIdVerificationData | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const router = useRouter();

  // FOR TESTING: Use URL query parameters if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const label = urlParams.get("label");
    const self_root = urlParams.get("self_root");
    const root = urlParams.get("root");
    const nullifierHash = urlParams.get("nullifierHash");

    // Check if we have proof parameters
    const proofParams = [];
    for (let i = 0; i < 8; i++) {
      const proofValue = urlParams.get(`proof${i}`);
      if (proofValue) {
        proofParams.push(proofValue);
      }
    }

    // If we have all params from the URL, set them directly
    if (label && self_root && root && nullifierHash && proofParams.length > 0) {
      toast.info("Using URL parameters for verification data");

      setSelfData({
        label,
        self_root,
      });

      setWorldIdData({
        root,
        nullifierHash,
        proof: proofParams,
      });
    } else {
      // Otherwise fetch from API
      fetchVerificationData();
    }
  }, []);

  const fetchVerificationData = async () => {
    try {
      setIsLoading(true);
      toast.loading("Fetching verification data...");

      // Fetch Self verification data
      const selfResponse = await fetch("/api/self/status");
      const selfResult = await selfResponse.json();

      if (selfResult.success) {
        setSelfData(selfResult.data);
      } else {
        toast.error("Failed to fetch Self verification data");
        // Don't redirect immediately, allow other fallbacks to try
      }

      // Fetch World ID verification data
      const worldIdResponse = await fetch("/api/worldid/status");
      const worldIdResult = await worldIdResponse.json();

      if (worldIdResult.success) {
        setWorldIdData(worldIdResult.data);
      } else {
        toast.error("Failed to fetch World ID verification data");
        // Don't redirect immediately, allow other fallbacks to try
      }

      // If both failed, try alternate data source
      if (!selfResult.success && !worldIdResult.success) {
        toast.loading("Trying alternate data source...");
        // Try localStorage if available
        try {
          const storedData = localStorage.getItem("deepNameMintData");
          if (storedData) {
            const parsedData = JSON.parse(storedData);

            setSelfData({
              label: parsedData.label,
              self_root: parsedData.self_root,
            });

            setWorldIdData({
              root: parsedData.root,
              nullifierHash: parsedData.nullifierHash,
              proof: parsedData.proof,
            });

            toast.success("Retrieved data from local storage");
          } else {
            // Redirect if no data is available
            toast.error("No verification data found");
            router.push("/verify-self");
          }
        } catch (error) {
          console.error("Local storage access error:", error);
          // Redirect as last resort
          router.push("/verify-self");
        }
      }
    } catch (error) {
      console.error("Error fetching verification data:", error);
      toast.error("Failed to fetch verification data");
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  // Add this function before handleMint
  const splitProofIntoUint256Array = (proofString: string) => {
    if (!proofString) return Array(8).fill(BigInt(0));

    // Remove 0x prefix if present
    const cleanProof = proofString.startsWith("0x")
      ? proofString.slice(2)
      : proofString;

    // The proof should be split into 8 equal parts
    // Each uint256 value is 64 characters (32 bytes) in hex
    const segmentLength = 64;
    const result = [];

    // Create 8 segments
    for (let i = 0; i < 8; i++) {
      // Calculate start position
      const start = i * segmentLength;

      // If we have data for this segment, use it; otherwise use 0
      if (start < cleanProof.length) {
        // Get up to 64 characters
        const end = Math.min(start + segmentLength, cleanProof.length);
        const segment = cleanProof.slice(start, end);

        // Pad with zeros if less than 64 characters
        const paddedSegment = segment.padEnd(segmentLength, "0");

        // Convert to BigInt
        try {
          result.push(BigInt("0x" + paddedSegment));
        } catch (e) {
          console.warn(`Failed to convert segment ${i} to BigInt, using 0`, e);
          result.push(BigInt(0));
        }
      } else {
        // If no data for this segment, use 0
        result.push(BigInt(0));
      }
    }

    return result;
  };

  // Update the proof handling in handleMint
  const handleMint = async () => {
    if (!selfData || !worldIdData) {
      toast.error("Missing verification data", {
        description: "Please complete all verification steps first.",
      });
      return;
    }

    try {
      setIsMinting(true);
      setErrorDetails(null);
      toast.loading("Starting minting process...");

      // Get the first two names for the label
      const label = selfData.label
        .split(" ")
        .slice(0, 2)
        .join("")
        .toLowerCase();
      setMintedName(`${label}.deeptruth.eth`);

      // Check for owner address
      const ownerAddress = "0xf26244365e64f40d24307904d66659008d50cc00";
      if (!ownerAddress) {
        console.error("Owner address is null or undefined");
        setErrorDetails(
          "Missing wallet address from World App. Please try reconnecting."
        );
        toast.error("Missing wallet address");
        setIsMinting(false);
        return;
      }

      // Validate address format
      if (!ethers.isAddress(ownerAddress)) {
        console.error("Invalid owner address format:", ownerAddress);
        setErrorDetails(`Invalid wallet address format: ${ownerAddress}`);
        toast.error("Invalid wallet address format");
        setIsMinting(false);
        return;
      }

      // Try to connect to Worldchain
      let provider;
      try {
        provider = new ethers.JsonRpcProvider(WORLDCHAIN_MAINNET_RPC);
        await provider.getNetwork(); // Test the connection
      } catch (providerError) {
        console.error("Provider connection error:", providerError);
        setErrorDetails(
          "Failed to connect to Worldchain RPC. Please try again later."
        );
        toast.error("Blockchain connection error");
        setIsMinting(false);
        return;
      }

      // Get the private key from env
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      if (!privateKey) {
        console.error("Private key not found in environment variables");
        setErrorDetails(
          "Contract wallet configuration error. Please contact support."
        );
        toast.error("Configuration error");
        setIsMinting(false);
        return;
      }

      // Create wallet instance
      const wallet = new ethers.Wallet(privateKey, provider);
      console.log("Using wallet address for minting:", wallet.address);

      // Create contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        WorldENSResolverABI,
        wallet
      );

      // Convert and validate proof elements
      try {
        // Convert proof to uint256[8] using the new function
        const proofArray = splitProofIntoUint256Array(worldIdData.proof[0]);
        console.log("Proof array:", proofArray);

        // Validate root and nullifierHash
        if (!worldIdData.root) throw new Error("World ID root is null");
        if (!worldIdData.nullifierHash)
          throw new Error("NullifierHash is null");
        if (!selfData.self_root) throw new Error("Self root is null");

        toast.loading("Sending transaction to blockchain...");

        // Log the exact parameters we're sending to the contract
        console.log("Calling registerWithProof with:", {
          label,
          owner: ownerAddress,
          root: worldIdData.root,
          nullifierHash: worldIdData.nullifierHash,
          proofLength: proofArray.length,
          self_root: selfData.self_root,
        });

        // Call registerWithProof with explicit type conversions
        const tx = await contract.registerWithProof(
          label,
          ownerAddress,
          BigInt(worldIdData.root),
          BigInt(worldIdData.nullifierHash),
          proofArray,
          BigInt(selfData.self_root),
          {
            gasLimit: 1000000,
          }
        );

        console.log("Transaction sent:", tx.hash);
        setTxHash(tx.hash);
        toast.loading("Waiting for transaction confirmation...");

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log("Transaction confirmed!", receipt);

        toast.success("Name minted successfully!");
        setIsSuccess(true);

        // Clear any stored data
        try {
          localStorage.removeItem("deepNameMintData");
        } catch (e) {
          // Ignore localStorage errors
          console.log("Error removing localStorage item:", e);
        }

        // Redirect to profile after 3 seconds
        setTimeout(() => {
          router.push("/profile");
        }, 3000);
      } catch (validationError: unknown) {
        console.error("Data validation error:", validationError);
        if (validationError instanceof Error) {
          setErrorDetails(`Validation error: ${validationError.message}`);
        } else {
          setErrorDetails("Unknown validation error occurred");
        }
        toast.error("Data validation error");
        setIsMinting(false);
        return;
      }
    } catch (error) {
      console.error("Minting error:", error);

      // Determine error message based on the error
      let errorMessage = "Failed to mint name. Please try again.";
      if (error instanceof Error) {
        setErrorDetails(error.message);

        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected.";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction.";
        } else if (error.message.includes("gas")) {
          errorMessage = "Gas estimation failed. The transaction may fail.";
        } else if (error.message.includes("nonce")) {
          errorMessage = "Nonce error. Please refresh and try again.";
        } else if (
          error.message.includes("null") ||
          error.message.includes("undefined")
        ) {
          errorMessage = "Missing required data. Please check all parameters.";
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsMinting(false);
      toast.dismiss();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      {/* Background elements */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 bg-[#10b981] rounded-full opacity-20"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-32 h-32 bg-[#10b981] rounded-full opacity-20"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#10b981] opacity-10"
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: "linear",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md text-center space-y-8 z-10"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="brutalist-box p-8 bg-white dark:bg-black"
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-[#10b981] mx-auto" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-black dark:text-white"
                >
                  Name Minted Successfully!
                </motion.h2>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-mono text-[#10b981]"
                >
                  {mintedName}
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <a
                    href={`${EXPLORER_URL}${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 hover:text-[#10b981] transition-colors"
                  >
                    View Transaction <ExternalLink className="h-4 w-4" />
                  </a>
                </motion.div>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-gray-600 dark:text-gray-400"
                >
                  Redirecting to profile...
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="mint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Debug Parameters Box */}
                <div className="mt-4 mb-2 border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer">
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                        Debug Parameters
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 group-open:hidden">
                        Click to expand
                      </span>
                    </summary>
                    <div className="p-3 bg-white dark:bg-gray-900 text-xs">
                      <div className="space-y-2 font-mono text-left">
                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                          <span className="font-bold text-gray-500 dark:text-gray-400">
                            Label:
                          </span>
                          <span className="truncate">
                            {selfData?.label || "N/A"}
                          </span>

                          <span className="font-bold text-gray-500 dark:text-gray-400">
                            Owner:
                          </span>
                          <span className="truncate">
                            {MiniKit.user?.walletAddress || "N/A"}
                          </span>

                          <span className="font-bold text-gray-500 dark:text-gray-400">
                            Root:
                          </span>
                          <span className="truncate">
                            {worldIdData?.root || "N/A"}
                          </span>

                          <span className="font-bold text-gray-500 dark:text-gray-400">
                            NullifierHash:
                          </span>
                          <span className="truncate">
                            {worldIdData?.nullifierHash || "N/A"}
                          </span>

                          <span className="font-bold text-gray-500 dark:text-gray-400">
                            Self Root:
                          </span>
                          <span className="truncate">
                            {selfData?.self_root || "N/A"}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 dark:text-gray-400">
                            Proof Array:
                          </span>
                          <div className="mt-1 pl-2 space-y-1 max-h-32 overflow-y-auto">
                            {worldIdData?.proof ? (
                              worldIdData.proof.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-[2rem_1fr] gap-1"
                                >
                                  <span className="text-gray-500">
                                    [{idx}]:
                                  </span>
                                  <span className="truncate">{item}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-500">
                                No proof data available
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                // Try to copy all params to clipboard
                                const params = {
                                  label: selfData?.label,
                                  owner:
                                    "0xf26244365e64f40d24307904d66659008d50cc00",
                                  root: worldIdData?.root,
                                  nullifierHash: worldIdData?.nullifierHash,
                                  self_root: selfData?.self_root,
                                  proof: worldIdData?.proof,
                                };
                                navigator.clipboard.writeText(
                                  JSON.stringify(params, null, 2)
                                );
                                toast.success("Copied parameters to clipboard");
                              } catch (e) {
                                toast.error("Failed to copy parameters");
                                console.error(e);
                              }
                            }}
                            className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Copy to clipboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
                <motion.h1
                  className="text-4xl font-bold tracking-tight text-black dark:text-white mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  MINT YOUR <span className="text-[#10b981]">DEEPNAME</span>
                </motion.h1>
                {!isLoading && selfData ? (
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Your name will be:
                      </p>
                      <p className="text-2xl font-mono text-[#10b981]">
                        {selfData.label
                          .split(" ")
                          .slice(0, 2)
                          .join(" ")
                          .toLowerCase()}
                        .deeptruth.eth
                      </p>
                    </motion.div>

                    {/* Status display */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selfData ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <p>Self data: {selfData ? "Ready" : "Missing"}</p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            worldIdData ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <p>
                          World ID data: {worldIdData ? "Ready" : "Missing"}
                        </p>
                      </div>
                    </div>

                    {isMinting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-gray-600 dark:text-gray-400"
                      >
                        <p>Transaction Hash:</p>
                        {txHash ? (
                          <a
                            href={`${EXPLORER_URL}${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 hover:text-[#10b981] transition-colors"
                          >
                            {txHash.slice(0, 6)}...{txHash.slice(-4)}{" "}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <p className="text-sm italic">
                            Preparing transaction...
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Error details */}
                    {errorDetails && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Error: {errorDetails}
                        </p>
                      </div>
                    )}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.8 }}
                      className="space-y-4 pt-8"
                    >
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Button
                          onClick={handleMint}
                          className="w-full py-6 text-lg brutalist-button"
                          disabled={
                            isLoading || isMinting || !selfData || !worldIdData
                          }
                        >
                          {isMinting ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-center"
                            >
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              <span>MINTING...</span>
                            </motion.div>
                          ) : (
                            "MINT DEEPNAME"
                          )}
                        </Button>
                      </motion.div>

                      {/* Debug button for development only - remove in production */}
                      <div className="text-xs text-gray-500">
                        <button
                          onClick={() => {
                            if (selfData && worldIdData) {
                              console.log("Self data:", selfData);
                              console.log("World ID data:", worldIdData);
                              alert(
                                `Debug: Data loaded\nLabel: ${
                                  selfData.label
                                }\nSelf root: ${selfData.self_root.substring(
                                  0,
                                  10
                                )}...\nWorld root: ${worldIdData.root.substring(
                                  0,
                                  10
                                )}...\nProof elements: ${
                                  worldIdData.proof.length
                                }`
                              );
                            } else {
                              alert("Missing verification data");
                            }
                          }}
                          className="underline"
                        >
                          Debug info
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      Loading verification data...
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
