"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEnvironmentStore } from "@/components/providers/context";
import {
  MiniKit,
  VerifyCommandInput,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import { Check } from "lucide-react";

export default function VerifySelfPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isStep1Verified, setIsStep1Verified] = useState(false);
  const router = useRouter();
  const { worldAddress } = useEnvironmentStore((store) => store);

  // Mock data for proofs
  const [worldProof, setWorldProof] = useState<string | null>(null);
  const [selfProof, setSelfProof] = useState<string | null>(null);

  const handleStep1 = async () => {
    try {
      setIsLoading(true);

      if (!MiniKit.isInstalled()) {
        toast.error("World App is not installed");
        return;
      }

      const verifyPayload: VerifyCommandInput = {
        action: "proof-of-humanity", // This should match your action ID from the Developer Portal
        signal: worldAddress || undefined, // Using the wallet address as the signal
        verification_level: VerificationLevel.Orb,
      };

      const { finalPayload } = await MiniKit.commandsAsync.verify(
        verifyPayload
      );

      if (finalPayload.status === "error") {
        toast.error("Verification failed");
        return;
      }

      // Verify the proof in the backend
      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: "proof-of-humanity",
          signal: worldAddress || undefined,
        }),
      });

      const verifyResponseJson = await verifyResponse.json();
      console.log(verifyResponseJson);

      if (verifyResponseJson.success) {
        setWorldProof(finalPayload.proof);
        setIsStep1Verified(true);
        toast.success("Humanity verified successfully");
        setCurrentStep(2);
      } else {
        console.error("Verification failed:", verifyResponseJson.error);
        toast.error(verifyResponseJson.error || "Verification failed");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async () => {
    try {
      setIsLoading(true);
      // Mock verification process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSelfProof("mock_self_proof_456");
      toast.success("Name and age verified successfully");

      // Pass proofs as query parameters
      const queryParams = new URLSearchParams();
      if (worldProof) queryParams.set("worldProof", worldProof);
      if (selfProof) queryParams.set("selfProof", selfProof);

      router.push(`/verify-self/mint?${queryParams.toString()}`);
    } catch (error) {
      toast.error("Failed to verify name and age");
    } finally {
      setIsLoading(false);
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
          <motion.h1
            className="text-4xl font-bold tracking-tight text-black dark:text-white mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            STEPS TO MINT <span className="text-[#10b981]">DEEPNAME</span>
          </motion.h1>

          <div className="space-y-8">
            {/* Step 1 */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Step 1: Verify Humanity
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Complete the humanity verification process
              </p>
              {isStep1Verified ? (
                <div className="flex items-center justify-center space-x-2 text-[#10b981]">
                  <Check className="h-6 w-6" />
                  <span className="text-lg font-semibold">
                    Humanity verified successfully
                  </span>
                </div>
              ) : (
                <Button
                  onClick={handleStep1}
                  className="w-full py-6 text-lg brutalist-button"
                  disabled={isLoading || currentStep !== 1}
                >
                  {isLoading && currentStep === 1
                    ? "VERIFYING..."
                    : "VERIFY HUMANITY"}
                </Button>
              )}
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Step 2: Verify Name & Age
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Verify your name and age information
              </p>
              <Button
                onClick={handleStep2}
                className="w-full py-6 text-lg brutalist-button"
                disabled={isLoading || currentStep !== 2 || !worldProof}
              >
                {isLoading && currentStep === 2
                  ? "VERIFYING..."
                  : "VERIFY NAME & AGE"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
