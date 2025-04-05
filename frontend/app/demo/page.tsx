"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Demo() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
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

      {/* Header */}
      <header className="flex justify-center p-4 bg-[#f5f5f5] dark:bg-black border-b border-black dark:border-white safe-top">
        <div className="w-full max-w-3xl flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/feed")}
              className="brutalist-box bg-white dark:bg-black"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <h1 className="text-xl font-bold">
            GET <span className="text-[#10b981]">STARTED</span>
          </h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full space-y-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="brutalist-box p-8 bg-white dark:bg-black"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            <h2 className="text-2xl font-bold mb-4">Scan to Get Started</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Scan this QR code with your World App to begin your verification
              journey
            </p>

            <motion.div
              className="relative mx-auto w-64 h-64 p-4 bg-white dark:bg-black"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src="/qr.png"
                alt="World App QR Code"
                className="w-full h-full object-contain"
              />
            </motion.div>

            <div className="mt-6">
              <a
                href="https://worldcoin.org/mini-app?app_id=app_8fc33d2a1f61cc65a02c3db25559bf25&draft_id=meta_ba8da47b8c312aab6509cea434e2ca77"
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full brutalist-button">
                    Open in World App
                  </Button>
                </motion.div>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
