"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MiniKit } from "@worldcoin/minikit-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function VerifyWorldPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signInWithWallet = async () => {
    setIsLoading(true);
    try {
      if (!MiniKit.isInstalled()) {
        toast.error("World App is not installed");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/nonce`);
      const { nonce } = await res.json();

      const { commandPayload: generateMessageResult, finalPayload } =
        await MiniKit.commandsAsync.walletAuth({
          nonce: nonce,
          requestId: "0",
          expirationTime: new Date(
            new Date().getTime() + 7 * 24 * 60 * 60 * 1000
          ),
          notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          statement:
            "This is my statement and here is a link https://worldcoin.com/apps",
        });

      if (finalPayload.status === "error") {
        toast.error("Error during wallet authentication");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });

      const { status, isValid } = await response.json();

      if (status === "success" && isValid) {
        toast.success("Successfully signed in with Worldcoin");
        router.push("/verify-self");
      } else {
        toast.error("Error signing in with Worldcoin");
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      toast.error("An error occurred during sign in");
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
            PROOF OF <span className="text-[#10b981]">HUMANITY</span>
          </motion.h1>

          <div className="space-y-4">
            <motion.p
              className="text-gray-800 dark:text-gray-200 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Verify your humanity using World ID
            </motion.p>
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
              onClick={signInWithWallet}
              className="w-full py-6 text-lg brutalist-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  VERIFYING HUMANITY...
                </>
              ) : (
                "VERIFY WITH WORLD ID"
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
