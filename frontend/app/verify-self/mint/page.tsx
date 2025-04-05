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
    if (!selfData || !worldIdData) return;

    try {
      setIsLoading(true);
      // Here you would call your contract function with the data
      console.log("Contract function call data:", {
        // Self data
        label: selfData.label,
        self_root: selfData.self_root,

        // World ID data
        root: worldIdData.root,
        nullifierHash: worldIdData.nullifierHash,
        proof: worldIdData.proof,
      });

      // After successful mint, redirect to profile
      router.push("/profile");
    } catch (error) {
      console.error("Minting error:", error);
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
            Verification Data for Contract Call
          </h2>

          {!isLoading && (selfData || worldIdData) ? (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Contract Function Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Self Data
                    </h4>
                    <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded">
                      <p>label: "{selfData?.label}"</p>
                      <p>self_root: "{selfData?.self_root}"</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      World ID Data
                    </h4>
                    <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded">
                      <p>root: "{worldIdData?.root}"</p>
                      <p>nullifierHash: "{worldIdData?.nullifierHash}"</p>
                      <p>proof: [</p>
                      {worldIdData?.proof.map((p, i) => (
                        <p key={i} className="ml-4">
                          "{p}"{i < worldIdData.proof.length - 1 ? "," : ""}
                        </p>
                      ))}
                      <p>]</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleMint}
                className="w-full py-6 text-lg"
                disabled={isLoading || !selfData || !worldIdData}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Minting...
                  </>
                ) : (
                  "Mint DeepName"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
              <span className="ml-2">Loading verification data...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
