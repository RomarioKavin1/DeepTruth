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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>("video/webm");
  const timerRef = useRef<NodeJS.Timeout>();

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stream, previewUrl]);

  // Create and set up the preview when recorded chunks change
  useEffect(() => {
    if (recordedChunks.length > 0 && showPreview) {
      // Use MP4 format if supported, fallback to webm
      const blob = new Blob(recordedChunks, { type: videoMimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      // Ensure the preview element gets the source
      if (previewRef.current) {
        previewRef.current.src = url;

        // Once metadata is loaded, play the video
        previewRef.current.onloadedmetadata = () => {
          if (previewRef.current) {
            previewRef.current.play().catch((err) => {
              console.error("Error playing preview:", err);
              toast.error(
                "Error playing video preview. Try a different browser."
              );
            });
          }
        };
      }
    }
  }, [recordedChunks, showPreview, videoMimeType]);

  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.style.transform =
          facingMode === "user" ? "scaleX(-1)" : "none";
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

    // Try to use MP4 if supported
    let mimeType = "";
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }

    console.log("Using MIME type:", mimeType);
    setVideoMimeType(mimeType || "video/webm");

    const options = mimeType
      ? { mimeType, videoBitsPerSecond: 2500000 }
      : undefined;

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        setShowPreview(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      // Collect data frequently for smoother results
      mediaRecorder.start(100);
      setIsRecording(true);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting MediaRecorder:", error);
      toast.error("Failed to start recording. Try a different browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setShowPreview(false);
    setRecordedChunks([]);

    // Reattach stream to video element
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else {
      // Restart camera if stream is not available
      startCamera(isFrontCamera ? "user" : "environment");
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

    const blob = new Blob(recordedChunks, { type: videoMimeType });
    const fileExtension = videoMimeType === "video/mp4" ? "mp4" : "webm";
    const formData = new FormData();
    formData.append("video", blob, `recording.${fileExtension}`);

    try {
      toast.loading("Uploading video...");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Video uploaded successfully");
        router.push("/verify-self/mint");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(
          `Failed to upload video: ${errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    }
  };

  const goToFeed = () => {
    router.push("/feed");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl text-center space-y-8 z-10"
      >
        {/* Back button to /feed */}
        <div className="absolute top-4 left-4 z-20">
          <Button
            onClick={goToFeed}
            variant="ghost"
            className="flex items-center text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Feed
          </Button>
        </div>

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
            CREATE YOUR <span className="text-[#10b981]">DEEP TRUTH</span> NOW
          </motion.h1>

          <div className="relative w-full h-[60vh] max-w-3xl mx-auto mb-8 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
            {!stream && !showPreview && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* Main video (visible when not in preview mode) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                showPreview ? "hidden" : ""
              }`}
              style={{ transform: isFrontCamera ? "scaleX(-1)" : "none" }}
            />

            {/* Preview video (only visible in preview mode) */}
            {showPreview && (
              <video
                ref={previewRef}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}

            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                {formatTime(recordingTime)}
              </div>
            )}

            {stream && !showPreview && (
              <div className="absolute bottom-4 right-4">
                <Button
                  onClick={switchCamera}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70"
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-4">
            {!stream ? (
              <Button
                onClick={() => startCamera()}
                className="w-full py-6 text-lg brutalist-button"
              >
                START CAMERA
              </Button>
            ) : showPreview ? (
              <div className="flex space-x-4">
                <Button
                  onClick={retakeVideo}
                  className="flex-1 py-6 text-lg brutalist-button bg-red-500 hover:bg-red-600"
                >
                  <X className="w-5 h-5 mr-2" />
                  RETAKE
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 py-6 text-lg brutalist-button"
                >
                  <Check className="w-5 h-5 mr-2" />
                  SUBMIT
                </Button>
              </div>
            ) : (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full py-6 text-lg brutalist-button ${
                  isRecording ? "bg-red-500 hover:bg-red-600" : ""
                }`}
              >
                <Video className="w-5 h-5 mr-2" />
                {isRecording ? "STOP RECORDING" : "START RECORDING"}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
