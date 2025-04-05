"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";

const CONTRACT_ADDRESS = "0xCd0838dBb89975aDc8eD8d8bd262bC72EC10EC00";
const VideoRegistryABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "videoCID",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "transcriptCID",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "VideoUploaded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "videoCID",
        type: "string",
      },
    ],
    name: "getVideoByCID",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "videoCID",
            type: "string",
          },
          {
            internalType: "string",
            name: "transcriptCID",
            type: "string",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
        ],
        internalType: "struct VideoRegistry.Video",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "getVideosByAddress",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "videoCID",
            type: "string",
          },
          {
            internalType: "string",
            name: "transcriptCID",
            type: "string",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
        ],
        internalType: "struct VideoRegistry.Video[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "videoCID",
        type: "string",
      },
      {
        internalType: "string",
        name: "transcriptCID",
        type: "string",
      },
    ],
    name: "uploadVideo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default function UploadPage() {
  const router = useRouter();
  const [videoCID, setVideoCID] = useState("");
  const [transcriptCID, setTranscriptCID] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!videoCID || !transcriptCID) {
      toast.error("Please enter both video and transcript CIDs");
      return;
    }

    if (!MiniKit.isInstalled()) {
      toast.error("Please install World App");
      return;
    }

    try {
      setIsUploading(true);
      toast.loading("Uploading video...");
      console.log("Uploading video...");
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESS,
            abi: VideoRegistryABI,
            functionName: "uploadVideo",
            args: [134, 1234],
          },
        ],
      });

      if (finalPayload.status === "error") {
        console.error("Error uploading video:", finalPayload);
        toast.error("Failed to upload video");
      } else {
        toast.success("Video uploaded successfully!");
        router.push("/profile");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] dark:bg-black p-4">
      <motion.div
        className="max-w-md mx-auto w-full space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            UPLOAD <span className="text-[#10b981]">VIDEO</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload your video and transcript to the blockchain
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoCID">Video CID</Label>
            <Input
              id="videoCID"
              placeholder="Enter video CID"
              value={videoCID}
              onChange={(e) => setVideoCID(e.target.value)}
              className="brutalist-box"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcriptCID">Transcript CID</Label>
            <Input
              id="transcriptCID"
              placeholder="Enter transcript CID"
              value={transcriptCID}
              onChange={(e) => setTranscriptCID(e.target.value)}
              className="brutalist-box"
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full brutalist-button"
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
