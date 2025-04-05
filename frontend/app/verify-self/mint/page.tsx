"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
        }

        // Fetch World ID verification data
        const worldIdResponse = await fetch("/api/worldid/status");
        const worldIdResult = await worldIdResponse.json();

        if (worldIdResult.success) {
          setWorldIdData(worldIdResult.data);
        }
      } catch (error) {
        console.error("Error fetching verification data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationData();
  }, []);

  const handleMint = async () => {
    setIsLoading(true);
    try {
      // Minting logic will be integrated here
      console.log("Minting DeepName with data:", selfData, worldIdData);
      // For now, just redirect to the profile page
      router.push("/profile");
    } catch (error) {
      console.error("Error minting DeepName:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            Verification Data
          </h2>

          {!isLoading && (selfData || worldIdData) ? (
            <div className="space-y-6">
              {selfData && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Self Verification Data
                  </h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Label:</span>{" "}
                      {selfData.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Self Root:</span>{" "}
                      {selfData.self_root}
                    </p>
                  </div>
                </div>
              )}

              {worldIdData && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    World ID Proof Data
                  </h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Root:</span>{" "}
                      {worldIdData.root}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Nullifier Hash:</span>{" "}
                      {worldIdData.nullifierHash}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Proof:</span>
                      <div className="mt-1 font-mono text-xs break-all">
                        {worldIdData.proof.map((p, i) => (
                          <p key={i} className="truncate">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
              <span className="ml-2">Loading verification data...</span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="space-y-4 pt-8"
      >
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleMint}
            className="w-full py-6 text-lg brutalist-button"
            disabled={isLoading || !selfData || !worldIdData}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                MINTING...
              </>
            ) : (
              "MINT DEEPNAME"
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
