
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, RefreshCw, Upload } from "lucide-react";
import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';


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
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction>(null);

  const model = useRef<tflite.TFLiteModel | null>(null);
  const labels = useRef<string[] | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        console.log("Starting model load...");

        // Initialize TFLite
        console.log("Initializing TensorFlow.js...");
        await tf.ready();
        console.log("TensorFlow.js ready");

        console.log("Setting WASM path...");
        // Use non-SIMD version to avoid 404 errors
        tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.8/dist/');
        console.log("WASM path set");

        console.log("Loading model from:", MODEL_PATH);
        console.log("Loading labels from:", LABELS_PATH);

        const [loadedModel, labelsResponse] = await Promise.all([
          tflite.loadTFLiteModel(MODEL_PATH),
          fetch(LABELS_PATH)
        ]);

        console.log("Model loaded:", loadedModel);
        model.current = loadedModel;

        const labelsText = await labelsResponse.text();
        labels.current = labelsText.split('\n').filter(l => l.trim());
        console.log("Labels loaded:", labels.current);

        console.log("Model ready! model.current:", model.current !== null);
        console.log("Labels ready! labels.current:", labels.current !== null);

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
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, [toast]);

  const handleCapture = async (imageDataUrl: string) => {
    console.log("handleCapture called");
    console.log("model.current:", model.current);
    console.log("labels.current:", labels.current);

    if (!model.current || !labels.current) {
        console.error("Model or labels not ready!");
        toast({
          variant: "destructive",
          title: "Model Not Ready",
          description: "The AI model is still loading. Please wait a moment.",
        });
        return;
    }
    setCapturedImage(imageDataUrl);
    setIsProcessing(true);
    setPrediction(null);

    try {
        const img = document.createElement('img');
        img.src = imageDataUrl;
        await new Promise(resolve => img.onload = resolve);

        const tfImg = tf.browser.fromPixels(img);
        const resizedImg = tf.image.resizeBilinear(tfImg, [MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT]);

        // Convert to uint8 format (0-255) as expected by the model
        const uint8Img = tf.cast(resizedImg, 'int32');
        const expandedImg = uint8Img.expandDims(0);

        const modelOutput = model.current.predict(expandedImg as any);
        const outputTensor = (Array.isArray(modelOutput) ? modelOutput[0] : modelOutput) as any as tf.Tensor;
        const rawScores = await outputTensor.data() as Float32Array;

        console.log("Raw scores from model:", Array.from(rawScores));
        console.log("Output tensor shape:", outputTensor.shape);

        // Clean up tensors
        tfImg.dispose();
        resizedImg.dispose();
        uint8Img.dispose();
        expandedImg.dispose();
        outputTensor.dispose();

        // Apply softmax to normalize the scores to probabilities (0-1)
        const scoresArray = Array.from(rawScores);
        const maxScore = Math.max(...scoresArray);
        const expScores = scoresArray.map(s => Math.exp(s - maxScore));
        const sumExpScores = expScores.reduce((a, b) => a + b, 0);
        const normalizedScores = expScores.map(s => s / sumExpScores);

        console.log("Normalized scores:", normalizedScores);
        console.log("Labels order:", labels.current);

        // INVERTED: Model outputs are reversed from labels.txt
        const cleftScore = normalizedScores[0];
        const nonCleftScore = normalizedScores[1];

        console.log("Cleft score (index 0):", cleftScore);
        console.log("Non-Cleft score (index 1):", nonCleftScore);

        let result: "Cleft" | "Non-Cleft";
        let confidence: number;

        if (cleftScore > nonCleftScore) {
            result = "Cleft";
            confidence = cleftScore;
        } else {
            result = "Non-Cleft";
            confidence = nonCleftScore;
        }

        console.log("Final prediction:", result, "Confidence:", confidence);

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
        setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPrediction(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload an image file.",
      });
      return;
    }

    // Read file and convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      handleCapture(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 p-2 sm:p-4">
      <div className="relative w-full max-w-sm h-[90vh] max-h-[800px] bg-background rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 dark:border-gray-600 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-600 rounded-b-lg z-20"></div>

        <header className="flex items-center justify-center p-4 pt-8 border-b">
          <h1 className="text-xl font-bold text-foreground">CleftDetect</h1>
        </header>

        {isModelLoading ? (
          <div className="flex-1 flex items-center justify-center bg-black">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex flex-col items-center gap-4 text-white"
            >
              <Loader2 className="w-16 h-16 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium">Loading AI Model...</p>
                <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
        <div className="flex-1 relative bg-black">
          <AnimatePresence>
            {!capturedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <CameraView onCapture={handleCapture} disabled={isProcessing} />
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
                  {isProcessing && (
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
                className="space-y-3"
              >
                 {/* The capture button is inside CameraView to link it to the camera stream directly */}
                 <div className="relative">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleFileUpload}
                     className="hidden"
                     id="file-upload"
                     disabled={isProcessing}
                   />
                   <label htmlFor="file-upload">
                     <Button
                       variant="outline"
                       className="w-full"
                       disabled={isProcessing}
                       asChild
                     >
                       <span className="cursor-pointer">
                         <Upload className="mr-2 h-4 w-4" />
                         Upload Photo
                       </span>
                     </Button>
                   </label>
                 </div>
              </motion.div>
            ) : !isProcessing && prediction ? (
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
                    {isProcessing && <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing...</span></div>}
                    {!isProcessing && !capturedImage && <p>Press capture to begin</p>}
                </motion.div>
            )}
          </AnimatePresence>
        </footer>

        <HelpOverlay />
          </>
        )}
      </div>
    </main>
  );
}
