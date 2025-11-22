"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CameraView } from "@/components/cleft-detect/camera-view";
import { PredictionDisplay } from "@/components/cleft-detect/prediction-display";
import { HelpOverlay } from "@/components/cleft-detect/help-overlay";

export type Prediction = {
  result: "Cleft" | "Non-Cleft";
  confidence: number;
  scores: {
    cleft: number;
    nonCleft: number;
  };
} | null;

export default function CleftDetectPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction>(null);

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setIsLoading(true);
    setPrediction(null);

    // Simulate model inference
    setTimeout(() => {
      const isCleft = Math.random() > 0.5;
      const confidence = 0.4 + Math.random() * 0.6; // Confidence between 40% and 100%
      
      let scores, result, finalConfidence;

      if (isCleft) {
        result = "Cleft";
        finalConfidence = confidence;
        scores = { cleft: confidence, nonCleft: 1 - confidence };
      } else {
        result = "Non-Cleft";
        finalConfidence = confidence;
        scores = { cleft: 1 - confidence, nonCleft: confidence };
      }

      setPrediction({
        result,
        confidence: finalConfidence,
        scores,
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPrediction(null);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 p-2 sm:p-4">
      <div className="relative w-full max-w-sm h-[90vh] max-h-[800px] bg-background rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 dark:border-gray-600 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-600 rounded-b-lg z-20"></div>
        
        <header className="flex items-center justify-center p-4 pt-8 border-b">
          <h1 className="text-xl font-bold text-foreground">CleftDetect</h1>
        </header>

        <div className="flex-1 relative bg-black">
          <AnimatePresence>
            {!capturedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <CameraView onCapture={handleCapture} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {capturedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <Image
                  src={capturedImage}
                  alt="Captured for analysis"
                  layout="fill"
                  objectFit="cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  {isLoading && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring" }}
                      className="flex flex-col items-center gap-4 text-white"
                    >
                      <Loader2 className="w-16 h-16 animate-spin" />
                      <p className="text-lg font-medium">Analyzing...</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <footer className="p-4 border-t">
          <AnimatePresence mode="wait">
            {!capturedImage ? (
              <motion.div
                key="capture"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
              >
                 {/* The capture button is inside CameraView to link it to the camera stream directly */}
              </motion.div>
            ) : !isLoading && prediction ? (
              <motion.div
                key="result"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="space-y-4"
              >
                <PredictionDisplay prediction={prediction} />
                <Button onClick={handleRetake} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Take New Photo
                </Button>
              </motion.div>
            ) : (
                <motion.div key="loading" className="h-[148px] flex items-center justify-center">
                    {!capturedImage && <p>Press capture to begin</p>}
                </motion.div>
            )}
          </AnimatePresence>
        </footer>

        <HelpOverlay />
      </div>
    </main>
  );
}
