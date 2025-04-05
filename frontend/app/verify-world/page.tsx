"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";
import { useEnvironmentStore } from "@/components/providers/context";

export default function VerifyWorldPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setWorldAddress } = useEnvironmentStore((store) => store);

  const handleVerify = async () => {
    try {
      setIsLoading(true);

      if (!MiniKit.isInstalled()) {
        toast.error("World App is not installed");
        return;
      }

      // Get nonce from backend
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();

      // Request wallet authentication
      const { commandPayload: generateMessageResult, finalPayload } =
        await MiniKit.commandsAsync.walletAuth({
          nonce,
          requestId: "0",
          expirationTime: new Date(
            new Date().getTime() + 7 * 24 * 60 * 60 * 1000
          ),
          notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          statement: "Verify your identity with Worldcoin",
        });

      if (finalPayload.status === "error") {
        toast.error("Verification failed");
        return;
      }

      // Set the world address in the environment store
      setWorldAddress(finalPayload.address);

      // Verify the signature
      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.status === "success" && verifyData.isValid) {
        toast.success("Successfully verified with Worldcoin");
        router.push("/profile");
      } else {
        toast.error(verifyData.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h1 className="text-4xl font-bold mb-6">Verify with Worldcoin</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Connect your Worldcoin wallet to verify your identity
          </p>

          <Button
            size="lg"
            className="w-full max-w-md mx-auto"
            onClick={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify with Worldcoin"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
