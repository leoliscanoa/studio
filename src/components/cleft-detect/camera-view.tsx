"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CameraViewProps = {
  onCapture: (imageDataUrl: string) => void;
};

export function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
          setError(null);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(
          "Camera access denied. Please enable camera permissions in your browser settings."
        );
        setIsCameraReady(false);
      }
    } else {
      setError("Camera not supported on this device or browser.");
      setIsCameraReady(false);
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="relative w-full flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            isCameraReady ? "opacity-100" : "opacity-0"
          )}
          onCanPlay={() => setIsCameraReady(true)}
        ></video>
        {!isCameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            {error ? (
              <>
                <VideoOff className="w-12 h-12 mb-4" />
                <p className="text-sm">{error}</p>
                <Button onClick={startCamera} variant="outline" size="sm" className="mt-4">
                  Retry
                </Button>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 mb-4 animate-pulse" />
                <p>Starting camera...</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-full p-4 bg-background/10 backdrop-blur-sm absolute bottom-0 left-0 right-0 text-center">
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
        >
            <Button
                onClick={handleCapture}
                disabled={!isCameraReady}
                size="lg"
                className="w-full"
            >
                <Camera className="mr-2 h-5 w-5" />
                Capture Image
            </Button>
        </motion.div>
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
