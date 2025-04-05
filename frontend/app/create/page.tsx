"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Video, Check, X, RotateCw, ArrowLeft } from "lucide-react";

export default function CreatePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera");
    }
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    startCamera(isFrontCamera ? "environment" : "user");
  };

  const startRecording = () => {
    if (!stream) return;

    const mimeType = "video/mp4";

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2500000,
    });
    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);
    setRecordingTime(0);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      setShowPreview(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    mediaRecorder.start(100);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    setShowPreview(false);
    setRecordedChunks([]);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (recordedChunks.length === 0) {
      toast.error("No video recorded");
      return;
    }

    const blob = new Blob(recordedChunks, { type: "video/mp4" });
    const formData = new FormData();
    formData.append("video", blob);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Video uploaded successfully");
        router.push("/verify-self/mint");
      } else {
        toast.error("Failed to upload video");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      <div className="h-screen w-screen flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
          <Button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <div className="flex-1 flex justify-end">
            <h1 className="text-xl font-bold text-white transformorigin-center">
              CREATE YOUR <span className="text-[#10b981]">DEEP TRUTH</span>
            </h1>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {showPreview && recordedChunks.length > 0 && (
            <video
              ref={previewRef}
              src={URL.createObjectURL(
                new Blob(recordedChunks, { type: "video/mp4" })
              )}
              controls
              className="absolute inset-0 w-full h-full"
              autoPlay
              playsInline
            />
          )}
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              <span className="font-bold text-sm">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}
          {stream && !showPreview && (
            <div className="absolute top-4 left-4">
              <Button
                onClick={switchCamera}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
              >
                <RotateCw className="w-6 h-6 text-white" />
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center space-x-6">
          {!stream ? (
            <Button
              onClick={() => startCamera()}
              className="w-16 h-16 rounded-full bg-[#10b981] hover:bg-[#0d8c6a]"
            >
              <Camera className="w-8 h-8 text-white" />
            </Button>
          ) : showPreview ? (
            <div className="flex space-x-4">
              <Button
                onClick={retakeVideo}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
              >
                <X className="w-8 h-8 text-white" />
              </Button>
              <Button
                onClick={handleSubmit}
                className="w-16 h-16 rounded-full bg-[#10b981] hover:bg-[#0d8c6a]"
              >
                <Check className="w-8 h-8 text-white" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#10b981] hover:bg-[#0d8c6a]"
              }`}
            >
              {isRecording ? (
                <div className="w-8 h-8 bg-white rounded" />
              ) : (
                <div className="w-8 h-8 bg-white rounded-full" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
