"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { WorldENSResolverABI } from "@/constants/abi";
import { toast } from "sonner";

const CONTRACT_ADDRESS = "0x3Df0C30a02221FAb4fbdE6Ae7dd288F00F563bBF";
const WORLDCHAIN_MAINNET_RPC = "https://rpc.worldcoin.org";
const EXPLORER_URL = "https://explorer.worldcoin.org/tx/";

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
  const router = useRouter();

  useEffect(() => {
    const fetchVerificationData = async () => {
      try {
        setIsLoading(true);

        // Fetch Self verification data
        const selfResponse = await fetch("/api/self/status");
        const selfResult = await selfResponse.json();

        if (selfResult.success) {
          setSelfData(selfResult.data);
        } else {
          toast.error("Failed to fetch Self verification data");
          router.push("/verify-self");
        }

        // Fetch World ID verification data
        const worldIdResponse = await fetch("/api/worldid/status");
        const worldIdResult = await worldIdResponse.json();

        if (worldIdResult.success) {
          setWorldIdData(worldIdResult.data);
        } else {
          toast.error("Failed to fetch World ID verification data");
          router.push("/verify-world");
        }
      } catch (error) {
        console.error("Error fetching verification data:", error);
        toast.error("Failed to fetch verification data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationData();
  }, [router]);

  const handleMint = async () => {
    if (!selfData || !worldIdData) return;

    try {
      setIsMinting(true);
      toast.loading("Starting minting process...");

      // Get the first two names for the label
      const label = selfData.label
        .split(" ")
        .slice(0, 2)
        .join(" ")
        .toLowerCase();
      setMintedName(`${label}.deeptruth.eth`);

      // Connect to Worldchain
      const provider = new ethers.JsonRpcProvider(WORLDCHAIN_MAINNET_RPC);
      const wallet = new ethers.Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY!,
        provider
      );
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        WorldENSResolverABI,
        wallet
      );

      // Convert proof to uint256[8]
      const proofArray = worldIdData.proof.map((p) => BigInt(p));
      while (proofArray.length < 8) proofArray.push(BigInt(0));

      toast.loading("Sending transaction...");

      // Call registerWithProof
      const tx = await contract.registerWithProof(
        label,
        wallet.address,
        BigInt(worldIdData.root),
        BigInt(worldIdData.nullifierHash),
        proofArray,
        BigInt(selfData.self_root)
      );

      setTxHash(tx.hash);
      toast.loading("Waiting for transaction confirmation...");

      // Wait for transaction to be mined
      await tx.wait();

      toast.success("Name minted successfully!");
      setIsSuccess(true);

      // Redirect to profile after 3 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 3000);
    } catch (error) {
      console.error("Minting error:", error);
      toast.error("Failed to mint name. Please try again.");
    } finally {
      setIsMinting(false);
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

                    {isMinting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-gray-600 dark:text-gray-400"
                      >
                        <p>Transaction Hash:</p>
                        <a
                          href={`${EXPLORER_URL}${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 hover:text-[#10b981] transition-colors"
                        >
                          {txHash.slice(0, 6)}...{txHash.slice(-4)}{" "}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </motion.div>
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
