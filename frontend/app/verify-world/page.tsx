"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function VerifyWorld() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSignIn = async () => {
    await signIn("worldcoin", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] dark:bg-black p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">
            Verify with <span className="text-[#10b981]">World ID</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Prove your humanity and access exclusive features
          </p>
        </div>

        {error && (
          <div className="p-4 text-red-600 bg-red-100 dark:bg-red-900/20 rounded-lg">
            {error === "Callback"
              ? "Verification failed. Please try again."
              : error}
          </div>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pt-4"
        >
          <Button
            onClick={handleSignIn}
            className="w-full brutalist-button flex items-center justify-center space-x-2 bg-[#10b981] hover:bg-[#0d9668] text-white py-6"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign in with World ID</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
