
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import * as tf from '@tensorflow/tfjs';
import { TFLiteModel, loadTFLiteModel } from '@tensorflow/tfjs-tflite';


import { Button } from "@/components/ui/button";
import { CameraView } from "@/components/cleft-detect/camera-view";
import { PredictionDisplay } from "@/components/cleft-detect/prediction-display";
import { HelpOverlay } from "@/components/cleft-detect/help-overlay";
import { useToast } from "@/hooks/use-toast";

export type Prediction = {
  result: "Cleft" | "Non-Cleft";
  confidence: number;
  scores: {
    cleft: number;
    nonCleft: number;
  };
} | null;

const MODEL_PATH = "/model/model.tflite";
const LABELS_PATH = "/model/labels.txt";
const MODEL_INPUT_WIDTH = 224;
const MODEL_INPUT_HEIGHT = 224;

export default function CleftDetectPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction>(null);
  
  const model = useRef<TFLiteModel | null>(null);
  const labels = useRef<string[] | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        await tf.ready();
        const [loadedModel, labelsResponse] = await Promise.all([
          loadTFLiteModel(MODEL_PATH),
          fetch(LABELS_PATH)
        ]);

        model.current = loadedModel;
        const labelsText = await labelsResponse.text();
        labels.current = labelsText.split('\n');
        
        toast({
          title: "Model Loaded",
          description: "The AI model is ready for predictions.",
        });
      } catch (err) {
        console.error("Failed to load model:", err);
        toast({
          variant: "destructive",
          title: "Model Load Error",
          description: "Could not load the AI model. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
  }, [toast]);

  const handleCapture = async (imageDataUrl: string) => {
    if (!model.current || !labels.current) {
        toast({
          variant: "destructive",
          title: "Model Not Ready",
          description: "The AI model is still loading. Please wait a moment.",
        });
        return;
    }
    setCapturedImage(imageDataUrl);
    setIsLoading(true);
    setPrediction(null);

    try {
        const img = document.createElement('img');
        img.src = imageDataUrl;
        await new Promise(resolve => img.onload = resolve);
        
        const tfImg = tf.browser.fromPixels(img);
        const resizedImg = tf.image.resizeBilinear(tfImg, [MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT]);
        const normalizedImg = resizedImg.div(255.0);
        const expandedImg = normalizedImg.expandDims(0);
        
        const outputTensor = model.current.predict(expandedImg) as tf.Tensor;
        const scores = await outputTensor.data() as Float32Array;

        const nonCleftScore = scores[0];
        const cleftScore = scores[1];
        
        let result: "Cleft" | "Non-Cleft";
        let confidence: number;
        
        if (cleftScore > nonCleftScore) {
            result = "Cleft";
            confidence = cleftScore;
        } else {
            result = "Non-Cleft";
            confidence = nonCleftScore;
        }

        setPrediction({
            result,
            confidence,
            scores: { cleft: cleftScore, nonCleft: nonCleftScore },
        });

    } catch(err) {
        console.error("Inference error:", err);
        toast({
          variant: "destructive",
          title: "Prediction Error",
          description: "Failed to make a prediction. Please try again.",
        });
        setCapturedImage(null); // Reset on error to allow retake
    } finally {
        setIsLoading(false);
        tf.disposeVariables();
    }
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
                <CameraView onCapture={handleCapture} disabled={isLoading} />
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
                    {isLoading && <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading Model...</span></div>}
                    {!isLoading && !capturedImage && <p>Press capture to begin</p>}
                </motion.div>
            )}
          </AnimatePresence>
        </footer>

        <HelpOverlay />
      </div>
    </main>
  );
}
