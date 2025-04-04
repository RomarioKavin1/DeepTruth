"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Step2Page() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelfVerification = async () => {
    setIsLoading(true);
    try {
      // Self Protocol verification will be integrated here
      console.log("Self Protocol verification");
      // For now, just redirect to the mint page
      router.push("/verify-self/mint");
    } catch (error) {
      console.error("Error verifying with Self Protocol:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      {/* Background elements */}
      <motion.div
        className="absolute top-10 left-10 w-32 h-32 bg-[#10b981] opacity-10"
        animate={{
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 20,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-24 h-24 bg-[#10b981] opacity-10"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 8,
          ease: "easeInOut",
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
            PROOF OF <span className="text-[#10b981]">NAME</span>
          </motion.h1>

          <div className="space-y-4">
            <motion.p
              className="text-gray-800 dark:text-gray-200 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Verify your name using Self Protocol
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
              onClick={handleSelfVerification}
              className="w-full py-6 text-lg brutalist-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  VERIFYING NAME...
                </>
              ) : (
                "VERIFY WITH SELF PROTOCOL"
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
