"use client";

import { motion } from "framer-motion";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import type { Prediction } from "@/app/page";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type PredictionDisplayProps = {
  prediction: Prediction;
};

export function PredictionDisplay({ prediction }: PredictionDisplayProps) {
  if (!prediction) return null;

  const { result, confidence, scores } = prediction;
  const confidencePercent = (confidence * 100).toFixed(1);

  const getConfidenceColor = () => {
    if (confidence > 0.8) return "bg-success";
    if (confidence > 0.6) return "bg-warning";
    return "bg-destructive";
  };

  const Icon =
    result === "Cleft" ? (
      <XCircle className="w-6 h-6 text-destructive" />
    ) : (
      <CheckCircle2 className="w-6 h-6 text-success" />
    );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cursor-pointer"
        >
          <Card className="bg-secondary/50 hover:bg-secondary transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {Icon}
                    <span>{result}</span>
                  </CardTitle>
                  <CardDescription>Confidence: {confidencePercent}%</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <HelpCircle className="w-3 h-3"/>
                    <span>Click for details</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <Progress
                value={confidence * 100}
                className="h-3"
                indicatorClassName={getConfidenceColor()}
              />
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Prediction Details</DialogTitle>
          <DialogDescription>
            The model's confidence scores for each class.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Cleft</span>
              <span className="font-mono text-lg">
                {(scores.cleft * 100).toFixed(2)}%
              </span>
            </div>
            <Progress value={scores.cleft * 100} indicatorClassName={cn(result === 'Cleft' && getConfidenceColor())} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Non-Cleft</span>
              <span className="font-mono text-lg">
                {(scores.nonCleft * 100).toFixed(2)}%
              </span>
            </div>
            <Progress value={scores.nonCleft * 100} indicatorClassName={cn(result === 'Non-Cleft' && getConfidenceColor())}/>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
